/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-empty-function*/
import { Router, SteamAppOverview } from '@decky/ui';
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
import { CorsClient } from '../utils/cors';
import { AppOverviewExt, Mode, Profile } from '../utils/models';
import { WhiteBoardUtils } from '../utils/whiteboard';

declare const appStore: any;

interface PerformanceContextType {
  id: string;
  appId: string;
  name: string;
  icon: string | undefined;
  onBattery: boolean;
  profile: Profile;
  tdpRange: Record<string, number[]>;
  setProfile: (profile: Profile) => void;
  saveProfile: (id: string, name: string, profile: Profile) => void;
}

const defaultValue: PerformanceContextType = {
  id: WhiteBoardUtils.getRunningGameId(),
  appId: Profiles.getAppId(String(WhiteBoardUtils.getRunningGameId())),
  name: Profiles.getAppName(String(WhiteBoardUtils.getRunningGameId())),
  icon: undefined,
  onBattery: WhiteBoardUtils.getOnBattery() ?? false,
  profile: {
    mode: Mode.PERFORMANCE,
    cpu: {
      boost: false,
      epp: Constants.DEFAULT_EPP,
      governor: Constants.DEFAULT_GOVERNOR,
      tdp: { fppl: 5, spl: 5, sppl: 5 },
      smt: Constants.DEFAULT_SMT,
      scheduler: ''
    },
    gpu: { frequency: { min: 800, max: 2700 } },
    display: {},
    audio: {
      devices: {}
    }
  },
  tdpRange: WhiteBoardUtils.getTdpRange(),
  setProfile() {},
  saveProfile() {}
};

export const PerformanceContext = createContext(defaultValue);

const loadIcon = async (
  appId: string,
  setIcon: (icon: string | undefined) => void
): Promise<void> => {
  let appDetail: AppOverviewExt | undefined = undefined;
  (Router.RunningApps as AppOverviewExt[]).forEach((app: AppOverviewExt) => {
    if (String(app.appid) == appId) {
      appDetail = app;
    }
  });

  if (appDetail) {
    const app = appDetail as AppOverviewExt;
    if (app.icon_data) {
      setIcon('data:image/' + app.icon_data_format + ';base64,' + app.icon_data);
    } else {
      if (app.icon_hash) {
        const icon = await BackendUtils.getIconForApp(appId);
        if (icon) {
          setIcon(icon);
        } else {
          try {
            const iconUrl = appStore.GetIconURLForApp(app as SteamAppOverview);
            const response = await CorsClient.fetchUrl(iconUrl);
            if (response.ok) {
              const reader = new FileReader();
              reader.onload = (): void => {
                const newIconSrc = reader.result as string;
                BackendUtils.setIconForApp(appId, newIconSrc);
                setIcon(newIconSrc);
              };
              reader.readAsDataURL(await response.blob());
            } else {
              throw new Error(response.statusText);
            }
          } catch (e) {
            Logger.error('Error getting icon from URL: ', e);
            setIcon(undefined);
          }
        }
      } else {
        setIcon(undefined);
      }
    }
  }
};

const saveProfile = debounce((id: string, name: string, profile: Profile) => {
  Logger.info('Saving profile ' + id + ' (' + name + ')');
  Profiles.saveProfileForId(id, profile);
  Profiles.applyGameProfile(id);
}, 500);

export function PerformanceProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [onBattery, setOnBattery] = useState(WhiteBoardUtils.getOnBattery());
  const [id, setId] = useState(WhiteBoardUtils.getRunningGameId());
  const [appId, setAppId] = useState(Profiles.getAppId(id));
  const [name, setName] = useState(Profiles.getAppName(id));
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<Profile>(Profiles.getProfileForId(id));
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
      setId((id) => {
        if (id != (data.getValue() as string)) {
          setProfile(Profiles.getProfileForId(data.getValue()));
          setAppId(Profiles.getAppId(data.getValue()));
          setName(Profiles.getAppName(data.getValue()));
          loadIcon(Profiles.getAppId(data.getValue()), setIcon);
        }
        return String(data.getValue() as string);
      });
    }
  };

  useEffect(() => {
    const unsBat = EventBus.subscribe(EventType.WHITEBOARD, (e) => onBatteryEffect(e)).unsubscribe;
    const unsID = EventBus.subscribe(EventType.WHITEBOARD, (e) => onIdEffect(e)).unsubscribe;
    loadIcon(appId, setIcon);

    return (): void => {
      unsBat();
      unsID();
    };
  }, []);

  return (
    <PerformanceContext.Provider
      value={{
        id,
        appId,
        name,
        icon,
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
