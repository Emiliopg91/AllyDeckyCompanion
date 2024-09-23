import { createContext, useState } from 'react';

import { WhiteBoardUtils } from '../utils/whiteboard';

interface GlobalContextType {
  profilePerGame: boolean;
  setProfilePerGame: (newVal: boolean) => void;
}

const defaultValue: GlobalContextType = {
  profilePerGame: WhiteBoardUtils.getProfilePerGame(),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setProfilePerGame: () => {}
};

export const GlobalContext = createContext(defaultValue);

export function GlobalProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [profilePerGame, setProfilePerGame] = useState(WhiteBoardUtils.getProfilePerGame());

  return (
    <GlobalContext.Provider value={{ profilePerGame, setProfilePerGame }}>
      {children}
    </GlobalContext.Provider>
  );
}
