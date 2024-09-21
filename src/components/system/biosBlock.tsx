import { Field, PanelSection, PanelSectionRow } from "@decky/ui"
import { FC } from "react"
import { Translator } from "decky-plugin-framework";
import { State } from "../../utils/state";

export const BiosBlock: FC = () => {

    return (
        <PanelSection title={Translator.translate("bios")}>
            <PanelSectionRow>
                <Field label={Translator.translate("installed.version")} bottomSeparator="none">
                    {State.BIOS_VERSION}
                </Field>
            </PanelSectionRow>
            {Boolean(State.BIOS_LATEST_VERSION) && (
                <PanelSectionRow>
                    <Field label={Translator.translate("latest.version")} bottomSeparator="none">
                        {State.BIOS_LATEST_VERSION}
                    </Field>
                </PanelSectionRow>
            )}
        </PanelSection>
    );
};