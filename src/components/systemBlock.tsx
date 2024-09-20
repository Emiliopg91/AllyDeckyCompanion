import { ButtonItem, Field, PanelSection, PanelSectionRow } from "@decky/ui"
import { FC, useState, } from "react"
import { Constants } from "../utils/constants";
import { BackendUtils } from "../utils/backend";
import { Translator } from "decky-plugin-framework";
import { Toast } from "../utils/toast";
import { State } from "../utils/state";

export const SystemBlock: FC = () => {
    const [isPluginDoingThings, setIsPluginDoingThings] = useState(false);

    return (
        <>
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
            <PanelSection title={Translator.translate("plugin")}>
                <PanelSectionRow>
                    <Field label={Translator.translate("installed.version")} bottomSeparator="none">
                        {Constants.PLUGIN_VERSION}
                    </Field>
                </PanelSectionRow>
                {Boolean(State.PLUGIN_LATEST_VERSION) && (
                    <PanelSectionRow>
                        <Field label={Translator.translate("latest.version")} bottomSeparator="none">
                            {State.PLUGIN_LATEST_VERSION}
                        </Field>
                    </PanelSectionRow>
                )}
                {Boolean(State.PLUGIN_LATEST_VERSION) && (
                    <>
                        <PanelSectionRow>
                            <ButtonItem
                                onClick={() => {
                                    Toast.toast(Constants.PLUGIN_VERSION === State.PLUGIN_LATEST_VERSION && Boolean(State.PLUGIN_LATEST_VERSION) ? Translator.translate("reinstalling.plugin") : Translator.translate("updating.plugin"))
                                    setIsPluginDoingThings(true)
                                    BackendUtils.otaUpdate();
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                                disabled={isPluginDoingThings}
                            >
                                {Constants.PLUGIN_VERSION === State.PLUGIN_LATEST_VERSION && Boolean(State.PLUGIN_LATEST_VERSION) ? Translator.translate("reinstall.plugin") : Translator.translate("update.to", { "version": State.PLUGIN_LATEST_VERSION })}
                            </ButtonItem>
                        </PanelSectionRow>
                    </>
                )}
            </PanelSection >
        </>
    );
};