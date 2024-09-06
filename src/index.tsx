import {
  definePlugin,
  ServerAPI,
  staticClasses,
} from "decky-frontend-lib";
import { FaShip } from "react-icons/fa";
import { MainMenu } from "./pages/MainMenu"
import { RouterTest } from "./pages/RouterTest"
import { Constants } from "./utils/constants";

import translations from "../assets/translations.i18n.json";

import {
  Settings,
  Framework,
  Logger,
  ShortcutListener,
  Button,
  ShortcutEventData,
  GameLifeEventData,
  SettingsEventData,
  EventBus,
  EventType,
  EventData
} from "decky-plugin-framework";
import { SuspendEventData } from "decky-plugin-framework/dist/modules/system";

const shortcutButtons = [Button.X, Button.B];

function handleGameEvent(data: EventData) {
  const ged = data as GameLifeEventData
  Logger.error("Event for game " + ged.getDetails().getDisplayName());
}

function handleShortcutEvent(data: EventData) {
  const shortcutData = data as ShortcutEventData;
  Logger.error("Received shortcut event: " + shortcutData.toString())
  if (shortcutData.isFor(shortcutButtons)) {
    if (shortcutData.isPressed()) {
      Logger.error("Pressed!")
    }
    else {
      Logger.error("Released!")
    }
  }
}

function handleSettingsEvent(e: EventData) {
  const settingsData = (e as SettingsEventData)
  Logger.info("Updated configuration", JSON.stringify(settingsData.getSettings()))
}

function handleSuspendEvent(e: EventData) {
  const suspendData = (e as SuspendEventData)
  Logger.info(suspendData.isSuspend() ? "Go to sleep!" : "Awake!")
}

export default definePlugin((serverApi: ServerAPI) => {
  (async () => {
    await Framework.initialize(serverApi, Constants.PLUGIN_NAME, Constants.PLUGIN_VERSION, translations)

    EventBus.subscribe(EventType.SHORTCUT, handleShortcutEvent)
    EventBus.subscribe(EventType.GAME_LIFE, handleGameEvent);
    EventBus.subscribe(EventType.SETTINGS, handleSettingsEvent);
    EventBus.subscribe(EventType.SUSPEND, handleSuspendEvent);

    Settings.setEntry<Config>("time", new Date().toLocaleString(), true)
    ShortcutListener.watch("valid", [...shortcutButtons])
    ShortcutListener.watch("invalid", [Button.R1, Button.Y])
  })()

  serverApi.routerHook.addRoute(Constants.ROUTE_DECKY_PLUGIN_TEST, RouterTest, {
    exact: true,
  });

  return {
    title: <div className={staticClasses.Title}>{Constants.PLUGIN_NAME}</div>,
    content: <MainMenu />,
    icon: <FaShip />,
    async onDismount() {
      await Framework.shutdown()
      serverApi.routerHook.removeRoute(Constants.ROUTE_DECKY_PLUGIN_TEST);
    }
  };
});
