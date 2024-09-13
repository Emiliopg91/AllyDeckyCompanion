import { PanelSection, PanelSectionRow, ToggleField } from "decky-frontend-lib"
import { FC, useState } from "react"
import { SystemSettings } from "../settings/system";
import { Translator } from "decky-plugin-framework";

export const SystemBlock: FC = () => {
  const [limitBattery, setLimitBattery] = useState(SystemSettings.getLimitBattery())
  const onLimitBatteryChange = (newVal: boolean) => {
    SystemSettings.setLimitBattery(newVal);

    setLimitBattery(newVal)
  }

  return (
    <>
      <PanelSection>
        <PanelSectionRow>
          <ToggleField
            label={Translator.translate("limit.battery")}
            description={Translator.translate("limit.battery.desc")}
            checked={limitBattery}
            onChange={onLimitBatteryChange}
            highlightOnFocus
          />
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};