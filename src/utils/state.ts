import { Router } from "@decky/ui";
import { Constants } from "./constants";

export class State {
    public static ON_BATTERY: boolean = (window as any).SystemPowerStore.m_eACState == 1;
    public static RUNNING_GAME_ID = (Router.MainRunningApp
        ? Router.MainRunningApp.appid + (State.ON_BATTERY ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
        : (State.ON_BATTERY ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC))
    public static IS_ALLY = false
    public static IS_ALLY_X = false
    public static CURRENT_TAB = "cpu";
    public static PROFILE_PER_GAME = false
    public static SDTDP_SETTINGS_PRESENT = false;
    public static SDTDP_ENABLED = false;
    public static ONLY_GUI = false
    public static PLUGIN_LATEST_VERSION = "";
    public static BIOS_VERSION = "";
    public static BIOS_LATEST_VERSION = "";
}