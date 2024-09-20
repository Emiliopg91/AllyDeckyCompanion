import { ButtonItem, Field, PanelSection, PanelSectionRow } from "@decky/ui"
import { FC, useEffect, useState, } from "react"
import { Constants } from "../utils/constants";
import { BackendUtils } from "../utils/backend";
import { Logger, Translator } from "decky-plugin-framework";
import { Toast } from "../utils/toast";

const getLatestVersionNum = async () => {
    try {
        const result = await fetch(
            "https://raw.githubusercontent.com/Emiliopg91/AllyDeckyCompanion/main/package.json",
            { method: "GET" }
        );

        if (result.ok) {
            return (await result.json())["version"]
        } else {
            return "";
        }
    } catch (e) {
        Logger.error("Error fetching latest version", e)
        return ""
    }
};

export const PluginBlock: FC = () => {
    const [latestVersionNum, setLatestVersionNum] = useState("");
    const [isUpdated, setIsUpdated] = useState(true);
    const [isDoingThings, setIsDoingThings] = useState(false);

    useEffect(() => {
        (async () => {
            const fetchedVersionNum = await getLatestVersionNum();
            setLatestVersionNum(fetchedVersionNum);
            setIsUpdated(Constants.PLUGIN_VERSION === fetchedVersionNum && Boolean(fetchedVersionNum))
        })();
    }, []);

    return (
        <>
            <PanelSection>
                <>
                    <PanelSectionRow>
                        <Field label={Translator.translate("installed.version")} bottomSeparator="none">
                            {Constants.PLUGIN_VERSION}
                        </Field>
                    </PanelSectionRow>

                    {Boolean(latestVersionNum) && (
                        <PanelSectionRow>
                            <Field label={Translator.translate("latest.version")} bottomSeparator="none">
                                {latestVersionNum}
                            </Field>
                        </PanelSectionRow>
                    )}
                    {Boolean(latestVersionNum) && (
                        <>
                            <PanelSectionRow>
                                <ButtonItem
                                    onClick={() => {
                                        Toast.toast(isUpdated ? Translator.translate("reinstalling.plugin") : Translator.translate("updating.plugin"))
                                        setIsDoingThings(true)
                                        BackendUtils.otaUpdate();
                                    }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                    disabled={isDoingThings}
                                >
                                    {isUpdated ? Translator.translate("reinstall.plugin") : Translator.translate("update.to", { "version": latestVersionNum })}
                                </ButtonItem>
                            </PanelSectionRow>
                        </>
                    )}
                </>
            </PanelSection >
        </>
    );
};