import { createContext, useCallback, useEffect, useState } from 'react';
import { Profiles } from "../settings/profiles";
import { AppOverviewExt, Profile } from '../utils/models';
import { Router } from '@decky/ui';
import { WhiteBoardUtils } from '../utils/whiteboard';
import { EventBus, EventData, EventType, Logger, WhiteBoardEventData } from 'decky-plugin-framework';
import { debounce } from 'lodash';
import { BackendUtils } from '../utils/backend';
import { CorsClient } from '../utils/cors'

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

export const PerformanceContext = createContext(defaultValue);

const loadIcon = async (appId: string, setIcon: (icon: string | undefined) => void) => {
    let appDetail: AppOverviewExt | undefined = undefined;
    (Router.RunningApps as AppOverviewExt[]).forEach((app: AppOverviewExt) => {
        if (String(app.appid) == appId) {
            appDetail = app
        }
    });

    if (appDetail) {
        const app = appDetail as AppOverviewExt
        if (app.icon_data) {
            setIcon("data:image/" + app.icon_data_format + ";base64," + app.icon_data)
        } else {
            if (app.icon_hash) {
                const icon = await BackendUtils.getIconForApp(appId)
                if (icon) {
                    setIcon(icon)
                } else {
                    try {
                        const iconUrl = (window as any).appStore.GetIconURLForApp(app)
                        const response = await CorsClient.fetchUrl(iconUrl)
                        if (response.ok) {
                            const reader = new FileReader;
                            reader.onload = () => {
                                const newIconSrc = reader.result as string
                                BackendUtils.setIconForApp(appId, newIconSrc)
                                setIcon(newIconSrc)
                            };
                            reader.readAsDataURL(await response.blob());
                        } else {
                            throw new Error(response.statusText)
                        }
                    } catch (e) {
                        Logger.error("Error getting icon from URL: ", e)
                        setIcon(undefined)
                    }
                }
            } else {
                setIcon(undefined)
            }
        }
    }
}

export function PerformanceProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [onBattery, setOnBattery] = useState(WhiteBoardUtils.getOnBattery())
    const [id, setId] = useState(WhiteBoardUtils.getRunningGameId())
    const [appId, setAppId] = useState(Profiles.getAppId(id));
    const [name, setName] = useState(Profiles.getAppName(id));
    const [icon, setIcon] = useState<string | undefined>(undefined)
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
                    loadIcon(Profiles.getAppId(data.getValue()), setIcon)
                }
                return String((data.getValue() as string))
            })
        }
    }

    useEffect(() => {
        const unsBat = EventBus.subscribe(EventType.WHITEBOARD, (e) => onBatteryEffect(e)).unsubscribe
        const unsID = EventBus.subscribe(EventType.WHITEBOARD, (e) => onIdEffect(e)).unsubscribe
        loadIcon(appId, setIcon)

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
