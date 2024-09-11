import { ButtonItem, Field, PanelSectionRow } from "decky-frontend-lib"
import { useEffect, useState, VFC } from "react"
import { Constants } from "../utils/constants";
import { BackendUtils } from "../utils/backend";
import { CollapsibleItem } from "./collapsibleItem";
import { Toast } from "decky-plugin-framework";

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

export const PluginBlock: VFC<{ collapsed: boolean, onCollapse: () => void }> = ({ collapsed, onCollapse }) => {
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
            <CollapsibleItem title="Plugin Info" collapsed={collapsed} onCollapse={onCollapse}>
                <>
                    <PanelSectionRow>
                        <Field label={"Installed Version"} bottomSeparator="none">
                            {Constants.PLUGIN_VERSION}
                        </Field>
                    </PanelSectionRow>

                    {Boolean(latestVersionNum) && (
                        <PanelSectionRow>
                            <Field label={"Latest Version"} bottomSeparator="none">
                                {latestVersionNum}
                            </Field>
                        </PanelSectionRow>
                    )}
                    {Boolean(latestVersionNum) && (
                        <>
                            <PanelSectionRow>
                                <ButtonItem
                                    onClick={() => {
                                        Toast.toast(isUpdated ? "Reinstalling plugin" : "Updating plugin")
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
                                    {isUpdated ? "Reinstall Plugin" : "Update to " + latestVersionNum}
                                </ButtonItem>
                            </PanelSectionRow>
                        </>
                    )}
                </>
            </CollapsibleItem >
        </>
    );
};