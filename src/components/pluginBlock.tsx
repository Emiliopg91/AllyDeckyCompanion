import { ButtonItem, Field, PanelSection, PanelSectionRow } from "decky-frontend-lib"
import { FC, useEffect, useState, } from "react"
import { Constants } from "../utils/constants";
import { BackendUtils } from "../utils/backend";
import { Toast, Translator } from "decky-plugin-framework";

const getLatestVersionNum = async () => {
    const { result } = await BackendUtils.getServerApi().fetchNoCors(
        "https://raw.githubusercontent.com/Emiliopg91/AllyDeckyCompanion/main/package.json",
        { method: "GET" }
    );

    //@ts-ignore
    const body = result.body as string;
    if (body && typeof body === "string") {
        return JSON.parse(body)["version"];
    }
    return "";
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