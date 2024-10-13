/* eslint-disable @typescript-eslint/ban-types */
import { definePlugin } from '@decky/api';
import { ConfirmModal, showModal, sleep, staticClasses } from '@decky/ui';
import {
  EventBus,
  EventData,
  EventType,
  Framework,
  FrameworkCfg,
  Logger,
  Toast,
  Translator,
  WhiteBoardEventData
} from 'decky-plugin-framework';
import { debounce } from 'lodash';

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
import { SystemInfoSchema } from './utils/models';
import { PluginSettings } from './utils/settings';
import { WhiteBoardUtils } from './utils/whiteboard';

let onSuspendUnregister: Function | undefined;
let onResumeUnregister: Function | undefined;
let onGameUnregister: Function | undefined;
let onShutdownUnregister: Function | undefined;
let onBrightnessUnregister: Function | undefined;
let pluginUpdateCheckTimer: NodeJS.Timeout | undefined;
let biosUpdateCheckTimer: NodeJS.Timeout | undefined;
let runningGameIdUnregister: Function | undefined;

const checkProfilePerGame = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (!PluginSettings.getProfilePerGame()) {
      showModal(
        <ConfirmModal
          strTitle={Constants.PLUGIN_NAME}
          strDescription={Translator.translate('profile.per.game.ask')}
          strOKButtonText={Translator.translate('enable')}
          strCancelButtonText={Translator.translate('disable')}
          onCancel={() => {
            PluginSettings.setProfilePerGame(false);
            Logger.info('Disabled profile per-game');
            resolve();
          }}
          onOK={() => {
            PluginSettings.setProfilePerGame(true);
            Logger.info('Enabled profile per-game');
            resolve();
          }}
        />
      );
    } else {
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

const getSystemInfo = (): Promise<SystemInfoSchema> => {
  return new Promise((resolve) => {
    (async (): Promise<void> => {
      const { sBIOSVersion } = await SteamClient.System.GetSystemInfo();
      const biosVersionStr = sBIOSVersion as string;

      const isAllyX = biosVersionStr.includes('RC72LA');
      const isAlly = biosVersionStr.includes('RC71L') || isAllyX;
      const biosVersion = isAlly ? biosVersionStr.split('.')[1] : '';

      resolve({ isAlly, isAllyX, biosVersion });
    })();
  });
};

const migrateSchema = (): void => {
  Logger.info('Migrating settings file schema to v' + Constants.CFG_SCHEMA_VERS);
  Logger.info('Migration finished');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debouncedBrightnessListener = debounce((event: any) => {
  AsyncUtils.runMutexForProfile((release) => {
    if (event.flBrightness != WhiteBoardUtils.getBrightness()) {
      WhiteBoardUtils.setBrightness(event.flBrightness);
      Profiles.setBrightnessForProfileId(WhiteBoardUtils.getRunningGameId(), event.flBrightness);
    }
    release();
  });
}, 1000);

export default definePlugin(() => {
  (async (): Promise<void> => {
    const frameworkConfiguration: FrameworkCfg = {
      game: {
        lifeCycle: true
      },
      system: {
        resume: true,
        suspension: true
      },
      toast: {
        logo: window.SP_REACT.createElement(RogIcon, {
          width: 30,
          height: 30
        })
      },
      translator: {
        translations
      }
    };
    await Framework.initialize(
      Constants.PLUGIN_NAME,
      Constants.PLUGIN_VERSION,
      frameworkConfiguration
    );
    PluginSettings.initialize();

    const prevSchemaVers = PluginSettings.getSchemaVersion();
    if (prevSchemaVers && prevSchemaVers != Constants.CFG_SCHEMA_VERS) {
      migrateSchema();
    }
    PluginSettings.setSchemaVersion(Constants.CFG_SCHEMA_VERS);

    checkSdtdp().then(() => {
      checkProfilePerGame().then(() => {
        Logger.info(
          'Profile per-game ' + (PluginSettings.getProfilePerGame() ? 'en' : 'dis') + 'abled'
        );

        getSystemInfo().then((result) => {
          WhiteBoardUtils.setIsAlly(result.isAlly);
          WhiteBoardUtils.setisAllyX(result.isAllyX);
          WhiteBoardUtils.setBiosVersion(result.biosVersion);

          let prod = 'Unknown';
          if (WhiteBoardUtils.getIsAllyX()) {
            prod = 'ASUS ROG Ally ';
            if (WhiteBoardUtils.getIsAllyX()) {
              prod += 'X';
            }
          }
          Logger.info('Product: ' + prod);

          if (result.isAlly) {
            Logger.info('BIOS version: ' + result.biosVersion);
          }

          getGpuRanges().then(() => {
            WhiteBoardUtils.setOnlyGui(
              !WhiteBoardUtils.getIsAllyX() || WhiteBoardUtils.getSdtdpEnabled()
            );
            Logger.info('Mode ONLY_GUI ' + (WhiteBoardUtils.getOnlyGui() ? 'en' : 'dis') + 'abled');

            BackendUtils.isSdtdpPresent().then((res) => {
              Logger.info('SDTDP ' + (res ? '' : 'no ') + 'present');
              WhiteBoardUtils.setSdtdpSettingsPresent(res);
            });

            sleep(5000).then(() => {
              if (!Constants.PLUGIN_VERSION.endsWith('-dev')) {
                pluginUpdateCheckTimer = setInterval(checkPluginLatestVersion, 60 * 60 * 1000);
                checkPluginLatestVersion();
              }
              sleep(1000).then(() => {
                biosUpdateCheckTimer = setInterval(checkBiosLatestVersion, 60 * 60 * 1000);
                checkBiosLatestVersion();
              });
            });

            onGameUnregister = SteamClient.GameSessions.RegisterForAppLifetimeNotifications(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (e: any) => {
                Logger.info('New game event');
                if (PluginSettings.getProfilePerGame()) {
                  const prevId = WhiteBoardUtils.getRunningGameId();
                  const newId = e.bRunning
                    ? String(e.unAppID) +
                      (WhiteBoardUtils.getOnBattery() ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
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
            onBrightnessUnregister = SteamClient.System.Display.RegisterForBrightnessChanges(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (event: any) => {
                if (WhiteBoardUtils.getBrightness() == undefined) {
                  WhiteBoardUtils.setBrightness(event.flBrightness);
                } else {
                  if (!AsyncUtils.isDisplayLocked()) {
                    debouncedBrightnessListener(event);
                  }
                }
              }
            ).unsubscribe;

            runningGameIdUnregister = EventBus.subscribe(EventType.WHITEBOARD, (e: EventData) => {
              if ((e as WhiteBoardEventData).getId() == 'runningGameId') {
                Profiles.applyGameProfile((e as WhiteBoardEventData).getValue());
              }
            }).unsubscribe;

            onSuspendUnregister = SteamClient.System.RegisterForOnSuspendRequest(() => {
              AsyncUtils.runMutexForProfile((release) => {
                Logger.info('Setting CPU profile for suspension');
                BackendUtils.applyProfile(Profiles.getFullPowerProfile()).finally(() => {
                  release();
                });
              });
            }).unregister;

            onResumeUnregister = SteamClient.System.RegisterForOnResumeFromSuspend(() => {
              AsyncUtils.runMutexForProfile((release) => {
                Logger.info('Waiting 10 seconds for restoring CPU profile');
                sleep(10000).then(() => {
                  BackendUtils.applyProfile(
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
                BackendUtils.applyProfile(Profiles.getFullPowerProfile()).finally(() => {
                  release();
                });
              });
            }).unregister;

            BackendUtils.setBatteryLimit(SystemSettings.getLimitBattery());
            if (WhiteBoardUtils.getIsAllyX()) {
              sleep(100).then(() => {
                Profiles.getDefaultProfile();
                Profiles.getDefaultACProfile();
                Profiles.summary();
                Profiles.applyGameProfile(WhiteBoardUtils.getRunningGameId());
              });
            }
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
      if (onBrightnessUnregister) onBrightnessUnregister();

      Framework.shutdown();
    }
  };
});
