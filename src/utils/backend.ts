import { Backend, Logger } from "decky-plugin-framework"
import { Constants } from "./constants";
import { debounce } from "lodash";
import { State } from "./state";
import { Profile, SdtdpSettings } from "./models";

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

    private static debouncedSetTdpProfile = debounce(async (profile: Profile) => {
        let epp = 'performance'
        if (profile.spl <= Constants.AllySilentSPL) {
            epp = 'quiet'
        } else if (profile.spl <= Constants.AllyPerformanceSPL) {
            epp = 'balanced'
        }

        Backend.backend_call<[ prof: String ], number>("set_platform_profile",  epp);
        Backend.backend_call<[ spl: number, sppl: number, fppl: number ], number>("set_tdp", profile.spl, profile.sppl, profile.fppl );
        Backend.backend_call<[ enabled: Boolean ], number>("set_smt", profile.smtEnabled );
        Backend.backend_call<[ enabled: Boolean ], number>("set_cpu_boost", profile.cpuBoost );
    }, 500)

    public static async setTdpProfile(profile: Profile): Promise<void> {
        if (State.IS_ALLY)
            BackendUtils.debouncedSetTdpProfile(profile)
    }

    public static async setBatteryLimit(limit: number): Promise<void> {
        if (State.IS_ALLY) {
            Logger.info("Setting battery limit to " + limit + "%")
            Backend.backend_call<[ limit: number ], number>("set_charge_limit", limit );
        }
    }

    public static async otaUpdate(): Promise<void> {
        Backend.backend_call<[], number>("ota_update");
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
        return Backend.backend_call<[], void>("disable_sdtdp")
    }
}