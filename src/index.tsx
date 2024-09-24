/* eslint-disable @typescript-eslint/ban-types */
import { definePlugin } from '@decky/api';
import { ConfirmModal, showModal, sleep, staticClasses } from '@decky/ui';
import {
  EventBus,
  EventData,
  EventType,
  Framework,
  Logger,
  Settings,
  Translator,
  WhiteBoardEventData
} from 'decky-plugin-framework';

import translations from '../assets/translations.i18n.json';
import { RogIcon } from './components/icons/rogIcon';
import { GlobalProvider } from './contexts/globalContext';
import { MainMenu } from './pages/MainMenu';
import { Profiles } from './settings/profiles';
import { SystemSettings } from './settings/system';
import { AsyncUtils } from './utils/async';
import { BackendUtils } from './utils/backend';
import { Constants } from './utils/constants';
import { CorsClient } from './utils/cors';
import { Governor, Profile } from './utils/models';
import { Toast } from './utils/toast';
import { WhiteBoardUtils } from './utils/whiteboard';

let onSuspendUnregister: Function | undefined;
let onResumeUnregister: Function | undefined;
let onGameUnregister: Function | undefined;
let onShutdownUnregister: Function | undefined;
let pluginUpdateCheckTimer: NodeJS.Timeout | undefined;
let biosUpdateCheckTimer: NodeJS.Timeout | undefined;
let runningGameIdUnregister: Function | undefined;

const checkProfilePerGame = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (!Settings.getEntry(Constants.PROFILE_PER_GAME)) {
      showModal(
        <ConfirmModal
          strTitle={Constants.PLUGIN_NAME}
          strDescription={Translator.translate('profile.per.game.ask')}
          strOKButtonText={Translator.translate('enable')}
          strCancelButtonText={Translator.translate('disable')}
          onCancel={() => {
            Settings.setEntry(Constants.PROFILE_PER_GAME, 'false', true);
            WhiteBoardUtils.setProfilePerGame(false);
            Logger.info('Disabled profile per-game');
            resolve();
          }}
          onOK={() => {
            Settings.setEntry(Constants.PROFILE_PER_GAME, 'true', true);
            WhiteBoardUtils.setProfilePerGame(true);
            Logger.info('Enabled profile per-game');
            resolve();
          }}
        />
      );
    } else {
      WhiteBoardUtils.setProfilePerGame(Settings.getEntry(Constants.PROFILE_PER_GAME) == 'true');
      resolve();
    }
  });
};

const checkPluginLatestVersion = async (): Promise<void> => {
  try {
    Logger.info('Checking for plugin update');

    const result = await fetch(
      'https://raw.githubusercontent.com/Emiliopg91/AllyDeckyCompanion/main/package.json',
      { method: 'GET' }
    );

    if (!result.ok) {
      throw new Error(result.statusText);
    }

    const vers = (await result.json())['version'];
    Logger.info('Latest plugin version: ' + vers);
    if (vers != WhiteBoardUtils.getPluginLatestVersion() && Constants.PLUGIN_VERSION != vers) {
      Logger.info('New plugin update available!');
      Toast.toast(Translator.translate('update.available'), 3000, () => {
        BackendUtils.otaUpdate();
      });
      clearInterval(pluginUpdateCheckTimer);
      pluginUpdateCheckTimer = undefined;
    }
    WhiteBoardUtils.setPluginLatestVersion(vers);
  } catch (e) {
    Logger.error('Error fetching latest plugin version', e);
    WhiteBoardUtils.setPluginLatestVersion('');
  }
};

const checkBiosLatestVersion = async (): Promise<void> => {
  try {
    Logger.info('Checking for BIOS update');

    const response = await CorsClient.fetchUrl(
      WhiteBoardUtils.getIsAllyX() ? Constants.ALLY_X_BIOS_URL : Constants.ALLY_BIOS_URL
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = await response.text();
    const versionRegex = /"Version":\s*"(\d+)"/g;
    let match;
    const versions: number[] = [];

    while ((match = versionRegex.exec(data)) !== null) {
      versions.push(Number(match[1]));
    }

    if (versions.length > 0) {
      const vers = String(Math.max(...versions));
      Logger.info('Latest BIOS version: ' + vers);
      if (
        vers != WhiteBoardUtils.getBiosLatestVersion() &&
        WhiteBoardUtils.getBiosVersion() != vers
      ) {
        Logger.info('New BIOS update available!');
        Toast.toast(Translator.translate('bios.update.available'));
        clearInterval(biosUpdateCheckTimer);
        biosUpdateCheckTimer = undefined;
      }
      WhiteBoardUtils.setBiosLatestVersion(vers);
    }
  } catch (e) {
    Logger.error('Error fetching latest BIOS version', e);
  }
};

const checkSdtdp = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    BackendUtils.isSdtdpEnabled().then((res) => {
      if (res) {
        showModal(
          <ConfirmModal
            strTitle={Constants.PLUGIN_NAME}
            strDescription={Translator.translate('disable.sdtdp.ask')}
            strCancelButtonText={Translator.translate('enable')}
            strOKButtonText={Translator.translate('disable')}
            onCancel={() => {
              WhiteBoardUtils.setSdtdpEnabled(true);
              Logger.info('SimpleDeckyTDP not disabled');
              resolve();
            }}
            onOK={() => {
              Logger.info('Disabling SimpleDeckyTDP');
              BackendUtils.disableSDTDP();
            }}
          />
        );
      } else {
        resolve();
      }
    });
  });
};

