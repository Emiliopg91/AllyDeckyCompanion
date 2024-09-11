import { useState, VFC } from "react"

import { CpuBlock } from "../components/cpuBlock";
import { SystemBlock } from "../components/systemBlock";
import { PluginBlock } from "../components/pluginBlock";
import { State } from "../utils/state";
import { PanelSection, PanelSectionRow } from "decky-frontend-lib";

export const MainMenu: VFC = () => {
  const [cpuCollapsed, setCpuCollapsed] = useState(false);
  const [systemCollapsed, setSystemCollapsed] = useState(true);
  const [pluginCollapsed, setPluginCollapsed] = useState(true);
  const showWarning = !State.IS_ALLY

  return (
    <>
      {showWarning &&
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
      <CpuBlock collapsed={cpuCollapsed} onCollapse={() => {
        setSystemCollapsed(true)
        setPluginCollapsed(true)
        setCpuCollapsed(!cpuCollapsed)
      }
      } />
      <SystemBlock collapsed={systemCollapsed} onCollapse={() => {
        setPluginCollapsed(true)
        setCpuCollapsed(true)
        setSystemCollapsed(!systemCollapsed)
      }
      } />
      <PluginBlock collapsed={pluginCollapsed} onCollapse={() => {
        setSystemCollapsed(true)
        setCpuCollapsed(true)
        setPluginCollapsed(!pluginCollapsed)
      }
      } />
    </>
  );
};