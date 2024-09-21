import { RogIcon } from "./components/icons/rogIcon";
import { MainMenu } from "./pages/MainMenu"
import { Constants } from "./utils/constants";

import translations from "../assets/translations.i18n.json";

import {
  Framework,
  Logger,
  Settings,
  Translator,
} from "decky-plugin-framework";
import { State } from "./utils/state";
import { Profiles } from './settings/profiles'
import { BackendUtils } from "./utils/backend";
import { SystemSettings } from "./settings/system";
import { ConfirmModal, showModal, sleep, staticClasses } from "@decky/ui";
import { definePlugin, fetchNoCors } from "@decky/api";
import { Toast } from "./utils/toast";

let onSuspendUnregister: Function | undefined;
let onResumeUnregister: Function | undefined;
let onGameUnregister: Function | undefined;
let onShutdownUnregister: Function | undefined;
let pluginUpdateCheckTimer: NodeJS.Timeout | undefined;
let biosUpdateCheckTimer: NodeJS.Timeout | undefined;

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
          State.PROFILE_PER_GAME = false
          Logger.info("Disabled profile per-game")
          resolve()
        }}
        onOK={() => {
          Settings.setEntry(Constants.PROFILE_PER_GAME, "true", true)
          State.PROFILE_PER_GAME = true
          Logger.info("Enabled profile per-game")
          resolve()
        }}
      />)
    } else {
      State.PROFILE_PER_GAME = Settings.getEntry(Constants.PROFILE_PER_GAME) == "true"
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
    if (vers != State.PLUGIN_LATEST_VERSION && Constants.PLUGIN_VERSION != vers) {
      Logger.info("New plugin update available!")
      Toast.toast(Translator.translate("update.available"), 3000, () => {
        BackendUtils.otaUpdate();
      })
      clearInterval(pluginUpdateCheckTimer)
      pluginUpdateCheckTimer = undefined
    }
    State.PLUGIN_LATEST_VERSION = vers

  } catch (e) {
    Logger.error("Error fetching latest plugin version", e)
    State.PLUGIN_LATEST_VERSION = ""
  }
}

const checkBiosLatestVersion = async () => {
  try {
    Logger.info("Checking for BIOS update")

    const url = State.IS_ALLY_X
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
      if (vers != State.BIOS_LATEST_VERSION && State.BIOS_VERSION != vers) {
        Logger.info("New BIOS update available!")
        Toast.toast(Translator.translate("bios.update.available"))
        clearInterval(biosUpdateCheckTimer)
        biosUpdateCheckTimer = undefined
      }
      State.BIOS_LATEST_VERSION = vers;
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
            State.SDTDP_ENABLED = true
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
        Logger.info("Profile per-game " + (State.PROFILE_PER_GAME ? "en" : "dis") + "abled")

        Profiles.getDefaultProfile()
        Profiles.getDefaultACProfile()

        BackendUtils.isAlly().then(isAlly => {
          BackendUtils.isAllyX().then(isX => {
            State.IS_ALLY_X = isX
            State.IS_ALLY = isX || isAlly
            let prod = "Unknown"
            if (State.IS_ALLY) {
              prod = "ASUS ROG Ally "
              if (State.IS_ALLY_X) {
                prod += "X"
              }
            }
            Logger.info("Product: " + prod)
            BackendUtils.getBiosVersion().then((biosVersion) => {
              State.BIOS_VERSION = biosVersion;
              Logger.info("BIOS version " + State.BIOS_VERSION);

              State.ONLY_GUI = !State.IS_ALLY || State.SDTDP_ENABLED
              Logger.info("Mode ONLY_GUI " + (State.ONLY_GUI ? "en" : "dis") + "abled")

              BackendUtils.isSdtdpPresent().then((res) => {
                Logger.info("SDTDP " + ((res) ? "" : "no ") + "present")
                State.SDTDP_SETTINGS_PRESENT = res
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
                if (State.PROFILE_PER_GAME) {
                  const prevId = State.RUNNING_GAME_ID
                  State.RUNNING_GAME_ID = (e.bRunning
                    ? String(e.unAppID) + (State.ON_BATTERY ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
                    : (State.ON_BATTERY ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC));
                  if (prevId != State.RUNNING_GAME_ID) {
                    Profiles.applyGameProfile(State.RUNNING_GAME_ID)
                  }
                }
              }).unregister

              SteamClient.System.RegisterForBatteryStateChanges((state: any) => {
                if (State.ON_BATTERY != (state.eACState == 1)) {
                  Logger.info("New AC state: " + state.eACState)
                  State.ON_BATTERY = state.eACState == 1

                  State.RUNNING_GAME_ID = State.RUNNING_GAME_ID.substring(0, State.RUNNING_GAME_ID.lastIndexOf(".")) + (State.ON_BATTERY ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
                  Profiles.applyGameProfile(State.RUNNING_GAME_ID)
                }
              })

              onSuspendUnregister = SteamClient.System.RegisterForOnSuspendRequest(() => {
                Logger.info("Setting CPU profile for suspension")
                BackendUtils.setTdpProfile(Profiles.getFullPowerProfile())
              }).unregister

              onResumeUnregister = SteamClient.System.RegisterForOnResumeFromSuspend(() => {
                Logger.info("Waiting 10 seconds for restoring CPU profile")
                sleep(10000).then(() => {
                  BackendUtils.setTdpProfile(Profiles.getProfileForId(State.RUNNING_GAME_ID))
                })
              }).unregister

              onShutdownUnregister = SteamClient.User.RegisterForShutdownStart(() => {
                Logger.info("Setting CPU profile for shutdown/restart")
                BackendUtils.setTdpProfile(Profiles.getFullPowerProfile())
              }).unregister

              BackendUtils.setBatteryLimit(SystemSettings.getLimitBattery())
              if (State.IS_ALLY) {
                sleep(100).then(() => {
                  Profiles.summary()
                  Profiles.applyGameProfile(State.RUNNING_GAME_ID)
                })
              }
            });
          })
        });
      })
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

      Framework.shutdown()
    }
  };
});
