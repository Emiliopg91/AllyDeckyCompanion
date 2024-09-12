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

let gameInterval: NodeJS.Timeout | undefined = undefined;
let onSuspendUnregister: Function | undefined;
let onResumeUnregister: Function | undefined;

export default definePlugin((serverApi: ServerAPI) => {
  (async () => {
    await Framework.initialize(serverApi, Constants.PLUGIN_NAME, Constants.PLUGIN_VERSION, translations)
    BackendUtils.setServerApi(serverApi)

    BackendUtils.isAlly().then(isAlly => {
      State.IS_ALLY = isAlly

      BackendUtils.isAllyX().then(isX => {
        State.IS_ALLY_X = isX
        Logger.info("Product: " + (isAlly ? ("ASUS ROG Ally " + (isX ? "X" : "")) : "Unknown"))

        Settings.setEntry(Constants.CFG_SCHEMA_PROP, Constants.CFG_SCHEMA_VERS, true)

        const onGameEvent = () => {
          const newId = Router.MainRunningApp ? Router.MainRunningApp.appid : Constants.DEFAULT_ID;
          if (State.RUNNING_GAME_ID !== newId) {
            const profile: Profile = Profiles.getProfileForId(newId, newId == Constants.DEFAULT_ID)
            Logger.info("Applying CPU settings for profile " + newId + " (" + (newId == Constants.DEFAULT_ID ? Translator.translate("main.menu") : Game.getGameDetails(Number(newId)).getDisplayName()) + ")",
              profile
            )
            BackendUtils.setTdpProfile(profile)
            State.RUNNING_GAME_ID = newId
          }
        }
        gameInterval = setInterval(onGameEvent, 500);

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
      })

    });
  })()

  return {
    title: <div className={staticClasses.Title}>{Constants.PLUGIN_NAME}</div>,
    content: <MainMenu />,
    icon: <SiAsus />,
    async onDismount() {
      clearInterval(gameInterval)
      if (onSuspendUnregister)
        onSuspendUnregister()
      if (onResumeUnregister)
        onResumeUnregister()
      await Framework.shutdown()
    }
  };
});
