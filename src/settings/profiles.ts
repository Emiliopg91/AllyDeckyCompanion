import { Logger, Settings } from 'decky-plugin-framework';

import { AsyncUtils } from '../utils/async';
import { BackendUtils } from '../utils/backend';
import { Constants } from '../utils/constants';
import { Acpi, Epp, Mode, Profile, TdpPresets } from '../utils/models';
import { PluginSettings } from '../utils/settings';
import { SpreadSheet, SpreadSheetCell } from '../utils/spreadsheet';
import { WhiteBoardUtils } from '../utils/whiteboard';

export class Profiles {
  public static summary(): void {
    const profiles = Settings.getConfigurationStructured()['profiles'];

    let sortedAppIds: Array<{ appId: string; name: string }> = [];
    Object.keys(profiles).forEach((name) => {
      const appId = profiles[name].appId;
      sortedAppIds.push({ appId, name });
    });
    sortedAppIds = sortedAppIds.sort((n1, n2) => {
      if (n1.name == Constants.STEAM_OS) {
        return -1;
      } else if (n2.name == Constants.STEAM_OS) {
        return 1;
      } else if (n1.name > n2.name) {
        return 1;
      } else if (n1.name < n2.name) {
        return -1;
      } else return 0;
    });

    Logger.info('');
    Logger.info('Loaded ' + Object.keys(profiles).length + ' profiles: ');

    const headers: Array<SpreadSheetCell> = [];
    headers.push({ data: 'NAME', align: 'center' });
    headers.push({ data: 'APPID', align: 'center' });
    headers.push({ data: 'MODE', align: 'center' });
    headers.push({ data: 'SPL', align: 'center' });
    headers.push({ data: 'SPPT', align: 'center' });
    headers.push({ data: 'FPPT', align: 'center' });
    headers.push({ data: 'BOOST', align: 'center' });
    headers.push({ data: 'SCHEDULER', align: 'center' });
    headers.push({ data: 'PCORES', align: 'center' });
    headers.push({ data: 'ECORES', align: 'center' });
    headers.push({ data: 'SMT', align: 'center' });
    headers.push({ data: 'EPP', align: 'center' });
    headers.push({ data: 'GPU FREQUENCY', align: 'center' });

    const tdpMap = this.getTdpMap();

    const body: Array<Array<SpreadSheetCell>> = [];
    sortedAppIds.forEach((entry) => {
      const profile = profiles[entry.name] as Profile;
      const custom = profile.mode == Mode.CUSTOM;

      const line: Array<SpreadSheetCell> = [];
      line.push({ data: entry.name, align: 'right' });
      line.push({ data: entry.appId != undefined ? entry.appId : '', align: 'right' });
      line.push({ data: Mode[profile.mode].toUpperCase(), align: 'right' });
      line.push({
        data: (custom ? profile.cpu.tdp.spl : tdpMap[profile.mode].spl) + ' W',
        align: 'right'
      });
      line.push({
        data: (custom ? profile.cpu.tdp.sppl : tdpMap[profile.mode].sppl) + ' W',
        align: 'right'
      });
      line.push({
        data: (custom ? profile.cpu.tdp.fppl : tdpMap[profile.mode].fppl) + ' W',
        align: 'right'
      });
      line.push({
        data: custom ? profile.cpu.boost : Constants.DEFAULT_CPU_BOOST,
        align: 'right'
      });
      line.push({
        data: custom
          ? profile.cpu.scheduler == '' || profile.cpu.scheduler == undefined
            ? 'NONE'
            : profile.cpu.scheduler.toUpperCase()
          : 'NONE',
        align: 'right'
      });
      line.push({
        data: custom ? profile.cpu.cores.performance : WhiteBoardUtils.getPCores(),
        align: 'right'
      });
      line.push({
        data: custom ? profile.cpu.cores.eficiency : WhiteBoardUtils.getECores(),
        align: 'right'
      });
      line.push({
        data: custom ? profile.cpu.cores.smt : Constants.DEFAULT_SMT,
        align: 'right'
      });
      line.push({
        data: Epp[custom ? profile.epp : Constants.DEFAULT_EPP].toUpperCase(),
        align: 'right'
      });
      line.push({
        data:
          (custom ? profile.gpu.frequency.min : WhiteBoardUtils.getGpuMinFreq()) +
          '-' +
          (custom ? profile.gpu.frequency.max : WhiteBoardUtils.getGpuMaxFreq()) +
          ' MHz',
        align: 'right'
      });

      body.push(line);
    });

    SpreadSheet.printSpreadSheet(headers, body);
    Logger.info('');
  }

  public static getAppId(name: string): number {
    return name == Constants.STEAM_OS ? -1 : (PluginSettings.getAppIdForName(name) ?? -1);
  }

