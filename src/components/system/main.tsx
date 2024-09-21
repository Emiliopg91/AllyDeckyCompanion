import { FC } from "react"
import { BiosBlock } from "./biosBlock";
import { PluginBlock } from "./pluginBlock";

export const SystemBlock: FC = () => {
    return (
        <>
            <BiosBlock />
            <PluginBlock />
        </>
    );
};