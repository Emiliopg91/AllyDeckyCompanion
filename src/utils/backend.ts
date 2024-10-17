import { sleep } from '@decky/ui';
import { Backend, Logger } from 'decky-plugin-framework';

import { Profiles } from '../settings/profiles';
import { AsyncUtils } from './async';
import { Acpi, AudioDevice, Governor, Profile, SdtdpSettings } from './models';
import { WhiteBoardUtils } from './whiteboard';

/**
 * The Backend class provides access to plugin Python backend methods
 */
export class BackendUtils {
  /**
   * Private constructor to prevent instantiation
   */
  private constructor() {}

  /**
   * Method to get the plugin log
   * @returns A Promise of the log as a string
   */
  public static async getPluginLog(): Promise<string> {
    return Backend.backend_call<[], string>('get_plugin_log');
  }

  /**
   * Method to get the plugin log
   * @returns A Promise of the log as a string
   */
  public static async getPluginName(): Promise<string> {
    return Backend.backend_call<[], string>('get_plugin_name');
  }

  private static async fadeBrightness(): Promise<void> {
    AsyncUtils.runMutexForDisplay(async (releaseDisplay) => {
      const target = WhiteBoardUtils.getBrightness()!;
      const source = WhiteBoardUtils.getPrevBrightness()!;
      if (target != source) {
        const timeLapse = 500;
        const ticks = 100;
        const nap = timeLapse / ticks;
        const diff = target - source;
        const inc = diff / ticks;

        for (let i = 0; i < ticks; i++) {
          SteamClient.System.Display.SetBrightness(source + (i + 1) * inc);
          await sleep(nap);
        }
      }
      releaseDisplay();
    });
  }

  private static currentProfile: Profile | undefined = undefined;

