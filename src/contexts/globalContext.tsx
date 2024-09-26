import { createContext, useState } from 'react';

import { PluginSettings } from '../utils/settings';

interface GlobalContextType {
  profilePerGame: boolean;
  setProfilePerGame: (newVal: boolean) => void;
}

const defaultValue: GlobalContextType = {
  profilePerGame: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setProfilePerGame: () => {}
};

export const GlobalContext = createContext(defaultValue);

export function GlobalProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [profilePerGame, setProfilePerGame] = useState(PluginSettings.getProfilePerGame()!);

  return (
    <GlobalContext.Provider value={{ profilePerGame, setProfilePerGame }}>
      {children}
    </GlobalContext.Provider>
  );
}
