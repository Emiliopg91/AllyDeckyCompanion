import { ButtonItem, PanelSection, PanelSectionRow } from "decky-frontend-lib"
import { FC } from "react"
import { RiArrowDownSFill, RiArrowUpSFill } from "react-icons/ri";

export const CollapsibleItem: FC<{ collapsed: boolean, title: string, onCollapse: () => void }> = ({ children, collapsed, title, onCollapse }) => {
    return (
        <PanelSection title={title}>
            {!collapsed && children}
            <PanelSectionRow>
                <ButtonItem
                    layout="below"
                    bottomSeparator="standard"
                    onClick={() => {
                        onCollapse()
                    }}
                    style={{
                        width: "100%",
                        height: "20px",
                        display: "flex", // Set the display to flex
                        justifyContent: "center", // Center align horizontally
                        alignItems: "center", // Center align vertically
                    }}
                >
                    {collapsed ? (
                        <RiArrowDownSFill />
                    ) : (
                        <RiArrowUpSFill />
                    )}
                </ButtonItem>
            </PanelSectionRow>
        </PanelSection >
    );
};