import { Settings } from 'decky-plugin-framework';

import { Configuration, Profile } from './models';

export class PluginSettings {
  public static settings: Configuration;

  public static initialize(): void {
    PluginSettings.settings = Settings.getProxiedSettings(Settings.getConfigurationStructured());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static createParents(obj: Record<string, any>, path: string): void {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
  }

  public static getProfilePerGame(): boolean | undefined {
    return PluginSettings.settings.settings?.profile_per_game;
  }

  public static setProfilePerGame(value: boolean): void {
    if (!PluginSettings.settings.settings) {
      PluginSettings.createParents(PluginSettings.settings, 'settings');
    }
    PluginSettings.settings.settings!.profile_per_game = value;
  }

  public static getBatteryLimit(): number | undefined {
    return PluginSettings.settings.settings?.limit_battery ?? 100;
  }

  public static setBatteryLimit(value: number): void {
    if (!PluginSettings.settings.settings) {
      PluginSettings.createParents(PluginSettings.settings, 'settings');
    }
    PluginSettings.settings.settings!.limit_battery = value;
  }

  public static setMcuPowersave(value: boolean): void {
    if (!PluginSettings.settings.settings) {
      PluginSettings.createParents(PluginSettings.settings, 'settings');
    }
    PluginSettings.settings.settings!.mcu_powersave = value;
  }

  public static getMcuPowersave(): boolean {
    return PluginSettings.settings.settings?.mcu_powersave || false;
  }

  public static getSchemaVersion(): string | undefined {
    return PluginSettings.settings.schema;
  }

  public static setSchemaVersion(value: string): void {
    PluginSettings.settings.schema = value;
  }

  public static existsProfile(id: string): boolean {
    return PluginSettings.getProfileForId(id) != undefined;
  }

  public static getProfileForId(id: string): Profile | undefined {
    if (!PluginSettings.settings.profiles) {
      PluginSettings.createParents(PluginSettings.settings, 'profiles');
    }

    if (!PluginSettings.settings.profiles[id] || !PluginSettings.settings.profiles[id]) {
      return undefined;
    } else {
      return JSON.parse(JSON.stringify(PluginSettings.settings.profiles[id] as Profile));
    }
  }

  public static getAppIdForName(name: string): number | undefined {
    if (PluginSettings.settings.profiles[name].appId) {
      return PluginSettings.settings.profiles[name].appId;
    }

    return undefined;
  }

  public static setAppIdForName(name: string, appid: number) {
    PluginSettings.settings.profiles[name].appId = appid;
  }

  public static setProfileForId(id: string, profile: Profile): void {
    if (!PluginSettings.settings.profiles) {
      PluginSettings.createParents(PluginSettings.settings, 'profiles');
    }

    if (!PluginSettings.settings.profiles[id]) {
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + id);
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + id + '.cpu.tdp');
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + id + '.gpu.frequency');
    }

    const prof = PluginSettings.settings.profiles[id];
    prof.epp = profile.epp;
    prof.mode = profile.mode;
    prof.cpu.boost = profile.cpu.boost;
    prof.cpu.scheduler = profile.cpu.scheduler == '' ? undefined : profile.cpu.scheduler;
    prof.cpu.cores.smt = profile.cpu.cores.smt;
    prof.cpu.cores.eficiency = profile.cpu.cores.eficiency;
    prof.cpu.cores.performance = profile.cpu.cores.performance;
    prof.cpu.tdp.spl = profile.cpu.tdp.spl;
    prof.cpu.tdp.sppl = profile.cpu.tdp.sppl;
    prof.cpu.tdp.fppl = profile.cpu.tdp.fppl;
    prof.gpu.frequency.min = profile.gpu.frequency.min;
    prof.gpu.frequency.max = profile.gpu.frequency.max;
  }
}
