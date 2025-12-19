/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-empty-function*/
import {
  EventBus,
  EventData,
  EventType,
  Logger,
  WhiteBoardEventData
} from 'decky-plugin-framework';
import { debounce } from 'lodash';
import { createContext, useEffect, useState } from 'react';

import { Profiles } from '../settings/profiles';
import { BackendUtils } from '../utils/backend';
import { Constants } from '../utils/constants';
import { Mode, Profile } from '../utils/models';
import { WhiteBoardUtils } from '../utils/whiteboard';

declare const appStore: any;

interface PerformanceContextType {
  appId: number;
  name: string;
  onBattery: boolean;
  profile: Profile;
  tdpRange: Record<string, number[]>;
  setProfile: (profile: Profile) => void;
  saveProfile: (name: string, profile: Profile) => void;
}

const defaultValue: PerformanceContextType = {
  appId: -1,
  name: Constants.STEAM_OS,
  onBattery: WhiteBoardUtils.getOnBattery() ?? false,
  profile: {
    appId: -1,
    mode: Mode.PERFORMANCE,
    cpu: {
      boost: false,
      epp: Constants.DEFAULT_EPP,
      tdp: { fppl: 5, spl: 5, sppl: 5 },
      scheduler: '',
      cores: {
        smt: Constants.DEFAULT_SMT,
        performance: WhiteBoardUtils.getPCores(),
        eficiency: WhiteBoardUtils.getECores()
      }
    },
    gpu: { frequency: { min: 800, max: 2700 } }
  },
  tdpRange: WhiteBoardUtils.getTdpRange(),
  setProfile() {},
  saveProfile() {}
};

export const PerformanceContext = createContext(defaultValue);

const saveProfile = debounce((name: string, profile: Profile) => {
  Logger.info('Saving profile ' + name);
  Profiles.saveProfileForId(name, profile);
  Profiles.applyGameProfile(name);
}, 500);

export function PerformanceProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [onBattery, setOnBattery] = useState(WhiteBoardUtils.getOnBattery());
  const [name, setName] = useState(WhiteBoardUtils.getRunningGameId());
  const [appId, setAppId] = useState(Profiles.getAppId(name));
  const [profile, setProfile] = useState<Profile>(Profiles.getProfileForId(name));
  const [tdpRange, setTdpRange] = useState<Record<string, number[]>>(WhiteBoardUtils.getTdpRange());

  const onBatteryEffect = (e: EventData): void => {
    const data = e as WhiteBoardEventData;
    if (data.getId() == 'onBattery') {
      setOnBattery(() => {
        return data.getValue() as boolean;
      });
      BackendUtils.getCpuTdpRange().then((data) => {
        WhiteBoardUtils.setTdpRange(data);
        setTdpRange(() => {
          return data;
        });
      });
    }
  };

  const onIdEffect = (e: EventData): void => {
    const data = e as WhiteBoardEventData;
    if (data.getId() == 'runningGameId') {
      setName((id) => {
        if (id != (data.getValue() as string)) {
          setProfile(Profiles.getProfileForId(data.getValue()));
          setAppId(Profiles.getAppId(data.getValue()));
          setName(data.getValue());
        }
        return String(data.getValue() as string);
      });
    }
  };

  useEffect(() => {
    const unsBat = EventBus.subscribe(EventType.WHITEBOARD, (e) => onBatteryEffect(e)).unsubscribe;
    const unsID = EventBus.subscribe(EventType.WHITEBOARD, (e) => onIdEffect(e)).unsubscribe;

    return (): void => {
      unsBat();
      unsID();
    };
  }, []);

  return (
    <PerformanceContext.Provider
      value={{
        appId,
        name,
        onBattery: onBattery ?? false,
        profile,
        setProfile,
        saveProfile,
        tdpRange
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}
