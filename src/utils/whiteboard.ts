import { Router } from '@decky/ui';
import { WhiteBoard } from 'decky-plugin-framework';

import { Constants } from './constants';

export class WhiteBoardUtils {
  public static getOnBattery(): boolean {
    return WhiteBoard.get('onBattery') || false;
  }

  public static setOnBattery(value: boolean): void {
    WhiteBoard.set('onBattery', value);
  }

  public static getRunningGameId(): string {
    return (
      WhiteBoard.get<string>('runningGameId') ||
      (Router.MainRunningApp
        ? Router.MainRunningApp.appid + WhiteBoardUtils.getOnBattery()
          ? Constants.SUFIX_BAT
          : Constants.SUFIX_AC
        : WhiteBoardUtils.getOnBattery()
          ? Constants.DEFAULT_ID
          : Constants.DEFAULT_ID_AC)
    );
  }

  public static setRunningGameId(value: string): void {
    WhiteBoard.set('runningGameId', value);
  }

  public static getIsAlly(): boolean {
    return WhiteBoard.get('isAlly') || false;
  }

  public static setIsAlly(value: boolean): void {
    WhiteBoard.set('isAlly', value);
  }

  public static getIsAllyX(): boolean {
    return WhiteBoard.get('isAllyX') || false;
  }

  public static setisAllyX(value: boolean): void {
    WhiteBoard.set('isAllyX', value);
  }

  public static getTab(): string {
    return WhiteBoard.get('tab') || 'performance';
  }

  public static setTab(value: string): void {
    WhiteBoard.set('tab', value);
  }

  public static getProfilePerGame(): boolean {
    return WhiteBoard.get('profilePerGame') || false;
  }

  public static setProfilePerGame(value: boolean): void {
    WhiteBoard.set('profilePerGame', value);
  }

  public static getSdtdpSettingsPresent(): boolean {
    return WhiteBoard.get('sdtdpSettingsPresent') || false;
  }

  public static setSdtdpSettingsPresent(value: boolean): void {
    WhiteBoard.set('sdtdpSettingsPresent', value);
  }

  public static getSdtdpEnabled(): boolean {
    return WhiteBoard.get('sdtdpEnabled') || false;
  }

  public static setSdtdpEnabled(value: boolean): void {
    WhiteBoard.set('sdtdpEnabled', value);
  }

  public static getOnlyGui(): boolean {
    return WhiteBoard.get('onlyGui') || false;
  }

  public static setOnlyGui(value: boolean): void {
    WhiteBoard.set('onlyGui', value);
  }

  public static getPluginLatestVersion(): string {
    return WhiteBoard.get('pluginLatestVersion') || '';
  }

  public static setPluginLatestVersion(value: string): void {
    WhiteBoard.set('pluginLatestVersion', value);
  }

  public static getBiosVersion(): string {
    return WhiteBoard.get('biosVersion') || '';
  }

  public static setBiosVersion(value: string): void {
    WhiteBoard.set('biosVersion', value);
  }

  public static getBiosLatestVersion(): string {
    return WhiteBoard.get('biosLatestVersion') || '';
  }

  public static setBiosLatestVersion(value: string): void {
    WhiteBoard.set('biosLatestVersion', value);
  }

  public static getGpuMinFreq(): number {
    return Number(WhiteBoard.get('gpuMinFreq') || 800);
  }

  public static setGpuMinFreq(value: number): void {
    WhiteBoard.set('gpuMinFreq', value);
  }

  public static getGpuMaxFreq(): number {
    return Number(WhiteBoard.get('gpuMaxFreq') || 2700);
  }

  public static setGpuMaxFreq(value: number): void {
    WhiteBoard.set('gpuMaxFreq', value);
  }
}
