import { createContext, useCallback, useEffect, useState } from 'react';
import { Profiles } from "../settings/profiles";
import { AppOverviewExt, Profile } from '../utils/models';
import { Router } from '@decky/ui';
import { WhiteBoardUtils } from '../utils/whiteboard';
import { EventBus, EventData, EventType, Logger, WhiteBoardEventData } from 'decky-plugin-framework';
import { debounce } from 'lodash';

interface PerformanceContextType {
    id: string
    appId: string
    name: string
    icon: string | undefined
    onBattery: boolean
    profile: Profile
    setProfile: (profile: Profile) => void,
    saveProfile: (id: string, name: string, profile: Profile) => void
}

const defaultValue: PerformanceContextType = {
    id: WhiteBoardUtils.getRunningGameId(),
    appId: Profiles.getAppId(String(WhiteBoardUtils.getRunningGameId())),
    name: Profiles.getAppName(String(WhiteBoardUtils.getRunningGameId())),
    icon: undefined,
    onBattery: WhiteBoardUtils.getOnBattery(),
    profile: Profiles.getProfileForId(String(WhiteBoardUtils.getRunningGameId())),
    setProfile() { },
    saveProfile() { },
};

const loadIcon = (appId: string) => {
    let newIconSrc: string | undefined = undefined;
    (Router.RunningApps as AppOverviewExt[]).filter((app) => {
        if (!newIconSrc && app.icon_data && String(app.appid) == appId) {
            newIconSrc = "data:image/" + app.icon_data_format + ";base64," + app.icon_data
        }
    });
    return newIconSrc
}

export const PerformanceContext = createContext(defaultValue);

export function PerformanceProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [onBattery, setOnBattery] = useState(WhiteBoardUtils.getOnBattery())
    const [id, setId] = useState(WhiteBoardUtils.getRunningGameId())
    const [appId, setAppId] = useState(Profiles.getAppId(id));
    const [name, setName] = useState(Profiles.getAppName(id));
    const [icon, setIcon] = useState<string | undefined>(loadIcon(Profiles.getAppId(id)))
    const [profile, setProfile] = useState<Profile>(Profiles.getProfileForId(id))
    const saveProfile = useCallback(debounce((id: string, name: string, profile: Profile) => {
        Logger.info("Saving profile " + id + " (" + name + ")")
        Profiles.saveProfileForId(id, profile)
        Profiles.applyGameProfile(id)
    }, 500), [id, name, profile])

    const onBatteryEffect = (e: EventData) => {
        const data = (e as WhiteBoardEventData)
        if (data.getId() == "onBattery") {
            setOnBattery(() => {
                return data.getValue() as boolean
            })
        }
    }

    const onIdEffect = (e: EventData) => {
        const data = (e as WhiteBoardEventData)
        if (data.getId() == "runningGameId") {
            setId((id) => {
                if (id != (data.getValue() as string)) {
                    setProfile(Profiles.getProfileForId(data.getValue()))
                    setAppId(Profiles.getAppId(data.getValue()))
                    setName(Profiles.getAppName(data.getValue()))
                    setIcon(loadIcon(Profiles.getAppId(data.getValue())))
                }
                return String((data.getValue() as string))
            })
        }
    }

    useEffect(() => {
        const unsBat = EventBus.subscribe(EventType.WHITEBOARD, (e) => onBatteryEffect(e)).unsubscribe
        const unsID = EventBus.subscribe(EventType.WHITEBOARD, (e) => onIdEffect(e)).unsubscribe

        return () => {
            unsBat()
            unsID()
        }
    }, [])

    return (
        <PerformanceContext.Provider value={{ id, appId, name, icon, onBattery, profile, setProfile, saveProfile }} >
            {children}
        </PerformanceContext.Provider>
    );
}
