import { BackendUtils } from '../utils/backend';
import { PluginSettings } from '../utils/settings';

export class SystemSettings {
  public static getLimitBattery(): number {
    return PluginSettings.getBatteryLimit()!;
  }

  public static setLimitBattery(limit: number): void {
    PluginSettings.setBatteryLimit(limit);
    BackendUtils.setBatteryLimit(limit);
  }

  public static getMcuPowersave(): boolean {
    return PluginSettings.getMcuPowersave()!;
  }

  public static setMcuPowersave(enabled: boolean): void {
    PluginSettings.setMcuPowersave(enabled);
    BackendUtils.setMcuPowersave(enabled);
  }

  public static getProfilePerGame(): boolean {
    return PluginSettings.getProfilePerGame()!;
  }

  public static setProfilePerGame(enabled: boolean): void {
    PluginSettings.setProfilePerGame(enabled);
  }
}
