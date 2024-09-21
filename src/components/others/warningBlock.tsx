import { PanelSection, PanelSectionRow } from "@decky/ui"
import { FC } from "react"

import { Translator } from "decky-plugin-framework";
import { State } from "../../utils/state";

export const WarningBlock: FC = () => {

  return (
    <>
      {State.ONLY_GUI &&
        <>
          <>
            <PanelSection>
              <PanelSectionRow>
                <span>{Translator.translate("no.profiles.applied")} </span>
                <br />
                {State.SDTDP_ENABLED &&
                  <>
                    <br />
                    <span>{Translator.translate("sdtdp.enabled")}</span>
                  </>
                }
                {!State.IS_ALLY &&
                  <>
                    <br />
                    <span>{Translator.translate("incompatible.device")}</span>
                  </>
                }
              </PanelSectionRow>
            </PanelSection>
          </>
        </>
      }
    </>
  );
};