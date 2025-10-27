import {
  EventBus,
  EventData,
  EventType,
  GameLifeEventData,
  Logger,
  WhiteBoardEventData
} from 'decky-plugin-framework';
import { debounce } from 'lodash';

import { Profiles } from '../settings/profiles';
import { AsyncUtils } from './async';
import { BackendUtils } from './backend';
import { Constants } from './constants';
import { PluginSettings } from './settings';
import { WhiteBoardUtils } from './whiteboard';

export class Listeners {
  private static unsubscribeGameEvents: (() => void) | undefined = undefined;
  private static unsubscribeBrightnessEvents: (() => void) | undefined = undefined;
  private static unsubscribeGameIdEvents: (() => void) | undefined = undefined;
  private static unsubscribeShutdownEvents: (() => void) | undefined = undefined;
  private static unsubscribeSuspendEvents: (() => void) | undefined = undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static debouncedBrightnessListener = debounce((event: any) => {
    AsyncUtils.runMutexForProfile((release) => {
      if (event.flBrightness != WhiteBoardUtils.getBrightness()) {
        WhiteBoardUtils.setBrightness(event.flBrightness);
        Profiles.setBrightnessForProfileId(WhiteBoardUtils.getRunningGameId(), event.flBrightness);
      }
      release();
    });
  }, 1000);

  private static debouncedVolumeListener = debounce((id: number) => {
    AsyncUtils.runMutexForProfile((release) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SteamClient.System.Audio.GetDevices().then((devs: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dev = devs.vecDevices.filter((dev: any) => dev.id == id)[0];
        const devName = dev.sName;
        const volume = dev.flOutputVolume;
        if (volume != WhiteBoardUtils.getVolume()) {
          WhiteBoardUtils.setAudioDevice(devName);
          WhiteBoardUtils.setVolume(volume);
          Profiles.setAudioForProfileId(WhiteBoardUtils.getRunningGameId(), devName, volume);
        }
        release();
      });
    });
  }, 1000);

  private static debouncedAudioDevListener = debounce(() => {
    AsyncUtils.runMutexForProfile((release) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SteamClient.System.Audio.GetDevices().then((devs: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dev = devs.vecDevices.filter((dev: any) => dev.id == devs.activeOutputDeviceId)[0];
        const devName = dev.sName;
        if (devName != WhiteBoardUtils.getAudioDevice()) {
          Logger.info('Changed audio sink to ' + devName);
          let volume = dev.flOutputVolume;

          const profile = Profiles.getProfileForId(WhiteBoardUtils.getRunningGameId());
          if (profile.audio.devices[devName]) {
            volume = profile.audio.devices[devName].volume;
          }

          WhiteBoardUtils.setAudioDevice(devName);
          WhiteBoardUtils.setVolume(volume);
          Profiles.setAudioForProfileId(WhiteBoardUtils.getRunningGameId(), devName, volume);
        }
        release();
      });
    });
  }, 1000);

  public static bind(): void {
    Listeners.unsubscribeShutdownEvents = SteamClient.User.RegisterForShutdownStart(() => {
      AsyncUtils.runMutexForProfile((release) => {
        Logger.info('Setting CPU profile for shutdown/restart');
        BackendUtils.applyProfile(Profiles.getFullPowerProfile()).finally(() => {
          release();
        });
      });
    }).unregister;

    Listeners.unsubscribeBrightnessEvents = SteamClient.System.Display.RegisterForBrightnessChanges(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: any) => {
        if (WhiteBoardUtils.getBrightness() == undefined) {
          WhiteBoardUtils.setBrightness(event.flBrightness);
        } else {
          if (!AsyncUtils.isDisplayLocked()) {
            Listeners.debouncedBrightnessListener(event);
          }
        }
      }
    ).unregister;

    Listeners.unsubscribeGameEvents = EventBus.subscribe(EventType.GAME_LIFE, (e: EventData) => {
      const event = e as GameLifeEventData;
      Logger.info('New game event');
      if (PluginSettings.getProfilePerGame()) {
        const prevId = WhiteBoardUtils.getRunningGameId();
        const newId = event.isRunning()
          ? String(event.getGameId()) +
            (WhiteBoardUtils.getOnBattery() ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
          : WhiteBoardUtils.getOnBattery()
            ? Constants.DEFAULT_ID
            : Constants.DEFAULT_ID_AC;
        if (prevId != newId) {
          WhiteBoardUtils.setRunningGameId(newId);
        }
      }
    }).unsubscribe;

    SteamClient.System.Audio.RegisterForDeviceVolumeChanged((e: number) => {
      Listeners.debouncedVolumeListener(e);
    });

    SteamClient.System.Audio.RegisterForDeviceAdded(() => {
      Listeners.debouncedAudioDevListener();
    });

    SteamClient.System.Audio.RegisterForDeviceRemoved(() => {
      Listeners.debouncedAudioDevListener();
    });

    SteamClient.System.RegisterForBatteryStateChanges(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state: any) => {
        const onBattery = state.eACState == 1;
        if (WhiteBoardUtils.getOnBattery() == null) {
          Logger.info('First AC state: ' + state.eACState);
          WhiteBoardUtils.setOnBattery(onBattery);
        } else if (WhiteBoardUtils.getOnBattery() != onBattery) {
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

    Listeners.unsubscribeGameIdEvents = EventBus.subscribe(EventType.WHITEBOARD, (e: EventData) => {
      if ((e as WhiteBoardEventData).getId() == 'runningGameId') {
        Profiles.applyGameProfile((e as WhiteBoardEventData).getValue());
      }
    }).unsubscribe;
  }

  public static unbind(): void {
    if (Listeners.unsubscribeGameIdEvents) {
      Listeners.unsubscribeGameIdEvents();
    }
    if (Listeners.unsubscribeGameEvents) {
      Listeners.unsubscribeGameEvents();
    }
    if (Listeners.unsubscribeBrightnessEvents) {
      Listeners.unsubscribeBrightnessEvents();
    }
    if (Listeners.unsubscribeShutdownEvents) {
      Listeners.unsubscribeShutdownEvents();
    }
    if (Listeners.unsubscribeSuspendEvents) {
      Listeners.unsubscribeSuspendEvents();
    }
  }
}
