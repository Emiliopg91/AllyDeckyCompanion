import { Backend, Logger } from "decky-plugin-framework"
import { Constants } from "./constants";
import { Profile, SdtdpSettings } from "./models";
import { WhiteBoardUtils } from "./whiteboard";

/**
 * The Backend class provides access to plugin Python backend methods
 */
export class BackendUtils {

    /**
     * Private constructor to prevent instantiation
     */
    private constructor() {
    }

    /**
     * Method to get the plugin log
     * @returns A Promise of the log as a string
     */
    public static async getPluginLog(): Promise<string> {
        return Backend.backend_call<[], string>("get_plugin_log");
    }

    /**
     * Method to get the plugin log
     * @returns A Promise of the log as a string
     */
    public static async getPluginName(): Promise<string> {
        return Backend.backend_call<[], string>("get_plugin_name");
    }

    public static async isAllyX(): Promise<boolean> {
        return Backend.backend_call<[], boolean>("is_ally_x");
    }

    public static async isAlly(): Promise<boolean> {
        return Backend.backend_call<[], boolean>("is_ally");
    }

    public static async setPerformanceProfile(profile: Profile): Promise<void> {
        if (WhiteBoardUtils.getIsAllyX()) {
            let epp = 'performance'
            if (profile.cpu.tdp.spl <= Constants.AllySilentSPL) {
                epp = 'quiet'
            } else if (profile.cpu.tdp.spl <= Constants.AllyPerformanceSPL) {
                epp = 'balanced'
            }

            Logger.info("Setting performance profile to '" + epp + "':", profile)

            Backend.backend_call<[prof: String], number>("set_platform_profile", epp).then(() => {
                Backend.backend_call<[spl: number, sppl: number, fppl: number], number>("set_tdp", profile.cpu.tdp.spl, profile.cpu.tdp.sppl, profile.cpu.tdp.fppl).then(() => {
                    Backend.backend_call<[enabled: Boolean], number>("set_smt", profile.cpu.smt).then(() => {
                        Backend.backend_call<[enabled: Boolean], number>("set_cpu_boost", profile.cpu.boost).then(() => {
                            Logger.info("Performance profile setted")
                        })
                    })
                })
            })
        }
    }

    public static async setBatteryLimit(limit: number): Promise<void> {
        if (WhiteBoardUtils.getIsAllyX()) {
            Logger.info("Setting battery limit to " + limit + "%")
            Backend.backend_call<[limit: number], number>("set_charge_limit", limit);
        }
    }

    public static async otaUpdate(): Promise<void> {
        Logger.info("Download and installation of version " + WhiteBoardUtils.getPluginLatestVersion() + " in progress")
        Backend.backend_call<[], boolean>("ota_update").then(() => {
            SteamClient.System.RestartPC()
        })
    }

    public static async isSdtdpEnabled(): Promise<boolean> {
        return Backend.backend_call<[], boolean>("is_sdtdp_enabled");
    }

    public static async isSdtdpPresent(): Promise<boolean> {
        return Backend.backend_call<[], boolean>("is_sdtdp_cfg_present");
    }

    public static async getSdtdpCfg(): Promise<SdtdpSettings> {
        return Backend.backend_call<[], SdtdpSettings>("get_sdtdp_cfg");
    }

    public static async disableSDTDP(): Promise<void> {
        Backend.backend_call<[], boolean>("disable_sdtdp").then(() => {
            SteamClient.System.RestartPC()
        })
    }

    public static async getBiosVersion(): Promise<string> {
        return Backend.backend_call<[], string>("bios_version")
    }

    public static async getGpuFrequencyRange(): Promise<[number,number]> {
        return Backend.backend_call<[], [number,number]>("get_gpu_frequency_range")
    }
}