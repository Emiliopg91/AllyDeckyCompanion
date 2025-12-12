import { sleep } from '@decky/ui';
import {
  EventBus,
  EventData,
  EventType,
  GameLifeEventData,
  Logger,
  SuspendEventData,
  WhiteBoardEventData
} from 'decky-plugin-framework';

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

  public static bind(): void {
    Listeners.unsubscribeSuspendEvents = EventBus.subscribe(EventType.SUSPEND, (e: EventData) => {
      const event = e as SuspendEventData;
      if (event.isSuspend()) {
        AsyncUtils.runMutexForProfile((release) => {
          Logger.info('Setting CPU profile for suspension');
          BackendUtils.applyProfile(Profiles.getFullPowerProfile()).finally(() => {
            release();
          });
        });
      } else {
        Logger.info('Waiting for 10 seconds since resume to restore profile');
        sleep(10000).then(() => {
          Logger.info('Restoring profile');
          BackendUtils.applyProfile(Profiles.getProfileForId(WhiteBoardUtils.getRunningGameId()));
        });
      }
    }).unsubscribe;
    Listeners.unsubscribeShutdownEvents = SteamClient.User.RegisterForShutdownStart(() => {
      AsyncUtils.runMutexForProfile((release) => {
        Logger.info('Setting CPU profile for shutdown/restart');
        BackendUtils.applyProfile(Profiles.getFullPowerProfile()).finally(() => {
          release();
        });
      });
    }).unregister;

    Listeners.unsubscribeGameEvents = EventBus.subscribe(EventType.GAME_LIFE, (e: EventData) => {
      const event = e as GameLifeEventData;
      Logger.info('New game event');
      if (event.isRunning()) {
        BackendUtils.renice(event.getPID());
      }
      if (PluginSettings.getProfilePerGame()) {
        event.getDetails().then((data) => {
          const prevId = WhiteBoardUtils.getRunningGameId();
          const newId = event.isRunning()
            ? String(data.getDisplayName())
            : Constants.DEFAULT_DEFAULT;
          if (prevId != newId) {
            WhiteBoardUtils.setRunningGameId(newId);
          }
        });
      }
    }).unsubscribe;

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
          WhiteBoardUtils.setRunningGameId(WhiteBoardUtils.getRunningGameId());
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
