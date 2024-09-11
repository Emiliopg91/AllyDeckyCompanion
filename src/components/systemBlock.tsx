import { PanelSectionRow, ToggleField } from "decky-frontend-lib"
import { useState, VFC } from "react"
import { SystemSettings } from "../settings/system";
import { CollapsibleItem } from "./collapsibleItem";
import { Translator } from "decky-plugin-framework";

export const SystemBlock: VFC<{ collapsed: boolean, onCollapse: () => void }> = ({ collapsed, onCollapse }) => {
  const [limitBattery, setLimitBattery] = useState(SystemSettings.getLimitBattery())
  const onLimitBatteryChange = (newVal: boolean) => {
    SystemSettings.setLimitBattery(newVal);

    setLimitBattery(newVal)
  }

  return (
    <>
      <CollapsibleItem title={Translator.translate("system.info")} collapsed={collapsed} onCollapse={onCollapse}>
        <PanelSectionRow>
          <ToggleField
            label={Translator.translate("limit.battery")}
            description={Translator.translate("limit.battery.desc")}
            checked={limitBattery}
            onChange={onLimitBatteryChange}
            highlightOnFocus
          />
        </PanelSectionRow>
      </CollapsibleItem>
    </>
  );
};