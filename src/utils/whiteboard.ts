import { Router } from '@decky/ui';
import { WhiteBoard } from 'decky-plugin-framework';

import { Constants } from './constants';

export class WhiteBoardUtils {
  public static getScheduler(): string {
    return WhiteBoard.get('scheduler')!;
  }

  public static setScheduler(scheds: string): void {
    WhiteBoard.set('scheduler', scheds);
  }

  public static getSchedulers(): Array<string> {
    return WhiteBoard.get('schedulers')!;
  }

  public static setSchedulers(scheds: Array<string>): void {
    WhiteBoard.set('schedulers', scheds);
  }

  public static getOnBattery(): boolean | null {
    return WhiteBoard.get('onBattery');
  }

  public static setOnBattery(value: boolean): void {
    WhiteBoard.set('onBattery', value);
  }

  public static getRunningGameId(): string {
    return (
      WhiteBoard.get<string>('runningGameId') ||
      (Router.MainRunningApp
        ? String(Router.MainRunningApp.appid) + WhiteBoardUtils.getOnBattery()
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

  public static getIsXboxAlly(): boolean {
    return WhiteBoard.get('isXboxAlly') || false;
  }

  public static setisXboxAlly(value: boolean): void {
    WhiteBoard.set('isXboxAlly', value);
  }

  public static getIsXboxAllyX(): boolean {
    return WhiteBoard.get('isXboxAllyX') || false;
  }

  public static setisXboxAllyX(value: boolean): void {
    WhiteBoard.set('isXboxAllyX', value);
  }

  public static getTab(): string {
    return WhiteBoard.get('tab') || 'performance';
  }

  public static setTab(value: string): void {
    WhiteBoard.set('tab', value);
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

  public static getTdpRange(): Record<string, number[]> {
    return WhiteBoard.get('tdpRange') as Record<string, number[]>;
  }

  public static setTdpRange(value: Record<string, number[]>): void {
    WhiteBoard.set('tdpRange', value);
  }
  /*
  public static getSplMin(): number {
    return Number(WhiteBoardUtils.getTdpRange()['spl'][0] || 7);
  }

  public static getSplMax(): number {
    return Number(WhiteBoardUtils.getTdpRange()['spl'][1] || 25);
  }

  public static getSpptMin(): number {
    return Number(WhiteBoardUtils.getTdpRange()['sppt'][0] || 15);
  }

  public static getSpptMax(): number {
    return Number(WhiteBoardUtils.getTdpRange()['sppt'][1] || 30);
  }

  public static getFpptMin(): number {
    return Number(WhiteBoardUtils.getTdpRange()['fppt'][0] || 15);
  }

  public static getFpptMax(): number {
    return Number(WhiteBoardUtils.getTdpRange()['fppt'][1] || 35);
  }
*/
  public static setGpuMaxFreq(value: number): void {
    WhiteBoard.set('gpuMaxFreq', value);
  }

  public static getPrevBrightness(): number | undefined {
    const val = WhiteBoard.get<number>('prevBrightness');
    if (val == undefined || val == null) {
      return WhiteBoardUtils.getBrightness();
    }
    return val;
  }

  public static getBrightness(): number | undefined {
    const val = WhiteBoard.get<number>('brightness');
    if (val == undefined || val == null) {
      return undefined;
    }
    return val;
  }

  public static setBrightness(value: number): void {
    WhiteBoard.set('prevBrightness', WhiteBoardUtils.getBrightness());
    WhiteBoard.set('brightness', value);
  }

  public static setVolume(value: number): void {
    WhiteBoard.set('volume', value);
  }

  public static getVolume(): number {
    return WhiteBoard.get<number>('volume')!;
  }

  public static setAudioDevice(value: number): void {
    WhiteBoard.set('audioDevice', value);
  }

  public static getAudioDevice(): string {
    return WhiteBoard.get<string>('audioDevice')!;
  }
}
