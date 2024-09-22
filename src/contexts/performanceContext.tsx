import { createContext, useEffect, useState } from 'react';
import { Profiles } from "../settings/profiles";
import { AppOverviewExt, Profile } from '../utils/models';
import { Router } from '@decky/ui';
import { WhiteBoardUtils } from '../utils/whiteboard';
import { EventBus, EventType, Logger, WhiteBoardEventData } from 'decky-plugin-framework';

interface PerformanceContextType {
    id: string
    appId: string
    name: string
    icon: string | undefined
    onBattery: boolean
    profile: Profile
    setProfile: (profile: Profile) => void
}

const defaultValue: PerformanceContextType = {
    id: WhiteBoardUtils.getRunningGameId(),
    appId: Profiles.getAppId(String(WhiteBoardUtils.getRunningGameId())),
    name: Profiles.getAppName(String(WhiteBoardUtils.getRunningGameId())),
    icon: undefined,
    onBattery: WhiteBoardUtils.getOnBattery(),
    profile: Profiles.getProfileForId(String(WhiteBoardUtils.getRunningGameId())),
    setProfile: () => { }
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

    useEffect(() => {
        const unsBat = EventBus.subscribe(EventType.WHITEBOARD, (e) => {
            const data = (e as WhiteBoardEventData)
            if (data.getId() == "onBattery") {
                setOnBattery((bat) => {
                    if (bat != data.getValue() as boolean) {
                        Logger.info("")
                    }
                    return data.getValue() as boolean
                })
            }
        }).unsubscribe
        const unsID = EventBus.subscribe(EventType.WHITEBOARD, (e) => {
            const data = (e as WhiteBoardEventData)
            if (data.getId() == "runningGameId") {
                setId((id) => {
                    if (id != (data.getValue() as string)) {
                        setAppId(Profiles.getAppId((data.getValue() as string)))
                        setName(Profiles.getAppName((data.getValue() as string)))
                        setIcon(loadIcon(Profiles.getAppId((data.getValue() as string))))
                    }
                    return String((data.getValue() as string))
                })
            }
        }).unsubscribe

        return () => {
            unsBat()
            unsID()
        }
    }, [])

    return (
        <PerformanceContext.Provider value={{ id, appId, name, icon, onBattery, profile, setProfile }} >
            {children}
        </PerformanceContext.Provider>
    );
}
