import { PanelSection, PanelSectionRow } from "@decky/ui"
import { FC } from "react"

import { Translator } from "decky-plugin-framework";
import { WhiteBoardUtils } from "../../utils/whiteboard";

export const WarningBlock: FC = () => {

  return (
    <>
      {WhiteBoardUtils.getOnlyGui() &&
        <>
          <>
            <PanelSection>
              <PanelSectionRow>
                <span>{Translator.translate("no.profiles.applied")} </span>
                <br />
                {WhiteBoardUtils.getSdtdpEnabled() &&
                  <>
                    <br />
                    <span>{Translator.translate("sdtdp.enabled")}</span>
                  </>
                }
                {!WhiteBoardUtils.getIsAlly() &&
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