import { Logger } from 'decky-plugin-framework';

import { AsyncUtils } from '../utils/async';
import { BackendUtils } from '../utils/backend';
import { Constants } from '../utils/constants';
import { Acpi, Mode, Profile, TdpPresets } from '../utils/models';
import { PluginSettings } from '../utils/settings';
import { WhiteBoardUtils } from '../utils/whiteboard';

export class Profiles {
  public static summary(): void {
    /*
      const profiles = Settings.getConfigurationStructured()['profiles'];

      let profCount = 0;
      let sortedAppIds: Array<{ appId: string; name: string }> = [];
      Object.keys(profiles).forEach((appId) => {
        sortedAppIds.push({ appId, name: profiles[appId].name });
        Object.keys(profiles[appId]).forEach((pwr) => {
          if (pwr != 'name') {
            profCount++;
          }
        });
      });
      sortedAppIds = sortedAppIds.sort((n1, n2) => {
        if (n1.appId == 'default') {
          return -1;
        } else if (n2.appId == 'default') {
          return 1;
        } else if (n1.name > n2.name) {
          return 1;
        } else if (n1.name < n2.name) {
          return -1;
        } else return 0;
      });

      Logger.info('');
      Logger.info(
        'Loaded profiles ' + profCount + ' for ' + Object.keys(profiles).length + ' games: '
      );

      const headers: Array<SpreadSheetCell> = [];
      headers.push({ data: 'NAME', align: 'center' });
      headers.push({ data: 'APPID', align: 'center' });
      headers.push({ data: 'POWER', align: 'center' });
      headers.push({ data: 'MODE', align: 'center' });
      headers.push({ data: 'SPL*', align: 'center' });
      headers.push({ data: 'SPPL*', align: 'center' });
      headers.push({ data: 'FPPL*', align: 'center' });
      headers.push({ data: 'BOOST*', align: 'center' });
      headers.push({ data: 'SCHEDULER*', align: 'center' });
      headers.push({ data: 'PCORES*', align: 'center' });
      headers.push({ data: 'ECORES*', align: 'center' });
      headers.push({ data: 'SMT*', align: 'center' });
      headers.push({ data: 'EPP*', align: 'center' });
      headers.push({ data: 'GPU FREQUENCY*', align: 'center' });

      const body: Array<Array<SpreadSheetCell>> = [];
      sortedAppIds.forEach((entry) => {
        let isFirst = true;
        Object.keys(profiles[entry.appId]).forEach((pwr) => {
          if (pwr != 'name') {
            const profile = profiles[entry.appId][pwr] as Profile;

            const line: Array<SpreadSheetCell> = [];
            line.push({
              data: isFirst ? profiles[entry.appId].name : '',
              align: 'right',
              rowspan: !isFirst
            });
            line.push({
              data: isFirst ? entry.appId : '',
              align: 'right',
              rowspan: !isFirst
            });
            line.push({ data: pwr.toUpperCase(), align: 'right' });
            line.push({ data: Mode[profile.mode].toUpperCase(), align: 'right' });
            line.push({ data: profile.cpu.tdp.spl + ' W', align: 'right' });
            line.push({ data: profile.cpu.tdp.sppl + ' W', align: 'right' });
            line.push({ data: profile.cpu.tdp.fppl + ' W', align: 'right' });
            line.push({ data: profile.cpu.boost, align: 'right' });
            line.push({
              data:
                profile.cpu.scheduler == '' || profile.cpu.scheduler == undefined
                  ? 'NONE'
                  : profile.cpu.scheduler.toUpperCase(),
              align: 'right'
            });
            line.push({
              data: profile.cpu.pcores ?? WhiteBoardUtils.getPCores(),
              align: 'right'
            });
            line.push({
              data: profile.cpu.ecores ?? WhiteBoardUtils.getECores(),
              align: 'right'
            });
            line.push({
              data: profile.cpu.smt ?? Constants.DEFAULT_SMT,
              align: 'right'
            });
            line.push({
              data: Epp[profile.cpu.epp ?? Constants.DEFAULT_EPP].toUpperCase(),
              align: 'right'
            });
            line.push({
              data:
                (profile.gpu.frequency.min || WhiteBoardUtils.getGpuMinFreq()) +
                '-' +
                (profile.gpu.frequency.max || WhiteBoardUtils.getGpuMaxFreq()) +
                ' MHz',
              align: 'right'
            });

            body.push(line);

            isFirst = false;
          }
        });
      });

      SpreadSheet.printSpreadSheet(headers, body);
      Logger.info('');
      Logger.info('* Only is used on CUSTOM mode');
      Logger.info('');*/
  }

  public static getAppId(name: string): number {
    return name == Constants.DEFAULT_DEFAULT ? -1 : (PluginSettings.getAppIdForName(name) ?? -1);
  }

  public static getFullPowerProfile(): Profile {
    const result = {
      mode: Mode.TURBO,
      cpu: {
        boost: false,
        smt: true,
        tdp: {
          spl: WhiteBoardUtils.getTdpRange()['spl'][1],
          sppl: WhiteBoardUtils.getTdpRange()['sppt'][1],
          fppl: WhiteBoardUtils.getTdpRange()['fppt'][1]
        },
        epp: Constants.DEFAULT_EPP,
        scheduler: '',
        pcores: WhiteBoardUtils.getPCores(),
        ecores: WhiteBoardUtils.getECores()
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
    return Profiles.getProfileForId(Constants.DEFAULT_DEFAULT);
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
      return Profiles.getProfileForMode(Constants.TDP_AC_DEFAULT_MODE);
    }

    if (!PluginSettings.existsProfile(id)) {
      Logger.info('No profile found for ' + id + ', creating');

      const tmpProf = Profiles.getProfileForMode(Constants.TDP_DEFAULT_MODE);
      Profiles.saveProfileForId(id, tmpProf);
      return tmpProf;
    }

    const prof = PluginSettings.getProfileForId(id)!;
    const result = {
      mode: prof.mode,
      cpu: {
        tdp: {
          spl: prof.cpu.tdp.spl,
          sppl: prof.cpu.tdp.sppl,
          fppl: prof.cpu.tdp.fppl
        },
        boost: prof.cpu.boost,
        smt: prof.cpu.smt ?? Constants.DEFAULT_SMT,
        epp: prof.cpu.epp ?? Constants.DEFAULT_EPP,
        scheduler: prof.cpu.scheduler ?? undefined,
        pcores: prof.cpu.pcores ?? WhiteBoardUtils.getPCores(),
        ecores: prof.cpu.ecores ?? WhiteBoardUtils.getECores()
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
      mode: mode,
      cpu: {
        tdp: {
          spl: map[mode].spl,
          sppl: map[mode].sppl,
          fppl: map[mode].fppl
        },
        boost: Constants.CPU_DEFAULT_BOOST,
        smt: Constants.DEFAULT_SMT,
        epp: Constants.DEFAULT_EPP,
        scheduler: '',
        pcores: WhiteBoardUtils.getPCores(),
        ecores: WhiteBoardUtils.getECores()
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