  public static async applyProfile(profileIn: Profile): Promise<void> {
    const profile = JSON.parse(JSON.stringify(profileIn)) as Profile;
    const newMap: Record<string, AudioDevice> = {};
    Object.keys(profile.audio.devices).forEach((k) => {
      if (k == WhiteBoardUtils.getAudioDevice()) {
        newMap[k] = profile.audio.devices[k];
      }
    });
    profile.audio.devices = newMap;

    let cpuChanged = true;
    let gpuChanged = true;
    let dspChanged = true;
    let audChanged = true;

    if (BackendUtils.currentProfile) {
      cpuChanged =
        JSON.stringify(BackendUtils.currentProfile.cpu) != JSON.stringify(profile.cpu) ||
        BackendUtils.currentProfile.mode != profile.mode;
      gpuChanged = JSON.stringify(BackendUtils.currentProfile.gpu) != JSON.stringify(profile.gpu);
      dspChanged =
        JSON.stringify(BackendUtils.currentProfile.display) != JSON.stringify(profile.display);
      audChanged =
        JSON.stringify(BackendUtils.currentProfile.audio) != JSON.stringify(profile.audio);
    }

    if (WhiteBoardUtils.getIsAlly()) {
      if (cpuChanged || gpuChanged || audChanged || dspChanged) {
        sleep(50).then(async () => {
          if (dspChanged) {
            Logger.info(
              'Setting display brightness to: ' +
                Math.floor(profile.display.brightness! * 100) +
                '%'
            );
            WhiteBoardUtils.setBrightness(profile.display.brightness!);
            BackendUtils.fadeBrightness();
          }

          if (audChanged) {
            Logger.info(
              'Setting audio volume for ' +
                WhiteBoardUtils.getAudioDevice() +
                ' to: ' +
                Math.floor(profile.audio.devices[WhiteBoardUtils.getAudioDevice()].volume! * 100) +
                '%'
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const devs = ((await SteamClient.System.Audio.GetDevices()).vecDevices as any[])
              .filter(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (dev: any) => (dev.sName = WhiteBoardUtils.getAudioDevice)
              )
              .map((item) => item.id);

            if (devs.length == 0) {
              Logger.error(
                "No matching audio device available for '" + WhiteBoardUtils.getAudioDevice + "'"
              );
            } else {
              WhiteBoardUtils.setVolume(
                profile.audio.devices[WhiteBoardUtils.getAudioDevice()].volume!
              );

              let ok = false;
              for (let i = 0; i < devs.length; i++) {
                const result = await SteamClient.System.Audio.SetDeviceVolume(
                  devs[i],
                  1,
                  profile.audio.devices[WhiteBoardUtils.getAudioDevice()].volume!
                );
                if (result.result == '1') {
                  ok = true;
                  break;
                }
              }

              if (!ok) {
                Logger.error(
                  "Error while setting volume for '" + WhiteBoardUtils.getAudioDevice() + "'"
                );
              }
            }
          }

          if (gpuChanged) {
            Logger.info('Setting GPU profile', profile.gpu);
            await Backend.backend_call<[min: number, max: number], void>(
              'set_gpu_frequency_range',
              profile.gpu.frequency.min,
              profile.gpu.frequency.max
            );
          }

          if (cpuChanged) {
            const acpi = Acpi[Profiles.getAcpiProfile(profile.cpu.tdp.spl)].toLowerCase();
            Logger.info('Setting CPU profile to "' + acpi + '" with:', {
              mode: profile.mode,
              cpu: profile.cpu
            });
            await Backend.backend_call<[enabled: boolean], number>('set_smt', true);
            await Backend.backend_call<[prof: string], number>('set_platform_profile', acpi);
            await Backend.backend_call<[spl: number, sppl: number, fppl: number], number>(
              'set_tdp',
              profile.cpu.tdp.spl,
              profile.cpu.tdp.sppl,
              profile.cpu.tdp.fppl
            );
            await Backend.backend_call<[enabled: boolean], number>(
              'set_cpu_boost',
              profile.cpu.boost
            );
            await Backend.backend_call<[governor: string], void>(
              'set_governor',
              Governor[profile.cpu.governor].toLowerCase()
            );
            await Backend.backend_call<[enabled: boolean], number>('set_smt', profile.cpu.smt);
          }
          Logger.info('Profile applied');
          BackendUtils.currentProfile = profile;
        });
      } else {
        Logger.info('No changes needed to be applied');
      }
    }
  }

  public static async setBatteryLimit(limit: number): Promise<void> {
    if (WhiteBoardUtils.getIsAlly()) {
      Logger.info('Setting battery limit to ' + limit + '%');
      Backend.backend_call<[limit: number], number>('set_charge_limit', limit);
    }
  }

  public static async otaUpdate(): Promise<void> {
    Logger.info(
      'Download and installation of version ' +
        WhiteBoardUtils.getPluginLatestVersion() +
        ' in progress'
    );
    Backend.backend_call<[], boolean>('ota_update').then(() => {
      SteamClient.System.RestartPC();
    });
  }

  public static async isSdtdpEnabled(): Promise<boolean> {
    return Backend.backend_call<[], boolean>('is_sdtdp_enabled');
  }

  public static async isSdtdpPresent(): Promise<boolean> {
    return Backend.backend_call<[], boolean>('is_sdtdp_cfg_present');
  }

  public static async getSdtdpCfg(): Promise<SdtdpSettings> {
    return Backend.backend_call<[], SdtdpSettings>('get_sdtdp_cfg');
  }

  public static async disableSDTDP(): Promise<void> {
    Backend.backend_call<[], boolean>('disable_sdtdp').then(() => {
      SteamClient.System.RestartPC();
    });
  }

  public static async getBiosVersion(): Promise<string> {
    return Backend.backend_call<[], string>('bios_version');
  }

  public static async getGpuFrequencyRange(): Promise<[number, number]> {
    return Backend.backend_call<[], [number, number]>('get_gpu_frequency_range');
  }

  public static async getIconForApp(appId: string): Promise<string | null> {
    return Backend.backend_call<[appId: string], string>('get_icon_for_app', appId);
  }

  public static setIconForApp(appId: string, img: string): Promise<string> {
    return Backend.backend_call<[appId: string, img: string], string>(
      'save_icon_for_app',
      appId,
      img
    );
  }
}
