import { createContext, useEffect, useState } from 'react';
import { State } from "../utils/state";


interface GlobalContextType {
    profilePerGame: boolean
    setProfilePerGame: (newVal: boolean) => void
    refreshTrigger: boolean
}

const defaultValue: GlobalContextType = {
    profilePerGame: State.PROFILE_PER_GAME,
    setProfilePerGame: () => { },
    refreshTrigger: true,
};

export const GlobalContext = createContext(defaultValue);

export function GlobalProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [profilePerGame, setProfilePerGame] = useState(State.PROFILE_PER_GAME)
    const [refreshTrigger, setRefreshTrigger] = useState(defaultValue.refreshTrigger)

    const refreshFn = () => {
        setRefreshTrigger(prev => !prev)
    }

    useEffect(() => {
        const profRefresh = setInterval(() => refreshFn(), 500)

        return () => {
            clearInterval(profRefresh)
        }
    }, [])

    return (
        <GlobalContext.Provider value={{ profilePerGame, setProfilePerGame, refreshTrigger }} >
            {children}
        </GlobalContext.Provider>
    );
}