  public static getFullPowerProfile(): Profile {
    const result = {
      appId: -1,
      epp: Constants.DEFAULT_EPP,
      mode: Mode.TURBO,
      cpu: {
        boost: false,
        tdp: {
          spl: WhiteBoardUtils.getTdpRange()['spl'][1],
          sppl: WhiteBoardUtils.getTdpRange()['sppt'][1],
          fppl: WhiteBoardUtils.getTdpRange()['fppt'][1]
        },
        scheduler: '',
        cores: {
          smt: true,
          performance: WhiteBoardUtils.getPCores(),
          eficiency: WhiteBoardUtils.getECores()
        }
      },
      gpu: {
        frequency: {
          min: WhiteBoardUtils.getGpuMinFreq(),
          max: WhiteBoardUtils.getGpuMaxFreq()
        }
      }
    };

    return result;
  }

  public static applyGameProfile(id: string): void {
    let profile: Profile = Profiles.getProfileForId(id);
    if (profile.mode != Mode.CUSTOM) {
      profile = {
        ...Profiles.getProfileForMode(profile.mode)
      };
    }
    AsyncUtils.runMutexForProfile((releaseProfile) => {
      Logger.info('Applying profile ' + id);
      BackendUtils.applyProfile(profile).finally(() => {
        releaseProfile();
      });
    });
  }

  public static getDefaultProfile(): Profile {
    return Profiles.getProfileForId(Constants.STEAM_OS);
  }

  private static tdpCache: TdpPresets | null = null;
  private static getTdpMap(): TdpPresets {
    if (Profiles.tdpCache === null) {
      if (WhiteBoardUtils.getIsAlly()) {
        Profiles.tdpCache = Constants.AllyTdpPresets;
      } else if (WhiteBoardUtils.getIsAllyX()) {
        Profiles.tdpCache = Constants.AllyXTdpPresets;
      } else if (WhiteBoardUtils.getIsXboxAlly()) {
        Profiles.tdpCache = Constants.XboxAllyTdpPresets;
      } else if (WhiteBoardUtils.getIsXboxAllyX()) {
        Profiles.tdpCache = Constants.XboxAllyXTdpPresets;
      }
    }

    return Profiles.tdpCache!;
  }

  public static getAcpiProfile(spl: number): Acpi {
    let epp = Acpi.PERFORMANCE;
    const map = Profiles.getTdpMap();
    if (spl <= map[Mode.SILENT].spl) {
      epp = Acpi.LOW_POWER;
    } else if (spl <= map[Mode.PERFORMANCE].spl) {
      epp = Acpi.BALANCED;
    }
    return epp;
  }

  public static existsProfileForId(id: string): boolean {
    return PluginSettings.existsProfile(id);
  }

  public static getProfileForId(id: string): Profile {
    if (!WhiteBoardUtils.getOnBattery()) {
      Logger.info('AC connected, turbo mode');
      return Profiles.getProfileForMode(Constants.DEFAULT_AC_MODE);
    }

    const prof = PluginSettings.getProfileForId(id)!;
    const result = {
      appId: -1,
      epp: prof.epp ?? Constants.DEFAULT_EPP,
      mode: prof.mode,
      cpu: {
        tdp: {
          spl: prof.cpu.tdp.spl,
          sppl: prof.cpu.tdp.sppl,
          fppl: prof.cpu.tdp.fppl
        },
        boost: prof.cpu.boost,
        scheduler: prof.cpu.scheduler ?? '',
        cores: {
          smt: prof.cpu.cores.smt ?? Constants.DEFAULT_SMT,
          performance: prof.cpu.cores.performance ?? WhiteBoardUtils.getPCores(),
          eficiency: prof.cpu.cores.eficiency ?? WhiteBoardUtils.getECores()
        }
      },
      gpu: {
        frequency: {
          min: Math.max(WhiteBoardUtils.getGpuMinFreq(), prof.gpu.frequency.min),
          max: Math.min(WhiteBoardUtils.getGpuMaxFreq(), prof.gpu.frequency.max)
        }
      }
    };

    return result;
  }

  public static getProfileForMode(mode: Mode): Profile {
    const map = Profiles.getTdpMap();
    const profile: Profile = {
      appId: -1,
      mode: mode,
      epp: Constants.DEFAULT_EPP,
      cpu: {
        tdp: {
          spl: map[mode].spl,
          sppl: map[mode].sppl,
          fppl: map[mode].fppl
        },
        boost: Constants.DEFAULT_CPU_BOOST,
        scheduler: '',
        cores: {
          smt: Constants.DEFAULT_SMT,
          performance: WhiteBoardUtils.getPCores(),
          eficiency: WhiteBoardUtils.getECores()
        }
      },
      gpu: {
        frequency: {
          min: WhiteBoardUtils.getGpuMinFreq(),
          max: WhiteBoardUtils.getGpuMaxFreq()
        }
      }
    };

    return profile;
  }

  public static saveProfileForId(id: string, profile: Profile): void {
    PluginSettings.setProfileForId(id, profile);
  }
}
