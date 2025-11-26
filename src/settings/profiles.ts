import { Game, Logger, Settings, Translator } from 'decky-plugin-framework';

import { AsyncUtils } from '../utils/async';
import { BackendUtils } from '../utils/backend';
import { Constants } from '../utils/constants';
import { Acpi, Epp, Governor, Mode, Profile } from '../utils/models';
import { PluginSettings } from '../utils/settings';
import { SpreadSheet, SpreadSheetCell } from '../utils/spreadsheet';
import { WhiteBoardUtils } from '../utils/whiteboard';

export class Profiles {
  public static summary(): void {
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
    headers.push({ data: 'GOVERNOR*', align: 'center' });
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
            data: Governor[profile.cpu.governor].toUpperCase(),
            align: 'right'
          });
          line.push({
            data: profile.cpu.scheduler == '' ? 'NONE' : profile.cpu.scheduler.toUpperCase(),
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
    Logger.info('');
  }

  public static getAppId(id: string): string {
    return id.substring(0, id.lastIndexOf('.'));
  }

  public static getAppName(id: string): string {
    const appId = Profiles.getAppId(id);
    if (appId == Constants.DEFAULT_DEFAULT) {
      return Translator.translate('main.menu');
    } else {
      return Game.getGameDetails(Number(appId)).getDisplayName();
    }
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
        governor: Governor.POWERSAVE,
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
      },
      display: { brightness: WhiteBoardUtils.getBrightness() },
      audio: {
        devices: {}
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result.audio.devices as any)[WhiteBoardUtils.getAudioDevice()] = {
      volume: WhiteBoardUtils.getVolume()
    };

    return result;
  }

  public static applyGameProfile(id: string): void {
    let profile: Profile = Profiles.getProfileForId(id);
    if (profile.mode != Mode.CUSTOM) {
      profile = {
        ...Profiles.getProfileForMode(profile.mode),
        display: profile.display,
        audio: profile.audio
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
    return Profiles.getProfileForId(Constants.DEFAULT_ID);
  }

  public static getDefaultACProfile(): Profile {
    return Profiles.getProfileForId(Constants.DEFAULT_ID_AC);
  }

  public static getAcpiProfile(spl: number): Acpi {
    let epp = Acpi.PERFORMANCE;
    let silentSpl = WhiteBoardUtils.getIsAllyX()
      ? Constants.AllyXSilentSPL
      : WhiteBoardUtils.getIsXboxAllyX()
        ? Constants.XboxAllyXSilentSPL
        : WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllySilentSPL
          : Constants.AllySilentSPL;
    let performanceSpl = WhiteBoardUtils.getIsAllyX()
      ? Constants.AllyXPerformanceSPL
      : WhiteBoardUtils.getIsXboxAllyX()
        ? Constants.XboxAllyXPerformanceSPL
        : WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllyPerformanceSPL
          : Constants.AllyPerformanceSPL;

    if (spl <= silentSpl) {
      epp = Acpi.LOW_POWER;
    } else if (spl <= performanceSpl) {
      epp = Acpi.BALANCED;
    }
    return epp;
  }

  public static existsProfileForId(id: string): boolean {
    return PluginSettings.existsProfile(id);
  }

  public static getProfileForId(id: string): Profile {
    if (!PluginSettings.existsProfile(id)) {
      Logger.info('No profile found for ' + id + ', creating');

      const mode = id.endsWith(Constants.SUFIX_AC)
        ? Constants.TDP_AC_DEFAULT_MODE
        : Constants.TDP_DEFAULT_MODE;
      const tmpProf = Profiles.getProfileForMode(mode);
      Profiles.saveProfileForId(id, tmpProf);
      return tmpProf;
    } else {
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
          governor: prof.cpu.governor,
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
        },
        display: {
          brightness: prof.display.brightness
        },
        audio: {
          devices: prof.audio.devices
        }
      };

      return result;
    }
  }

  public static getProfileForMode(mode: Mode): Profile {
    const profile: Profile = {
      mode: mode,
      cpu: {
        tdp: {
          spl: 0,
          sppl: 0,
          fppl: 0
        },
        boost: Constants.CPU_DEFAULT_BOOST,
        governor: Governor.POWERSAVE,
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
      },
      display: {
        brightness: WhiteBoardUtils.getBrightness()
      },
      audio: {
        devices: {}
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile.audio.devices as any)[WhiteBoardUtils.getAudioDevice()] = {
      volume: WhiteBoardUtils.getVolume()
    };

    switch (mode) {
      case Mode.SILENT:
        profile.cpu.tdp.spl = WhiteBoardUtils.getIsAllyX()
          ? Constants.AllyXSilentSPL
          : WhiteBoardUtils.getIsXboxAllyX()
            ? Constants.XboxAllyXSilentSPL
            : WhiteBoardUtils.getIsXboxAlly()
              ? Constants.XboxAllySilentSPL
              : Constants.AllySilentSPL;
        profile.cpu.tdp.sppl = WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllySilentSPL
          : Constants.AllySilentSPPL;
        profile.cpu.tdp.fppl = WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllySilentSPL
          : Constants.AllySilentFPPL;
        break;
      case Mode.PERFORMANCE:
      case Mode.CUSTOM:
        profile.cpu.tdp.spl = WhiteBoardUtils.getIsAllyX()
          ? Constants.AllyXPerformanceSPL
          : WhiteBoardUtils.getIsXboxAllyX()
            ? Constants.XboxAllyXPerformanceSPL
            : WhiteBoardUtils.getIsXboxAlly()
              ? Constants.XboxAllyPerformanceSPL
              : Constants.AllyPerformanceSPL;
        profile.cpu.tdp.sppl = WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllyPerformanceSPL
          : Constants.AllyPerformanceSPPL;
        profile.cpu.tdp.fppl = WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllyPerformanceSPL
          : Constants.AllyPerformanceFPPL;
        break;
      case Mode.TURBO:
        profile.cpu.tdp.spl = WhiteBoardUtils.getIsAllyX()
          ? Constants.AllyXTurboSPL
          : WhiteBoardUtils.getIsXboxAllyX()
            ? Constants.XboxAllyXTurboSPL
            : WhiteBoardUtils.getIsXboxAlly()
              ? Constants.XboxAllyTurboSPL
              : Constants.AllyTurboSPL;
        profile.cpu.tdp.sppl = WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllyTurboSPL
          : Constants.AllyTurboSPPL;
        profile.cpu.tdp.fppl = WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XboxAllyTurboSPL
          : Constants.AllyTurboFPPL;
    }

    return profile;
  }

  public static setBrightnessForProfileId(id: string, flBrightness: number): void {
    const profile = Profiles.getProfileForId(id);
    profile.display.brightness = flBrightness;
    Profiles.saveProfileForId(id, profile);
    Profiles.applyGameProfile(id);
  }

  public static setAudioForProfileId(id: string, device: string, volume: number): void {
    const profile = Profiles.getProfileForId(id);
    profile.audio.devices[device] = { volume };
    Profiles.saveProfileForId(id, profile);
    Profiles.applyGameProfile(id);
  }

  public static setAudioDeviceForProfileId(id: string, device: string, volume: number): void {
    const profile = Profiles.getProfileForId(id);
    if (!profile.audio.devices[device]) {
      profile.audio.devices[device] = { volume };
      Profiles.saveProfileForId(id, profile);
    }
    Profiles.applyGameProfile(id);
  }

  public static saveProfileForId(id: string, profile: Profile): void {
    PluginSettings.setProfileForId(id, Profiles.getAppName(id), profile);
  }

  public static async importFromSDTDP(): Promise<void> {
    const cfg = await BackendUtils.getSdtdpCfg();
    if (cfg && cfg.tdpProfiles) {
      Object.keys(cfg.tdpProfiles).forEach((srcId) => {
        const id = srcId.replace('-ac-power', '');
        const ac = srcId.includes('-ac-power');
        const localId = id + (ac ? Constants.SUFIX_AC : Constants.SUFIX_BAT);
        let tdp = cfg.tdpProfiles[id].tdp;
        if (tdp < 5) {
          tdp = 5;
        } else if (tdp > Constants.AllyTurboFPPL) {
          tdp = Constants.AllyTurboFPPL;
        }

        const profile: Profile = {
          mode: Mode.CUSTOM,
          cpu: {
            tdp: {
              spl: tdp,
              sppl: tdp,
              fppl: tdp
            },
            smt: cfg.tdpProfiles[id].smt,
            boost: cfg.tdpProfiles[id].cpuBoost,
            governor: Governor.POWERSAVE,
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
          },
          display: {
            brightness: WhiteBoardUtils.getBrightness()
          },
          audio: {
            devices: {}
          }
        };

        profile.audio.devices[WhiteBoardUtils.getAudioDevice()] = {
          volume: WhiteBoardUtils.getVolume()
        };

        if (!Profiles.existsProfileForId(localId)) {
          Logger.info('Importing profile ' + srcId + ' as ' + localId);
          Profiles.saveProfileForId(localId, profile);
        } else {
          Logger.info('Profile ' + srcId + ' already exists as ' + localId);
        }
      });
    }
  }
}
