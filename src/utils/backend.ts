import { sleep } from '@decky/ui';
import { Backend, Logger } from 'decky-plugin-framework';

import { Profiles } from '../settings/profiles';
import { Acpi, CpuImpl, Epp, Profile } from './models';
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

  private static currentProfile: Profile | undefined = undefined;

  public static async applyProfile(profileIn: Profile): Promise<void> {
    const profile = JSON.parse(JSON.stringify(profileIn)) as Profile;

    let cpuChanged = true;
    let cpuTdpChanged = true;
    let cpuBoostChanged = true;
    let cpuCoresChanged = true;
    let cpuSchedChanged = true;
    let cpuEppChanged = true;

    let gpuChanged = true;

    const oldProfile = BackendUtils.currentProfile;
    if (oldProfile) {
      cpuTdpChanged = JSON.stringify(oldProfile.cpu.tdp) != JSON.stringify(profile.cpu.tdp);
      cpuEppChanged = oldProfile.cpu.epp != profile.cpu.epp;
      cpuBoostChanged = oldProfile.cpu.boost != profile.cpu.boost;
      cpuSchedChanged = oldProfile.cpu.scheduler != profile.cpu.scheduler;
      cpuCoresChanged =
        oldProfile.cpu.ecores != profile.cpu.ecores ||
        oldProfile.cpu.pcores != profile.cpu.pcores ||
        oldProfile.cpu.smt != profile.cpu.smt;

      cpuChanged =
        cpuTdpChanged || cpuEppChanged || cpuBoostChanged || cpuCoresChanged || cpuSchedChanged;

      gpuChanged = JSON.stringify(oldProfile.gpu) != JSON.stringify(profile.gpu);
    }

    if (cpuChanged || gpuChanged) {
      sleep(50).then(async () => {
        if (gpuChanged) {
          Logger.info('Setting GPU profile', profile.gpu);
          await Backend.backend_call<[number, number], void>(
            'set_gpu_frequency_range',
            profile.gpu.frequency.min,
            profile.gpu.frequency.max
          );
        }

        if (cpuChanged) {
          const acpi = Acpi[Profiles.getAcpiProfile(profile.cpu.tdp.spl)]
            .toLowerCase()
            .replace('_', '-');
          Logger.info('Setting CPU profile to "' + acpi + '" with:', {
            mode: profile.mode,
            cpu: profile.cpu
          });

          await Backend.backend_call<[number, number, boolean], void>(
            'enable_cores',
            WhiteBoardUtils.getPCores(),
            WhiteBoardUtils.getECores(),
            true
          );

          if (cpuBoostChanged) {
            await Backend.backend_call<[boolean], number>('set_cpu_boost', profile.cpu.boost);
          }

          if (cpuEppChanged) {
            await Backend.backend_call<[string], void>(
              'set_epp',
              Epp[profile.cpu.epp].toLowerCase()
            );
          }

          await Backend.backend_call<[string], number>('set_platform_profile', acpi);

          if (cpuTdpChanged) {
            await Backend.backend_call<[number, number, number], number>(
              'set_tdp',
              profile.cpu.tdp.spl,
              profile.cpu.tdp.sppl,
              profile.cpu.tdp.fppl
            );
          }

          await Backend.backend_call<[number, number, boolean], void>(
            'enable_cores',
            profile.cpu.pcores,
            profile.cpu.ecores,
            profile.cpu.smt
          );

          if (cpuSchedChanged) {
            if (profile.cpu.scheduler != undefined && profile.cpu.scheduler != '') {
              await Backend.backend_call<[string], void>('set_scheduler', profile.cpu.scheduler);
            } else {
              await Backend.backend_call<[], void>('stop_scheduler');
            }
          }
        }
        Logger.info('Profile applied');
        BackendUtils.currentProfile = profile;
      });
    } else {
      Logger.info('No changes needed to be applied');
    }
  }

  public static async renice(pid: number): Promise<void> {
    Logger.info('Renicing process ' + pid + ' and its children');
    return await Backend.backend_call<[number], void>('renice', pid);
  }

  public static async getCpuImpl(): Promise<CpuImpl> {
    return (await Backend.backend_call<[], number>('get_cpu_impl')) as CpuImpl;
  }

  public static async setBatteryLimit(limit: number): Promise<void> {
    Logger.info('Setting battery limit to ' + limit + '%');
    Backend.backend_call<[number], number>('set_charge_limit', limit);
  }

  public static async setMcuPowersave(enabled: boolean): Promise<void> {
    Logger.info('Setting MCU powersave to ' + enabled);
    Backend.backend_call<[boolean], number>('set_mcu_powersave', enabled);
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

  public static async getBiosVersion(): Promise<string> {
    return Backend.backend_call<[], string>('bios_version');
  }

  public static async getGpuFrequencyRange(): Promise<[number, number]> {
    return Backend.backend_call<[], [number, number]>('get_gpu_frequency_range');
  }

  public static async getCpuTdpRange(): Promise<Record<string, number[]>> {
    return Backend.backend_call<[], Record<string, number[]>>('get_tdp_ranges');
  }

  public static async getIconForApp(appId: string): Promise<string | null> {
    return Backend.backend_call<[string], string>('get_icon_for_app', appId);
  }

  public static setIconForApp(appId: string, img: string): Promise<string> {
    return Backend.backend_call<[string, string], string>('save_icon_for_app', appId, img);
  }

  public static bootBios(): Promise<null> {
    return Backend.backend_call<[], null>('boot_bios');
  }

  public static bootWindows(): Promise<null> {
    return Backend.backend_call<[], null>('boot_windows');
  }

  public static isWindowsPresent(): Promise<boolean> {
    return Backend.backend_call<[], boolean>('windows_present');
  }

  public static getCoresCount(): Promise<[number, number]> {
    return Backend.backend_call<[], [number, number]>('get_cores_count');
  }

  public static isAcOnline(): Promise<boolean> {
    return Backend.backend_call<[], boolean>('is_ac_connected');
  }

  public static async getSchedulers(): Promise<Array<string>> {
    return Backend.backend_call<[], Array<string>>('get_schedulers');
  }

  public static async getDefaultSchedulerName(): Promise<string> {
    return Backend.backend_call<[], string>('get_default_sched_name');
  }
}
