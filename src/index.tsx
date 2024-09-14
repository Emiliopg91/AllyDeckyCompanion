import {
  definePlugin,
  Router,
  ServerAPI,
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
  Game,
  Settings,
  Translator,
} from "decky-plugin-framework";
import { State } from "./utils/state";
import { Profile, Profiles } from './settings/profiles'
import { BackendUtils } from "./utils/backend";
import { SystemSettings } from "./settings/system";
import { debounce } from "lodash";

let onPowerUnregister: Function | undefined;
let onSuspendUnregister: Function | undefined;
let onResumeUnregister: Function | undefined;
let onGameUnregister: Function | undefined;

const applyGameProfile = debounce((id: string) => {
  const profile: Profile = Profiles.getProfileForId(id)
  Logger.info("Applying CPU settings for profile " + id + " (" + (id == Constants.DEFAULT_ID ? Translator.translate("main.menu") : Game.getGameDetails(Number(id.endsWith("-ac") ? id.substring(0, id.length - 3) : id)).getDisplayName()) + ")",
    profile
  )
  BackendUtils.setTdpProfile(profile)
}, 500)

export default definePlugin((serverApi: ServerAPI) => {
  (async () => {
    await Framework.initialize(serverApi, Constants.PLUGIN_NAME, Constants.PLUGIN_VERSION, translations)
    BackendUtils.setServerApi(serverApi)

    Profiles.getDefaultProfile()
    Profiles.getDefaultACProfile()

    BackendUtils.isAlly().then(isAlly => {
      State.IS_ALLY = isAlly

      BackendUtils.isAllyX().then(isX => {
        State.IS_ALLY_X = isX
        Logger.info("Product: " + (isAlly ? ("ASUS ROG Ally " + (isX ? "X" : "")) : "Unknown"))

        Settings.setEntry(Constants.CFG_SCHEMA_PROP, Constants.CFG_SCHEMA_VERS, true)

        onGameUnregister = SteamClient.GameSessions.RegisterForAppLifetimeNotifications((e: any) => {
          const prevId = State.RUNNING_GAME_ID
          State.RUNNING_GAME_ID = (e.bRunning ? String(e.unAppID) : Constants.DEFAULT_ID) + (State.ON_BATTERY ? "" : "-ac");
          if (prevId != State.RUNNING_GAME_ID) {
            applyGameProfile(State.RUNNING_GAME_ID)
          }
        })

        onPowerUnregister = SteamClient.System.RegisterForBatteryStateChanges((state: any) => {
          if (State.ON_BATTERY != (state.eACState == 1)) {
            Logger.info("New AC state: " + state.eACState)
            State.ON_BATTERY = state.eACState == 1

            if (State.ON_BATTERY) {
              if (State.RUNNING_GAME_ID.endsWith("-ac")) {
                State.RUNNING_GAME_ID = State.RUNNING_GAME_ID.substring(0, State.RUNNING_GAME_ID.length - 3)
              }
            } else {
              if (!State.RUNNING_GAME_ID.endsWith("-ac")) {
                State.RUNNING_GAME_ID = State.RUNNING_GAME_ID + "-ac"
              }
            }
            applyGameProfile(State.RUNNING_GAME_ID)
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

        BackendUtils.setBatteryLimit(SystemSettings.getLimitBattery())

        applyGameProfile(State.RUNNING_GAME_ID)
      })

    });
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
