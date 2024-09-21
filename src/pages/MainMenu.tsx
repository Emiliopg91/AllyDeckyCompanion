
import { PerformanceBlock } from "../components/performance/main";
import { SettingsBlock } from "../components/settings/main";
import { SystemBlock } from "../components/system/main";
import { ContributeBlock } from "../components/others/contributeBlock";
import { FC } from "react";
import { WarningBlock } from "../components/others/warningBlock";
import { GlobalProvider } from "../contexts/globalContext";
import { MenuBlock } from "../components/others/menuBlock";
import { State } from "../utils/state";

export const MainMenu: FC = () => {
  return (
    <GlobalProvider>
      <>
        <WarningBlock />
        <MenuBlock/>
          {State.CURRENT_TAB === "cpu" &&
          <PerformanceBlock />
          }
          {State.CURRENT_TAB === "settings" &&
          <SettingsBlock />
          }
          {State.CURRENT_TAB === "system" &&
          <SystemBlock />
          }
      <ContributeBlock />
      </>
    </GlobalProvider>
  );
};