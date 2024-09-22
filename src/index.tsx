import { RogIcon } from "./components/icons/rogIcon";
import { MainMenu } from "./pages/MainMenu"
import { Constants } from "./utils/constants";

import translations from "../assets/translations.i18n.json";

import {
  EventBus,
  EventData,
  EventType,
  Framework,
  Logger,
  Settings,
  Translator,
  WhiteBoardEventData,
} from "decky-plugin-framework";
import { Profiles } from './settings/profiles'
import { BackendUtils } from "./utils/backend";
import { SystemSettings } from "./settings/system";
import { ConfirmModal, showModal, sleep, staticClasses } from "@decky/ui";
import { definePlugin } from "@decky/api";
import { Toast } from "./utils/toast";
import { WhiteBoardUtils } from "./utils/whiteboard";
import { AsyncUtils } from "./utils/async";

let onSuspendUnregister: Function | undefined;
let onResumeUnregister: Function | undefined;
let onGameUnregister: Function | undefined;
let onShutdownUnregister: Function | undefined;
let pluginUpdateCheckTimer: NodeJS.Timeout | undefined;
let biosUpdateCheckTimer: NodeJS.Timeout | undefined;
let runningGameIdUnregister: Function | undefined

const checkProfilePerGame = () => {
  return new Promise<void>((resolve) => {
    if (!Settings.getEntry(Constants.PROFILE_PER_GAME)) {
      showModal(<ConfirmModal
        strTitle={Constants.PLUGIN_NAME}
        strDescription={Translator.translate("profile.per.game.ask")}
        strOKButtonText={Translator.translate("enable")}
        strCancelButtonText={Translator.translate("disable")}
        onCancel={() => {
          Settings.setEntry(Constants.PROFILE_PER_GAME, "false", true)
          WhiteBoardUtils.setProfilePerGame(false)
          Logger.info("Disabled profile per-game")
          resolve()
        }}
        onOK={() => {
          Settings.setEntry(Constants.PROFILE_PER_GAME, "true", true)
          WhiteBoardUtils.setProfilePerGame(true)
          Logger.info("Enabled profile per-game")
          resolve()
        }}
      />)
    } else {
      WhiteBoardUtils.setProfilePerGame(Settings.getEntry(Constants.PROFILE_PER_GAME) == "true")
      resolve()
    }
  })
}

const checkPluginLatestVersion = async () => {
  try {
    Logger.info("Checking for plugin update")

    const result = await fetch(
      "https://raw.githubusercontent.com/Emiliopg91/AllyDeckyCompanion/main/package.json",
      { method: "GET" }
    );

    if (!result.ok) {
      throw new Error(result.statusText);
    }

    const vers = (await result.json())["version"]
    Logger.info("Latest plugin version: " + vers)
    if (vers != WhiteBoardUtils.getPluginLatestVersion() && Constants.PLUGIN_VERSION != vers) {
      Logger.info("New plugin update available!")
      Toast.toast(Translator.translate("update.available"), 3000, () => {
        BackendUtils.otaUpdate();
      })
      clearInterval(pluginUpdateCheckTimer)
      pluginUpdateCheckTimer = undefined
    }
    WhiteBoardUtils.setPluginLatestVersion(vers)

  } catch (e) {
    Logger.error("Error fetching latest plugin version", e)
    WhiteBoardUtils.setPluginLatestVersion("")
  }
}

const checkBiosLatestVersion = async () => {
  try {
    Logger.info("Checking for BIOS update")

    const url = WhiteBoardUtils.getIsAllyX()
      ? "https://rog.asus.com/support/webapi/product/GetPDBIOS?website=global&model=rog-ally-x-2024&pdid=0&m1id=26436&cpu=RC72LA&LevelTagId=230371&systemCode=rog"
      : "https://rog.asus.com/support/webapi/product/GetPDBIOS?website=global&model=rog-ally-2023&pdid=0&m1id=23629&cpu=RC71L&LevelTagId=220680&systemCode=rog"
    const response = await fetch("https://corsproxy.io/?" + url);

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
      const vers = String(Math.max(...versions))
      Logger.info("Latest BIOS version: " + vers)
      if (vers != WhiteBoardUtils.getBiosLatestVersion() && WhiteBoardUtils.getBiosVersion() != vers) {
        Logger.info("New BIOS update available!")
        Toast.toast(Translator.translate("bios.update.available"))
        clearInterval(biosUpdateCheckTimer)
        biosUpdateCheckTimer = undefined
      }
      WhiteBoardUtils.setBiosLatestVersion(vers)
    }

  } catch (e) {
    Logger.error("Error fetching latest BIOS version", e)
  }
}

