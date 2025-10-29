/* eslint-disable @typescript-eslint/ban-types */
import { definePlugin } from '@decky/api';
import { ConfirmModal, showModal, sleep, staticClasses } from '@decky/ui';
import { Framework, FrameworkCfg, Logger, Toast, Translator } from 'decky-plugin-framework';

import translations from '../assets/translations.i18n.json';
import { RogIcon } from './components/icons/rogIcon';
import { GlobalProvider } from './contexts/globalContext';
import { MainMenu } from './pages/MainMenu';
import { Profiles } from './settings/profiles';
import { SystemSettings } from './settings/system';
import { BackendUtils } from './utils/backend';
import { Constants } from './utils/constants';
import { CorsClient } from './utils/cors';
import { Listeners } from './utils/listeners';
import { SystemInfoSchema } from './utils/models';
import { PluginSettings } from './utils/settings';
import { WhiteBoardUtils } from './utils/whiteboard';

let pluginUpdateCheckTimer: NodeJS.Timeout | undefined;
let biosUpdateCheckTimer: NodeJS.Timeout | undefined;

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
      WhiteBoardUtils.getIsAllyX()
        ? Constants.ALLY_X_BIOS_URL
        : WhiteBoardUtils.getIsXboxAlly()
          ? Constants.XBOX_ALLY_BIOS_URL
          : WhiteBoardUtils.getIsXboxAllyX()
            ? Constants.XBOX_ALLY_X_BIOS_URL
            : Constants.ALLY_BIOS_URL
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = JSON.parse(await response.text())['Result']['Obj'];
    let vers: string | undefined = undefined;
    for (let i = 0; vers == undefined && i < data.length; i++) {
      if (data[i]['Name'] == 'BIOS') {
        vers = data[i]['Files'][0]['Version'];
      }
    }

    if (vers != undefined) {
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
    Logger.error('Error checking latest BIOS version', e);
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

const getCpuRanges = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (WhiteBoardUtils.getIsAlly()) {
      BackendUtils.getCpuTdpRange().then((data) => {
        WhiteBoardUtils.setTdpRange(data);
        Logger.info('CPU TDP ranges: ' + JSON.stringify(data));
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
      const isXboxAllyX = biosVersionStr.includes('RC73XA');
      const isXboxAlly = biosVersionStr.includes('RC73YA');
      const isAlly = biosVersionStr.includes('RC71L') || isAllyX || isXboxAllyX || isXboxAlly;
      const biosVersion = isAlly ? biosVersionStr.split('.')[1] : '';

      resolve({ isAlly, isAllyX, isXboxAllyX, isXboxAlly, biosVersion });
    })();
  });
};

const migrateSchema = (): void => {
  Logger.info('Migrating settings file schema to v' + Constants.CFG_SCHEMA_VERS);
  Logger.info('Migration finished');
};

export default definePlugin(() => {
  (async (): Promise<void> => {
    const frameworkConfiguration: FrameworkCfg = {
      game: {
        lifeCycle: true
      },
      system: {
        resume: false,
        suspension: false
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
          WhiteBoardUtils.setisXboxAllyX(result.isXboxAllyX);
          WhiteBoardUtils.setBiosVersion(result.biosVersion);

          let prod = 'Unknown';
          if (WhiteBoardUtils.getIsAlly()) {
            prod = 'ASUS ROG';
            if (WhiteBoardUtils.getIsAllyX()) {
              prod += ' Ally X';
            } else if (WhiteBoardUtils.getIsXboxAlly()) {
              prod += ' Xbox Ally';
            } else if (WhiteBoardUtils.getIsXboxAllyX()) {
              prod += ' Xbox Ally X';
            } else {
              prod += ' Ally';
            }
          }
          Logger.info('Product: ' + prod);

          if (result.isAlly) {
            Logger.info('BIOS version: ' + result.biosVersion);
          }

          getCpuRanges().then(() => {
            getGpuRanges().then(() => {
              WhiteBoardUtils.setOnlyGui(
                !WhiteBoardUtils.getIsAlly() || WhiteBoardUtils.getSdtdpEnabled()
              );
              Logger.info(
                'Mode ONLY_GUI ' + (WhiteBoardUtils.getOnlyGui() ? 'en' : 'dis') + 'abled'
              );

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

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              SteamClient.System.Audio.GetDevices().then((devs: any) => {
                const dev = devs.vecDevices.filter(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (dev: any) => dev.id == devs.activeOutputDeviceId
                )[0];
                WhiteBoardUtils.setAudioDevice(dev.sName);
                WhiteBoardUtils.setVolume(dev.flOutputVolume);
                Listeners.bind();

                BackendUtils.setBatteryLimit(SystemSettings.getLimitBattery());
                BackendUtils.setMcuPowersave(SystemSettings.getMcuPowersave());
                if (WhiteBoardUtils.getIsAlly()) {
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
      Listeners.unbind();

      if (pluginUpdateCheckTimer) clearInterval(pluginUpdateCheckTimer);
      if (biosUpdateCheckTimer) clearInterval(biosUpdateCheckTimer);

      Framework.shutdown();
    }
  };
});
