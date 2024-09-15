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
  Logger.info("Applying CPU settings for profile " + id,
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
          State.RUNNING_GAME_ID = (e.bRunning 
            ? String(e.unAppID) + (State.ON_BATTERY ? Constants.SUFIX_BAT : Constants.SUFIX_AC) 
            : (State.ON_BATTERY ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC));
          if (prevId != State.RUNNING_GAME_ID) {
            applyGameProfile(State.RUNNING_GAME_ID)
          }
        })

        onPowerUnregister = SteamClient.System.RegisterForBatteryStateChanges((state: any) => {
          if (State.ON_BATTERY != (state.eACState == 1)) {
            Logger.info("New AC state: " + state.eACState)
            State.ON_BATTERY = state.eACState == 1

            State.RUNNING_GAME_ID = State.RUNNING_GAME_ID.substring(0, State.RUNNING_GAME_ID.lastIndexOf(".")) + (State.ON_BATTERY ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
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
