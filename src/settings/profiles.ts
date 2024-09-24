import { Game, Logger, Settings, Translator } from 'decky-plugin-framework';

import { AsyncUtils } from '../utils/async';
import { BackendUtils } from '../utils/backend';
import { Constants } from '../utils/constants';
import { Governor, Mode, Profile } from '../utils/models';
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
    headers.push({ data: 'GPU MIN FREQ*', align: 'center' });
    headers.push({ data: 'GPU MAX FREQ*', align: 'center' });

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
          line.push({ data: Mode[Number(profile.mode)], align: 'right' });
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
            data: (profile.gpu.frequency.min || WhiteBoardUtils.getGpuMinFreq()) + ' MHz',
            align: 'right'
          });
          line.push({
            data: (profile.gpu.frequency.max || WhiteBoardUtils.getGpuMaxFreq()) + ' MHz',
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
      }
    };
  }

  public static applyGameProfile(id: string): void {
    let profile: Profile = Profiles.getProfileForId(id);
    if (profile.mode != Mode.CUSTOM) {
      profile = Profiles.getProfileForMode(profile.mode);
    }
    AsyncUtils.runMutexForProfile((release) => {
      Logger.info('Applying profile ' + id);
      BackendUtils.setPerformanceProfile(profile).finally(() => {
        release();
      });
    });
  }

  public static getDefaultProfile(): Profile {
    return Profiles.getProfileForId(Constants.DEFAULT_ID);
  }

  public static getDefaultACProfile(): Profile {
    return Profiles.getProfileForId(Constants.DEFAULT_ID_AC);
  }

  public static existsProfileForId(id: string | number): boolean {
    return Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE) !== null;
  }

  public static getProfileForId(id: string): Profile {
    if (!Profiles.existsProfileForId(id)) {
      Logger.info('No profile found for ' + id + ', creating');

      const mode = id.endsWith(Constants.SUFIX_AC)
        ? Constants.TDP_AC_DEFAULT_MODE
        : Constants.TDP_DEFAULT_MODE;
      const tmpProf = Profiles.getProfileForMode(mode);
      Profiles.saveProfileForId(id, tmpProf);
      return tmpProf;
    } else {
      return {
        mode: Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE)),
        cpu: {
          tdp: {
            spl: Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL)),
            sppl: Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL)),
            fppl: Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL))
          },
          boost:
            Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST) == 'true',
          smt:
            Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT) == 'true',
          governor: Number(
            Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_GOVERNOR)
          )
        },
        gpu: {
          frequency: {
            min: Math.max(
              WhiteBoardUtils.getGpuMinFreq(),
              Number(
                Settings.getEntry(
                  Constants.PREFIX_PROFILES + id + Constants.SUFIX_GPU_FREQ_MIN,
                  String(WhiteBoardUtils.getGpuMinFreq())
                )
              )
            ),
            max: Math.min(
              WhiteBoardUtils.getGpuMaxFreq(),
              Number(
                Settings.getEntry(
                  Constants.PREFIX_PROFILES + id + Constants.SUFIX_GPU_FREQ_MAX,
                  String(WhiteBoardUtils.getGpuMaxFreq())
                )
              )
            )
          }
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

  public static saveProfileForId(id: string, profile: Profile): void {
    Settings.setEntry(
      Constants.PREFIX_PROFILES + Profiles.getAppId(id) + Constants.SUFIX_NAME,
      Profiles.getAppName(id),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE,
      String(profile.mode),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST,
      String(profile.cpu.boost),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT,
      String(profile.cpu.smt),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL,
      String(profile.cpu.tdp.spl),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL,
      String(profile.cpu.tdp.sppl),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL,
      String(profile.cpu.tdp.fppl),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_GPU_FREQ_MIN,
      String(profile.gpu.frequency.min),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_GPU_FREQ_MAX,
      String(profile.gpu.frequency.max),
      true
    );
    Settings.setEntry(
      Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_GOVERNOR,
      String(profile.cpu.governor),
      true
    );
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
