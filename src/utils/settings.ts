import { Settings } from 'decky-plugin-framework';

import { Configuration, GameEntry, Profile } from './models';
import { WhiteBoardUtils } from './whiteboard';

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
    const appId = id.split('.')[0];
    const pwr = id.split('.')[1] as keyof GameEntry;

    if (!PluginSettings.settings.profiles) {
      PluginSettings.createParents(PluginSettings.settings, 'profiles');
    }

    if (!PluginSettings.settings.profiles[appId] || !PluginSettings.settings.profiles[appId][pwr]) {
      return undefined;
    } else {
      const profile = PluginSettings.settings.profiles[appId][pwr] as Profile;
      if (!profile.display) {
        PluginSettings.createParents(profile, 'display');
      }
      if (profile.display.brightness == undefined) {
        profile.display.brightness = WhiteBoardUtils.getBrightness();
      }
      if (!profile.audio || !profile.audio.devices) {
        PluginSettings.createParents(profile, 'audio.devices');
      }
      if (profile.audio.devices == undefined || Object.keys(profile.audio.devices).length == 0) {
        profile.audio.devices = {};
      }
      if (!profile.audio.devices[WhiteBoardUtils.getAudioDevice()]) {
        profile.audio.devices[WhiteBoardUtils.getAudioDevice()] = {
          volume: WhiteBoardUtils.getVolume()
        };
      }

      return JSON.parse(JSON.stringify(profile));
    }
  }

  public static setProfileForId(id: string, name: string, profile: Profile): void {
    const appId = id.split('.')[0];
    const pwr = id.split('.')[1] as keyof GameEntry;

    if (!PluginSettings.settings.profiles) {
      PluginSettings.createParents(PluginSettings.settings, 'profiles');
    }

    if (!PluginSettings.settings.profiles[appId]) {
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + appId);
    }

    if (!PluginSettings.settings.profiles[appId][pwr]) {
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + id);
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + id + '.cpu.tdp');
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + id + '.gpu.frequency');
      PluginSettings.createParents(
        PluginSettings.settings,
        'profiles.' + id + '.display.brightness'
      );
      PluginSettings.createParents(PluginSettings.settings, 'profiles.' + id + '.audio.devices');
    }

    const gameEntry = PluginSettings.settings.profiles[appId];
    const prof = gameEntry[pwr as keyof GameEntry] as Profile;

    gameEntry.name = name;
    prof.mode = profile.mode;
    prof.cpu.boost = profile.cpu.boost;
    prof.cpu.epp = profile.cpu.epp;
    prof.cpu.governor = profile.cpu.governor;
    prof.cpu.smt = profile.cpu.smt;
    prof.cpu.tdp.spl = profile.cpu.tdp.spl;
    prof.cpu.tdp.sppl = profile.cpu.tdp.sppl;
    prof.cpu.tdp.fppl = profile.cpu.tdp.fppl;
    prof.gpu.frequency.min = profile.gpu.frequency.min;
    prof.gpu.frequency.max = profile.gpu.frequency.max;
    prof.display.brightness = profile.display.brightness;
    prof.audio.devices = profile.audio.devices;
  }
}
