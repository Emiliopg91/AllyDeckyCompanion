import { Game, Logger, Settings, Translator } from 'decky-plugin-framework';

import { AsyncUtils } from '../utils/async';
import { BackendUtils } from '../utils/backend';
import { Constants } from '../utils/constants';
import { Acpi, Governor, Mode, Profile } from '../utils/models';
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
    headers.push({ data: 'SMT*', align: 'center' });
    headers.push({ data: 'BOOST*', align: 'center' });
    headers.push({ data: 'GOVERNOR*', align: 'center' });
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
          line.push({ data: profile.cpu.smt, align: 'right' });
          line.push({ data: profile.cpu.boost, align: 'right' });
          line.push({
            data: Governor[profile.cpu.governor].toUpperCase(),
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
    return {
      mode: Mode.TURBO,
      cpu: {
        boost: false,
        smt: true,
        tdp: {
          spl: Constants.AllyTurboFPPL,
          sppl: Constants.AllyTurboFPPL,
          fppl: Constants.AllyTurboFPPL
        },
        governor: Governor.POWERSAVE
      },
      gpu: {
        frequency: {
          min: WhiteBoardUtils.getGpuMinFreq(),
          max: WhiteBoardUtils.getGpuMaxFreq()
        }
      },
      display: { brightness: WhiteBoardUtils.getBrightness() }
    };
  }

  public static applyGameProfile(id: string): void {
    let profile: Profile = Profiles.getProfileForId(id);
    if (profile.mode != Mode.CUSTOM) {
      profile = { ...Profiles.getProfileForMode(profile.mode), display: profile.display };
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
    if (spl <= Constants.AllySilentSPL) {
      epp = Acpi.QUIET;
    } else if (spl <= Constants.AllyPerformanceSPL) {
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
      return {
        mode: prof.mode,
        cpu: {
          tdp: {
            spl: prof.cpu.tdp.spl,
            sppl: prof.cpu.tdp.sppl,
            fppl: prof.cpu.tdp.fppl
          },
          boost: prof.cpu.boost,
          smt: prof.cpu.smt,
          governor: prof.cpu.governor
        },
        gpu: {
          frequency: {
            min: Math.max(WhiteBoardUtils.getGpuMinFreq(), prof.gpu.frequency.min),
            max: Math.min(WhiteBoardUtils.getGpuMaxFreq(), prof.gpu.frequency.max)
          }
        },
        display: {
          brightness: prof.display.brightness
        }
      };
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
        smt: Constants.CPU_DEFAULT_SMT,
        governor: Governor.POWERSAVE
      },
      gpu: {
        frequency: {
          min: WhiteBoardUtils.getGpuMinFreq(),
          max: WhiteBoardUtils.getGpuMaxFreq()
        }
      },
      display: {
        brightness: WhiteBoardUtils.getBrightness()
      }
    };

    switch (mode) {
      case Mode.SILENT:
        profile.cpu.tdp.spl = WhiteBoardUtils.getIsAllyX()
          ? Constants.AllyXSilentSPL
          : Constants.AllySilentSPL;
        profile.cpu.tdp.sppl = Constants.AllySilentSPPL;
        profile.cpu.tdp.fppl = Constants.AllySilentFPPL;
        break;
      case Mode.PERFORMANCE:
      case Mode.CUSTOM:
        profile.cpu.tdp.spl = WhiteBoardUtils.getIsAllyX()
          ? Constants.AllyXPerformanceSPL
          : Constants.AllyPerformanceSPL;
        profile.cpu.tdp.sppl = Constants.AllyPerformanceSPPL;
        profile.cpu.tdp.fppl = Constants.AllyPerformanceFPPL;
        break;
      case Mode.TURBO:
        profile.cpu.tdp.spl = WhiteBoardUtils.getIsAllyX()
          ? Constants.AllyXTurboSPL
          : Constants.AllyTurboSPL;
        profile.cpu.tdp.sppl = Constants.AllyTurboSPPL;
        profile.cpu.tdp.fppl = Constants.AllyTurboFPPL;
    }

    return profile;
  }

  public static setBrightnessForProfileId(id: string, flBrightness: number): void {
    const profile = Profiles.getProfileForId(id);
    profile.display.brightness = flBrightness;
    Profiles.saveProfileForId(id, profile);
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
            boost: cfg.tdpProfiles[id].cpuBoost,
            smt: cfg.tdpProfiles[id].smt,
            governor: Governor.POWERSAVE
          },
          gpu: {
            frequency: {
              min: WhiteBoardUtils.getGpuMinFreq(),
              max: WhiteBoardUtils.getGpuMaxFreq()
            }
          },
          display: {
            brightness: WhiteBoardUtils.getBrightness()
          }
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
