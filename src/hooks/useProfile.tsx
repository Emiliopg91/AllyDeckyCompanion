import { useEffect, useState } from "react";
import { State } from '../utils/state'
import { Router } from "decky-frontend-lib";
import { AppOverviewExt } from "../utils/models";
import { Profiles } from "../settings/profiles";

export function useProfile(): [string, string, string | undefined, boolean] {

    const loadIcon = () => {
        let newIconSrc: string | undefined = undefined;
        (Router.RunningApps as AppOverviewExt[]).filter((app) => {
            if (!newIconSrc && app.icon_data && String(app.appid) == appId) {
                newIconSrc = "data:image/" + app.icon_data_format + ";base64," + app.icon_data
            }
        });
        return newIconSrc
    }

    const [bat, setBat] = useState(State.ON_BATTERY);
    const [id, setId] = useState(State.RUNNING_GAME_ID);
    const [appId, setAppId] = useState(Profiles.getAppId(State.RUNNING_GAME_ID));
    const [name, setName] = useState(Profiles.getAppName(State.RUNNING_GAME_ID));
    const [iconSrc, setIconSrc] = useState<string | undefined>(loadIcon())

    const profRefreshFn = () => {
        setBat(() => {
            return State.ON_BATTERY
        })
        setId(id => {
            if (id != State.RUNNING_GAME_ID) {
                setAppId(Profiles.getAppId(id))
                setName(Profiles.getAppName(id))
                setIconSrc(loadIcon())
            }
            return State.RUNNING_GAME_ID
        })
    }

    useEffect(() => {
        const profRefresh = setInterval(() => profRefreshFn(), 500)

        return () => {
            clearInterval(profRefresh)
        }
    }, [])

    return [id, name, iconSrc, bat];
}