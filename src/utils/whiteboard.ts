import { Router } from '@decky/ui'
import { WhiteBoard } from 'decky-plugin-framework'
import { Constants } from './constants'

export class WhiteBoardUtils {
    public static getOnBattery(): boolean {
        return WhiteBoard.get("onBattery") || (window as any).SystemPowerStore.m_eACState == 1
    }

    public static setOnBattery(value: boolean) {
        WhiteBoard.set("onBattery", value)
    }

    public static getRunningGameId(): string {
        return WhiteBoard.get<string>("runningGameId") || (Router.MainRunningApp
            ? Router.MainRunningApp.appid + (((window as any).SystemPowerStore.m_eACState == 1) ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
            : (((window as any).SystemPowerStore.m_eACState == 1) ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC))
    }

    public static setRunningGameId(value: string) {
        WhiteBoard.set("runningGameId", value)
    }

    public static getIsAlly(): boolean {
        return WhiteBoard.get("isAlly") || false
    }

    public static setIsAlly(value: boolean) {
        WhiteBoard.set("isAlly", value)
    }

    public static getIsAllyX(): boolean {
        return WhiteBoard.get("isAllyX") || false
    }

    public static setisAllyX(value: boolean) {
        WhiteBoard.set("isAllyX", value)
    }

    public static getTab(): string {
        return WhiteBoard.get("tab") || "performance"
    }

    public static setTab(value: string) {
        WhiteBoard.set("tab", value)
    }

    public static getProfilePerGame(): boolean {
        return WhiteBoard.get("profilePerGame") || false
    }

    public static setProfilePerGame(value: boolean) {
        WhiteBoard.set("profilePerGame", value)
    }

    public static getSdtdpSettingsPresent(): boolean {
        return WhiteBoard.get("sdtdpSettingsPresent") || false
    }

    public static setSdtdpSettingsPresent(value: boolean) {
        WhiteBoard.set("sdtdpSettingsPresent", value)
    }

    public static getSdtdpEnabled(): boolean {
        return WhiteBoard.get("sdtdpEnabled") || false
    }

    public static setSdtdpEnabled(value: boolean) {
        WhiteBoard.set("sdtdpEnabled", value)
    }

    public static getOnlyGui(): boolean {
        return WhiteBoard.get("onlyGui") || false
    }

    public static setOnlyGui(value: boolean) {
        WhiteBoard.set("onlyGui", value)
    }

    public static getPluginLatestVersion(): string {
        return WhiteBoard.get("pluginLatestVersion") || ""
    }

    public static setPluginLatestVersion(value: string) {
        WhiteBoard.set("pluginLatestVersion", value)
    }

    public static getBiosVersion(): string {
        return WhiteBoard.get("biosVersion") || ""
    }

    public static setBiosVersion(value: string) {
        WhiteBoard.set("biosVersion", value)
    }

    public static getBiosLatestVersion(): string {
        return WhiteBoard.get("biosLatestVersion") || ""
    }

    public static setBiosLatestVersion(value: string) {
        WhiteBoard.set("biosLatestVersion", value)
    }
}