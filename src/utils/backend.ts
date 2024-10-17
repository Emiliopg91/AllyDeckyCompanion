import { sleep } from '@decky/ui';
import { Backend, Logger } from 'decky-plugin-framework';

import { Profiles } from '../settings/profiles';
import { AsyncUtils } from './async';
import { Acpi, Governor, Profile, SdtdpSettings } from './models';
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

  public static async applyProfile(profile: Profile): Promise<void> {
    if (WhiteBoardUtils.getIsAlly()) {
      sleep(50).then(() => {
        Logger.info(
          'Setting display brightness to: ' + Math.floor(profile.display.brightness! * 100) + '%'
        );
        WhiteBoardUtils.setBrightness(profile.display.brightness!);
        BackendUtils.fadeBrightness();

        const acpi = Acpi[Profiles.getAcpiProfile(profile.cpu.tdp.spl)].toLowerCase();
        Logger.info(
          'Setting ACPI Platform Profile to "' + acpi + '" and performance profile to:',
          profile
        );
        Backend.backend_call<[enabled: boolean], number>('set_smt', true).then(() => {
          Backend.backend_call<[prof: string], number>('set_platform_profile', acpi).then(() => {
            Backend.backend_call<[spl: number, sppl: number, fppl: number], number>(
              'set_tdp',
              profile.cpu.tdp.spl,
              profile.cpu.tdp.sppl,
              profile.cpu.tdp.fppl
            ).then(() => {
              Backend.backend_call<[enabled: boolean], number>(
                'set_cpu_boost',
                profile.cpu.boost
              ).then(() => {
                Backend.backend_call<[governor: string], void>(
                  'set_governor',
                  Governor[profile.cpu.governor].toLowerCase()
                ).then(() => {
                  Backend.backend_call<[enabled: boolean], number>('set_smt', profile.cpu.smt).then(
                    () => {
                      Backend.backend_call<[min: number, max: number], void>(
                        'set_gpu_frequency_range',
                        profile.gpu.frequency.min,
                        profile.gpu.frequency.max
                      ).then(() => {
                        Logger.info('Performance profile setted');
                      });
                    }
                  );
                });
              });
            });
          });
        });
      });
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