const checkSdtdp = () => {
  return new Promise<void>((resolve) => {
    BackendUtils.isSdtdpEnabled().then(res => {
      if (res) {
        showModal(<ConfirmModal
          strTitle={Constants.PLUGIN_NAME}
          strDescription={Translator.translate("disable.sdtdp.ask")}
          strCancelButtonText={Translator.translate("enable")}
          strOKButtonText={Translator.translate("disable")}
          onCancel={() => {
            WhiteBoardUtils.setSdtdpEnabled(true)
            Logger.info("SimpleDeckyTDP not disabled")
            resolve()
          }}
          onOK={() => {
            Logger.info("Disabling SimpleDeckyTDP")
            BackendUtils.disableSDTDP()
          }}
        />)
      } else {
        resolve()
      }
    });
  })
}

const getGpuRanges = () => {
  return new Promise<void>((resolve) => {
    if (WhiteBoardUtils.getIsAlly()) {
      BackendUtils.getGpuFrequencyRange().then(([min, max]) => {
        WhiteBoardUtils.setGpuMinFreq(min)
        WhiteBoardUtils.setGpuMaxFreq(max)
        Logger.info("GPU frequency range: " + min + " to " + max + " MHz")
        resolve()
      })
    }
    else {
      resolve()
    }
  })
}

const getBiosVersion = () => {
  return new Promise<void>((resolve) => {
    if (WhiteBoardUtils.getIsAlly()) {
      BackendUtils.getBiosVersion().then((biosVersion) => {
        WhiteBoardUtils.setBiosVersion(biosVersion);
        Logger.info("BIOS version " + WhiteBoardUtils.getBiosVersion());
        resolve()
      })
    }
    else {
      resolve()
    }
  })
}

const migrateSchema = () => {
  Logger.info("Migrating settings file schema to v" + Constants.CFG_SCHEMA_VERS)

  const batLimit = String(Settings.getEntry(Constants.BATTERY_LIMIT, String(Constants.DEFAULT_BATTERY_LIMIT)))
  if (batLimit == "true") {
    Settings.setEntry(Constants.BATTERY_LIMIT, String(80), true)
  } else if (batLimit == "false") {
    Settings.setEntry(Constants.BATTERY_LIMIT, String(100), true)
  }

  Logger.info("Migration finished")
}

