import { PanelSection, PanelSectionRow, Field } from "@decky/ui"
import { FC, useContext } from "react"

import { Translator } from "decky-plugin-framework";
import { FaBatteryFull, FaSteamSquare } from "react-icons/fa";
import { PiPlugFill } from "react-icons/pi";
import { Constants } from "../../utils/constants";
import { PerformanceContext } from "../../contexts/performanceContext";

export const HeaderBlock: FC = () => {
  const { onBattery, id, name, icon } = useContext(PerformanceContext)

  return (
    <PanelSection >
      <PanelSectionRow>
        <Field label={Translator.translate("profile.for")} bottomSeparator="standard">
          {onBattery &&
            <FaBatteryFull />
          }
          {!onBattery &&
            <PiPlugFill />
          }
          {(id != Constants.DEFAULT_ID && id != Constants.DEFAULT_ID_AC && icon) &&
            <>
              <span> </span>
              <img
                style={{ maxWidth: 16, maxHeight: 16, border:"1px solid gray" }}
                src={icon}
              />
            </>
          }
          {(id == Constants.DEFAULT_ID || id == Constants.DEFAULT_ID_AC) &&
            <FaSteamSquare />
          }
          <span> </span>
          {name}
        </Field>
      </PanelSectionRow>
    </PanelSection>
  );
};