const getGpuRanges = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (WhiteBoardUtils.getIsAlly()) {
      BackendUtils.getGpuFrequencyRange().then(([min, max]) => {
        WhiteBoardUtils.setGpuMinFreq(min);
        WhiteBoardUtils.setGpuMaxFreq(max);
        Logger.info('GPU frequency range: ' + min + ' to ' + max + ' MHz');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const getBiosVersion = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (WhiteBoardUtils.getIsAlly()) {
      BackendUtils.getBiosVersion().then((biosVersion) => {
        WhiteBoardUtils.setBiosVersion(biosVersion);
        Logger.info('BIOS version ' + WhiteBoardUtils.getBiosVersion());
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const migrateSchema = (): void => {
  Logger.info('Migrating settings file schema to v' + Constants.CFG_SCHEMA_VERS);

  const batLimit = String(
    Settings.getEntry(Constants.BATTERY_LIMIT, String(Constants.DEFAULT_BATTERY_LIMIT))
  );
  if (batLimit == 'true') {
    Settings.setEntry(Constants.BATTERY_LIMIT, String(80), true);
  } else if (batLimit == 'false') {
    Settings.setEntry(Constants.BATTERY_LIMIT, String(100), true);
  }

  const { profiles } = Settings.getConfigurationStructured() as {
    profiles: Record<string, Record<string, string | Profile>>;
  };
  Object.keys(profiles).forEach((appId) => {
    Object.keys(profiles[appId]).forEach((pwr) => {
      if (typeof profiles[appId][pwr] != 'string') {
        const profile = profiles[appId][pwr] as Profile;
        if (!profile.cpu?.governor) {
          Settings.setEntry(
            Constants.PREFIX_PROFILES + appId + '.' + pwr + Constants.SUFIX_CPU_GOVERNOR,
            String(Governor.POWERSAVE),
            true
          );
        } else {
          const prevGov = String(
            Settings.getEntry(
              Constants.PREFIX_PROFILES + appId + '.' + pwr + Constants.SUFIX_CPU_GOVERNOR
            )
          );
          if (isNaN(Number(prevGov))) {
            Settings.setEntry(
              Constants.PREFIX_PROFILES + appId + '.' + pwr + Constants.SUFIX_CPU_GOVERNOR,
              String(Governor[prevGov.toUpperCase() as keyof typeof Governor]),
              true
            );
          }
        }
        if (!profile.gpu?.frequency?.min) {
          Settings.setEntry(
            Constants.PREFIX_PROFILES + appId + '.' + pwr + Constants.SUFIX_GPU_FREQ_MIN,
            '800',
            true
          );
        }
        if (!profile.gpu?.frequency?.max) {
          Settings.setEntry(
            Constants.PREFIX_PROFILES + appId + '.' + pwr + Constants.SUFIX_GPU_FREQ_MAX,
            '2700',
            true
          );
        }
      }
    });
  });

  Logger.info('Migration finished');
};

export default definePlugin(() => {
  (async (): Promise<void> => {
    await Framework.initialize(Constants.PLUGIN_NAME, Constants.PLUGIN_VERSION, translations);

    const prevSchemaVers = Settings.getEntry(
      Constants.CFG_SCHEMA_PROP,
      String(Constants.CFG_SCHEMA_VERS)
    );
    Settings.setEntry(Constants.CFG_SCHEMA_PROP, String(Constants.CFG_SCHEMA_VERS), true);

    if (prevSchemaVers != Constants.CFG_SCHEMA_VERS) {
      migrateSchema();
    }

    checkSdtdp().then(() => {
      checkProfilePerGame().then(() => {
        Logger.info(
          'Profile per-game ' + (WhiteBoardUtils.getProfilePerGame() ? 'en' : 'dis') + 'abled'
        );

        Profiles.getDefaultProfile();
        Profiles.getDefaultACProfile();

        BackendUtils.isAlly().then((isAlly) => {
          BackendUtils.isAllyX().then((isX) => {
            WhiteBoardUtils.setisAllyX(isX);
            WhiteBoardUtils.setIsAlly(isX || isAlly);
            let prod = 'Unknown';
            if (WhiteBoardUtils.getIsAllyX()) {
              prod = 'ASUS ROG Ally ';
              if (WhiteBoardUtils.getIsAllyX()) {
                prod += 'X';
              }
            }
            Logger.info('Product: ' + prod);

            getBiosVersion().then(() => {
              getGpuRanges().then(() => {
                WhiteBoardUtils.setOnlyGui(
                  !WhiteBoardUtils.getIsAllyX() || WhiteBoardUtils.getSdtdpEnabled()
                );
                Logger.info(
                  'Mode ONLY_GUI ' + (WhiteBoardUtils.getOnlyGui() ? 'en' : 'dis') + 'abled'
                );

                BackendUtils.isSdtdpPresent().then((res) => {
                  Logger.info('SDTDP ' + (res ? '' : 'no ') + 'present');
                  WhiteBoardUtils.setSdtdpSettingsPresent(res);
                });

                sleep(5000).then(() => {
                  pluginUpdateCheckTimer = setInterval(checkPluginLatestVersion, 60 * 60 * 1000);
                  checkPluginLatestVersion();
                  sleep(1000).then(() => {
                    biosUpdateCheckTimer = setInterval(checkBiosLatestVersion, 60 * 60 * 1000);
                    checkBiosLatestVersion();
                  });
                });

                onGameUnregister = SteamClient.GameSessions.RegisterForAppLifetimeNotifications(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (e: any) => {
                    Logger.info('New game event');
                    if (WhiteBoardUtils.getProfilePerGame()) {
                      const prevId = WhiteBoardUtils.getRunningGameId();
                      const newId = e.bRunning
                        ? String(e.unAppID) +
                          (WhiteBoardUtils.getOnBattery()
                            ? Constants.SUFIX_BAT
                            : Constants.SUFIX_AC)
                        : WhiteBoardUtils.getOnBattery()
                          ? Constants.DEFAULT_ID
                          : Constants.DEFAULT_ID_AC;
                      if (prevId != newId) {
                        WhiteBoardUtils.setRunningGameId(newId);
                      }
                    }
                  }
                ).unregister;

                SteamClient.System.RegisterForBatteryStateChanges(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (state: any) => {
                    const onBattery = state.eACState == 1;
                    if (WhiteBoardUtils.getOnBattery() != onBattery) {
                      Logger.info('New AC state: ' + state.eACState);
                      WhiteBoardUtils.setOnBattery(onBattery);
                      const newId =
                        WhiteBoardUtils.getRunningGameId().substring(
                          0,
                          WhiteBoardUtils.getRunningGameId().lastIndexOf('.')
                        ) + (onBattery ? Constants.SUFIX_BAT : Constants.SUFIX_AC);
                      WhiteBoardUtils.setRunningGameId(newId);
                    }
                  }
                );

                runningGameIdUnregister = EventBus.subscribe(
                  EventType.WHITEBOARD,
                  (e: EventData) => {
                    if ((e as WhiteBoardEventData).getId() == 'runningGameId') {
                      Profiles.applyGameProfile((e as WhiteBoardEventData).getValue());
                    }
                  }
                ).unsubscribe;

                onSuspendUnregister = SteamClient.System.RegisterForOnSuspendRequest(() => {
                  AsyncUtils.runMutexForProfile((release) => {
                    Logger.info('Setting CPU profile for suspension');
                    BackendUtils.setPerformanceProfile(Profiles.getFullPowerProfile()).finally(
                      () => {
                        release();
                      }
                    );
                  });
                }).unregister;

                onResumeUnregister = SteamClient.System.RegisterForOnResumeFromSuspend(() => {
                  AsyncUtils.runMutexForProfile((release) => {
                    Logger.info('Waiting 10 seconds for restoring CPU profile');
                    sleep(10000).then(() => {
                      BackendUtils.setPerformanceProfile(
                        Profiles.getProfileForId(WhiteBoardUtils.getRunningGameId())
                      ).finally(() => {
                        release();
                      });
                    });
                  });
                }).unregister;

                onShutdownUnregister = SteamClient.User.RegisterForShutdownStart(() => {
                  AsyncUtils.runMutexForProfile((release) => {
                    Logger.info('Setting CPU profile for shutdown/restart');
                    BackendUtils.setPerformanceProfile(Profiles.getFullPowerProfile()).finally(
                      () => {
                        release();
                      }
                    );
                  });
                }).unregister;

                BackendUtils.setBatteryLimit(SystemSettings.getLimitBattery());
                if (WhiteBoardUtils.getIsAllyX()) {
                  sleep(100).then(() => {
                    Profiles.summary();
                    Profiles.applyGameProfile(WhiteBoardUtils.getRunningGameId());
                  });
                }
              });
            });
          });
        });
      });
    });
  })();

  return {
    name: Constants.PLUGIN_NAME,
    title: <div className={staticClasses.Title}>{Constants.PLUGIN_NAME}</div>,
    content: (
      <GlobalProvider>
        <MainMenu />
      </GlobalProvider>
    ),
    icon: <RogIcon width={20} height={20} />,
    onDismount(): void {
      if (onGameUnregister) onGameUnregister();
      if (onSuspendUnregister) onSuspendUnregister();
      if (onResumeUnregister) onResumeUnregister();
      if (onShutdownUnregister) onShutdownUnregister();
      if (pluginUpdateCheckTimer) clearInterval(pluginUpdateCheckTimer);
      if (biosUpdateCheckTimer) clearInterval(biosUpdateCheckTimer);
      if (runningGameIdUnregister) runningGameIdUnregister();

      Framework.shutdown();
    }
  };
});
