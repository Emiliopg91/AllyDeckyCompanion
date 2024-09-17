import {
  ConfirmModal,
  definePlugin,
  ServerAPI,
  showModal,
  sleep,
  staticClasses,
} from "decky-frontend-lib";
import { SiAsus } from "react-icons/si";
import { MainMenu } from "./pages/MainMenu"
import { Constants } from "./utils/constants";

import translations from "../assets/translations.i18n.json";

import {
  Framework,
  Logger,
  Settings,
  Toast,
  Translator,
} from "decky-plugin-framework";
import { State } from "./utils/state";
import { Profiles } from './settings/profiles'
import { BackendUtils } from "./utils/backend";
import { SystemSettings } from "./settings/system";

let onPowerUnregister: Function | undefined;
let onSuspendUnregister: Function | undefined;
let onResumeUnregister: Function | undefined;
let onGameUnregister: Function | undefined;

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

export default definePlugin((serverApi: ServerAPI) => {
  (async () => {
    await Framework.initialize(serverApi, Constants.PLUGIN_NAME, Constants.PLUGIN_VERSION, translations)
    BackendUtils.setServerApi(serverApi)

    Settings.setEntry(Constants.CFG_SCHEMA_PROP, Constants.CFG_SCHEMA_VERS, true)
    BackendUtils.setBatteryLimit(SystemSettings.getLimitBattery())

    checkSdtdp().then(() => {
      checkProfilePerGame().then(() => {
        Logger.info("Profile per-game " + (State.PROFILE_PER_GAME ? "en" : "dis") + "abled")

        Profiles.getDefaultProfile()
        Profiles.getDefaultACProfile()

        BackendUtils.isAlly().then(isAlly => {
          State.IS_ALLY = isAlly

          State.ONLY_GUI = !State.IS_ALLY || State.SDTDP_ENABLED

          BackendUtils.isAllyX().then(isX => {
            State.IS_ALLY_X = isX
            Logger.info("Product: " + (isAlly ? ("ASUS ROG Ally " + (isX ? "X" : "")) : "Unknown"))
            Logger.info("Mode ONLY_GUI " + (State.ONLY_GUI ? "en" : "dis") + "abled")

            BackendUtils.isSdtdpPresent().then((res) => {
              Logger.info("SDTDP " + ((res) ? "" : "no ") + "present")
              State.SDTDP_SETTINGS_PRESENT = res
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
            })

            onPowerUnregister = SteamClient.System.RegisterForBatteryStateChanges((state: any) => {
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
            })

            onResumeUnregister = SteamClient.System.RegisterForOnResumeFromSuspend(() => {
              Logger.info("Waiting 10 seconds for restoring CPU profile")
              sleep(10000).then(() => {
                BackendUtils.setTdpProfile(Profiles.getProfileForId(State.RUNNING_GAME_ID))
              })
            })

            Profiles.applyGameProfile(State.RUNNING_GAME_ID)
          })

        });
      })
    })
  })()

  return {
    title: <div className={staticClasses.Title}>{Constants.PLUGIN_NAME}</div>,
    content: <MainMenu />,
    icon: <SiAsus />,
    async onDismount() {
      if (onPowerUnregister)
        onPowerUnregister()
      if (onGameUnregister)
        onGameUnregister()
      if (onSuspendUnregister)
        onSuspendUnregister()
      if (onResumeUnregister)
        onResumeUnregister()
      await Framework.shutdown()
    }
  };
});