export default definePlugin(() => {
  (async () => {
    await Framework.initialize(Constants.PLUGIN_NAME, Constants.PLUGIN_VERSION, translations)

    const prevSchemaVers = Settings.getEntry(Constants.CFG_SCHEMA_PROP, String(Constants.CFG_SCHEMA_VERS))
    Settings.setEntry(Constants.CFG_SCHEMA_PROP, String(Constants.CFG_SCHEMA_VERS), true)

    if (Number(String(prevSchemaVers)) < Constants.CFG_SCHEMA_VERS) {
      migrateSchema()
    }

    checkSdtdp().then(() => {
      checkProfilePerGame().then(() => {
        Logger.info("Profile per-game " + (WhiteBoardUtils.getProfilePerGame() ? "en" : "dis") + "abled")

        Profiles.getDefaultProfile()
        Profiles.getDefaultACProfile()

        BackendUtils.isAlly().then(isAlly => {
          BackendUtils.isAllyX().then(isX => {
            WhiteBoardUtils.setisAllyX(isX)
            WhiteBoardUtils.setIsAlly(isX || isAlly)
            let prod = "Unknown"
            if (WhiteBoardUtils.getIsAllyX()) {
              prod = "ASUS ROG Ally "
              if (WhiteBoardUtils.getIsAllyX()) {
                prod += "X"
              }
            }
            Logger.info("Product: " + prod)

            getBiosVersion().then(() => {
              getGpuRanges().then(() => {
                WhiteBoardUtils.setOnlyGui(!WhiteBoardUtils.getIsAllyX() || WhiteBoardUtils.getSdtdpEnabled())
                Logger.info("Mode ONLY_GUI " + (WhiteBoardUtils.getOnlyGui() ? "en" : "dis") + "abled")

                BackendUtils.isSdtdpPresent().then((res) => {
                  Logger.info("SDTDP " + ((res) ? "" : "no ") + "present")
                  WhiteBoardUtils.setSdtdpSettingsPresent(res)
                })

                sleep(5000).then(() => {
                  pluginUpdateCheckTimer = setInterval(checkPluginLatestVersion, 60 * 60 * 1000);
                  checkPluginLatestVersion()
                  sleep(1000).then(() => {
                    biosUpdateCheckTimer = setInterval(checkBiosLatestVersion, 60 * 60 * 1000)
                    checkBiosLatestVersion()
                  })
                })

                onGameUnregister = SteamClient.GameSessions.RegisterForAppLifetimeNotifications((e: any) => {
                  Logger.info("New game event")
                  if (WhiteBoardUtils.getProfilePerGame()) {
                    const prevId = WhiteBoardUtils.getRunningGameId()
                    const newId = (e.bRunning
                      ? String(e.unAppID) + (WhiteBoardUtils.getOnBattery() ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
                      : (WhiteBoardUtils.getOnBattery() ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC))
                    if (prevId != newId) {
                      WhiteBoardUtils.setRunningGameId(newId);
                    }
                  }
                }).unregister

                SteamClient.System.RegisterForBatteryStateChanges((state: any) => {
                  const onBattery = state.eACState == 1
                  if (WhiteBoardUtils.getOnBattery() != (onBattery)) {
                    Logger.info("New AC state: " + state.eACState)
                    WhiteBoardUtils.setOnBattery(onBattery)
                    const newId = WhiteBoardUtils.getRunningGameId().substring(0, WhiteBoardUtils.getRunningGameId().lastIndexOf(".")) + (onBattery ? Constants.SUFIX_BAT : Constants.SUFIX_AC);
                    WhiteBoardUtils.setRunningGameId(newId)
                  }
                })

                runningGameIdUnregister = EventBus.subscribe(EventType.WHITEBOARD, (e: EventData) => {
                  if ((e as WhiteBoardEventData).getId() == "runningGameId")
                    Profiles.applyGameProfile((e as WhiteBoardEventData).getValue())
                }).unsubscribe;

                onSuspendUnregister = SteamClient.System.RegisterForOnSuspendRequest(() => {
                  AsyncUtils.runMutexForProfile((release) => {
                    Logger.info("Setting CPU profile for suspension")
                    BackendUtils.setPerformanceProfile(Profiles.getFullPowerProfile()).finally(() => {
                      release()
                    })
                  })
                }).unregister

                onResumeUnregister = SteamClient.System.RegisterForOnResumeFromSuspend(() => {
                  AsyncUtils.runMutexForProfile((release) => {
                    Logger.info("Waiting 10 seconds for restoring CPU profile")
                    sleep(10000).then(() => {
                      BackendUtils.setPerformanceProfile(Profiles.getProfileForId(WhiteBoardUtils.getRunningGameId())).finally(() => {
                        release()
                      })
                    })
                  })
                }).unregister

                onShutdownUnregister = SteamClient.User.RegisterForShutdownStart(() => {
                  AsyncUtils.runMutexForProfile((release) => {
                    Logger.info("Setting CPU profile for shutdown/restart")
                    BackendUtils.setPerformanceProfile(Profiles.getFullPowerProfile()).finally(() => {
                      release()
                    })
                  })
                }).unregister

                BackendUtils.setBatteryLimit(SystemSettings.getLimitBattery())
                if (WhiteBoardUtils.getIsAllyX()) {
                  sleep(100).then(() => {
                    Profiles.summary()
                    Profiles.applyGameProfile(WhiteBoardUtils.getRunningGameId())
                  })
                }
              })
            })
          });
        })
      });
    })
  })()

  return {
    name: Constants.PLUGIN_NAME,
    title: <div className={staticClasses.Title}>{Constants.PLUGIN_NAME}</div>,
    content: <MainMenu />,
    icon: <RogIcon width={20} height={20} />,
    onDismount() {
      if (onGameUnregister)
        onGameUnregister()
      if (onSuspendUnregister)
        onSuspendUnregister()
      if (onResumeUnregister)
        onResumeUnregister()
      if (onShutdownUnregister)
        onShutdownUnregister()
      if (pluginUpdateCheckTimer)
        clearInterval(pluginUpdateCheckTimer)
      if (biosUpdateCheckTimer)
        clearInterval(biosUpdateCheckTimer)
      if (runningGameIdUnregister)
        runningGameIdUnregister()

      Framework.shutdown()
    }
  };
});
