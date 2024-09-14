import { Router } from "decky-frontend-lib";
import { Constants } from "./constants";

export class State {
    public static ON_BATTERY: boolean = (window as any).SystemPowerStore.m_eACState == 1;
    public static RUNNING_GAME_ID = (Router.MainRunningApp ? Router.MainRunningApp.appid : Constants.DEFAULT_ID) + (State.ON_BATTERY ? "" : "-ac")
    public static IS_ALLY = false
    public static IS_ALLY_X = false
    public static CURRENT_TAB = "cpu";
}