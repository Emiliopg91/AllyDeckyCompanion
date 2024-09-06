import { ButtonItem, Menu, MenuItem, Navigation, PanelSection, PanelSectionRow, showContextMenu } from "decky-frontend-lib"
import { VFC } from "react"

import logo from "../../assets/logo.png"
import { Logger, System, Translator } from "decky-plugin-framework";
import { Constants } from "../utils/constants";
import { BackendUtils } from "../utils/backend";

export const MainMenu: VFC = () => {
  return (
    <PanelSection title={Translator.translate("panel.section")}>

      <PanelSectionRow>
        <h2>{System.getCurrentUser()}, {Translator.translate("hello.world")}</h2>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            showContextMenu(
              <Menu label="Menu" cancelText={Translator.translate("cancel")} onCancel={() => { }}>
                <MenuItem onSelected={() => { }}>{Translator.translate("item.#", { id: 1 })}</MenuItem>
                <MenuItem onSelected={() => { }}>{Translator.translate("item.#", { id: 2 })}</MenuItem>
                <MenuItem onSelected={() => { }}>{Translator.translate("item.#", { id: 3 })}</MenuItem>
                <MenuItem onSelected={() => { }}>{Translator.translate("item.#", { id: 4 })}</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            )
          }
        >
          {Translator.translate("server.says.yolo")}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img src={logo} />
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => {
            Navigation.CloseSideMenus();
            Navigation.Navigate(Constants.ROUTE_DECKY_PLUGIN_TEST);
            BackendUtils.add(1, 2).then((e) => {
              Logger.info("1+2=" + e);
            })
          }}
        >
          {Translator.translate("router")}
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
};