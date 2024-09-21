import { createContext, useContext, useEffect, useState } from 'react';
import { State } from "../utils/state";
import { Profiles } from "../settings/profiles";
import { AppOverviewExt, Profile } from '../utils/models';
import { Router } from '@decky/ui';
import { GlobalContext } from './globalContext';

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
    id: State.RUNNING_GAME_ID,
    appId: Profiles.getAppId(State.RUNNING_GAME_ID),
    name: Profiles.getAppName(State.RUNNING_GAME_ID),
    icon: undefined,
    onBattery: State.ON_BATTERY,
    profile: Profiles.getProfileForId(State.RUNNING_GAME_ID),
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
    const [onBattery, setOnBattery] = useState(State.ON_BATTERY);
    const [id, setId] = useState(State.RUNNING_GAME_ID);
    const [appId, setAppId] = useState(Profiles.getAppId(id));
    const [name, setName] = useState(Profiles.getAppName(id));
    const [icon, setIcon] = useState<string | undefined>(loadIcon(Profiles.getAppId(id)))
    const [profile, setProfile] = useState<Profile>(Profiles.getProfileForId(id))
    const { refreshTrigger } = useContext(GlobalContext)

    useEffect(() => {
        setOnBattery(() => {
            return State.ON_BATTERY
        })
        setId(id => {
            if (id != State.RUNNING_GAME_ID) {
                setAppId(Profiles.getAppId(id))
                setName(Profiles.getAppName(id))
                setIcon(loadIcon(Profiles.getAppId(id)))
            }
            return State.RUNNING_GAME_ID
        })
    }, [refreshTrigger])

    return (
        <PerformanceContext.Provider value={{ id, appId, name, icon, onBattery, profile, setProfile }} >
            {children}
        </PerformanceContext.Provider>
    );
}
