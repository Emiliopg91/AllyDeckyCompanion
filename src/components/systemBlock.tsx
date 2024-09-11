import { Button, PanelSection, PanelSectionRow, ToggleField } from "decky-frontend-lib"
import { useEffect, useState, VFC } from "react"
import { SystemSettings } from "../settings/system";
import { CollapsibleItem } from "./collapsibleItem";

export const SystemBlock: VFC<{ collapsed: boolean, onCollapse: () => void }> = ({ collapsed, onCollapse }) => {
  const [limitBattery, setLimitBattery] = useState(SystemSettings.getLimitBattery())
  const onLimitBatteryChange = (newVal: boolean) => {
    SystemSettings.setLimitBattery(newVal);

    setLimitBattery(newVal)
  }

  return (
    <>
      <CollapsibleItem title="System settings" collapsed={collapsed} onCollapse={onCollapse}>
        <PanelSectionRow>
          <ToggleField
            label="Limit battery charge"
            description="Increase battery lifespan setting max charge to 80%"
            checked={limitBattery}
            onChange={onLimitBatteryChange}
            highlightOnFocus
          />
        </PanelSectionRow>
      </CollapsibleItem>
    </>
  );
};