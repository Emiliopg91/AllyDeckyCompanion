
import { CpuBlock } from "../components/cpuBlock";
import { SystemBlock } from "../components/settingsBlock";
import { PluginBlock } from "../components/pluginBlock";
import { State } from "../utils/state";
import { DropdownItem, PanelSection, PanelSectionRow } from "decky-frontend-lib";
import { ContributeBlock } from "../components/contributeBlock";
import { FC, useEffect } from "react";
import { Translator } from "decky-plugin-framework";

export const MainMenu: FC = () => {
  useEffect(() => {
    State.CURRENT_TAB = "cpu"
  }, [])

  return (
    <>
      {!State.IS_ALLY &&
        <>
          <PanelSection>
            <PanelSectionRow>
              <span></span>
              <br />
              <span>No compatible device, only for GUI debug purposes</span>
            </PanelSectionRow>
          </PanelSection>
        </>
      }
      <div>
        <DropdownItem selectedOption={State.CURRENT_TAB}
          rgOptions={[
            {
              data: "cpu",
              label: Translator.translate("performance.settings")
            },
            {
              data: "system",
              label: Translator.translate("settings.info")
            },
            {
              data: "plugin",
              label: Translator.translate("plugin.info")
            }
          ]}
          onChange={(newVal) => { State.CURRENT_TAB = newVal.data }}
        />
      </div>
      {State.CURRENT_TAB === "cpu" &&
        <CpuBlock />
      }
      {State.CURRENT_TAB === "system" &&
        <SystemBlock />

      }
      {State.CURRENT_TAB === "plugin" &&
        <PluginBlock />
      }
      <ContributeBlock />
    </>
  );
};