
import { Game, Logger, Settings, Translator } from "decky-plugin-framework"
import { Constants } from '../utils/constants'
import { Mode } from "../utils/mode"
import { State } from "../utils/state"
import { debounce } from "lodash"
import { BackendUtils } from "../utils/backend"
import { Profile } from "../utils/models"

export class Profiles {
    public static getAppId(id: string): string {
        return id.substring(0, id.lastIndexOf("."))
    }

    public static getAppName(id: string): string {
        const appId = Profiles.getAppId(id);
        if (appId == Constants.DEFAULT_DEFAULT) {
            return Translator.translate("main.menu")
        } else {
            return Game.getGameDetails(Number(appId)).getDisplayName()
        }
    }

    public static getFullPowerProfile(): Profile {
        return {
            mode: Mode.TURBO,
            spl: Constants.AllyTurboFPPL,
            sppl: Constants.AllyTurboFPPL,
            fppl: Constants.AllyTurboFPPL,
            cpuBoost: true,
            smtEnabled: true
        }
    }

    private static debouncedApplyGameProfile = debounce((id: string) => {
        const profile: Profile = Profiles.getProfileForId(id)
        Logger.info("Applying CPU settings for profile " + id,
            profile
        )
        BackendUtils.setTdpProfile(profile)
    }, 500)

    public static applyGameProfile(id: string) {
        Profiles.debouncedApplyGameProfile(id)
    }

    public static getDefaultProfile(): Profile {
        return Profiles.getProfileForId(Constants.DEFAULT_ID)
    }

    public static getDefaultACProfile(): Profile {
        return Profiles.getProfileForId(Constants.DEFAULT_ID_AC)
    }

    public static existsProfileForId(id: string | number): boolean {
        return Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE) !== null
    }

    public static getProfileForId(inputId: string | number): Profile {
        const id = String(inputId)

        let mode: number
        let spl: number
        let sppl: number
        let fppl: number
        let cpuBoost: boolean
        let smtEnabled: boolean

        if (!Profiles.existsProfileForId(id)) {
            Logger.info("No profile found for " + id + ", creating")

            mode = id.endsWith(Constants.SUFIX_AC) ? Constants.TDP_AC_DEFAULT_MODE : Constants.TDP_DEFAULT_MODE
            const tdps = Profiles.getTdpForMode(mode)
            spl = tdps[0]
            sppl = tdps[1]
            fppl = tdps[2]
            cpuBoost = Constants.CPU_DEFAULT_BOOST
            smtEnabled = Constants.CPU_DEFAULT_SMT

            Profiles.saveProfileForId(id, mode, spl, sppl, fppl, cpuBoost, smtEnabled)
        } else {
            mode = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE))
            spl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL))
            sppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL))
            fppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL))
            cpuBoost = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST) == "true"
            smtEnabled = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT) == "true"
        }

        return {
            mode, spl, sppl, fppl, cpuBoost, smtEnabled
        }
    }

    public static getTdpForMode(mode: number) {
        let spl = 0
        let sppl = 0
        let fppl = 0

        switch (mode) {
            case Mode.SILENT:
                spl = State.IS_ALLY_X ? Constants.AllyXSilentSPL : Constants.AllySilentSPL
                sppl = Constants.AllySilentSPPL
                fppl = Constants.AllySilentFPPL
                break;
            case Mode.PERFORMANCE:
            case Mode.CUSTOM:
                spl = State.IS_ALLY_X ? Constants.AllyXPerformanceSPL : Constants.AllyPerformanceSPL
                sppl = Constants.AllyPerformanceSPPL
                fppl = Constants.AllyPerformanceFPPL
                break;
            case Mode.TURBO:
                spl = State.IS_ALLY_X ? Constants.AllyXTurboSPL : Constants.AllyTurboSPL
                sppl = Constants.AllyTurboSPPL
                fppl = Constants.AllyTurboFPPL
        }

        return ([spl, sppl, fppl])
    }

    public static saveProfileForId(id: string, mode: Number, spl: Number, sppl: Number, fppl: Number, cpuBoost: Boolean, smtEnabled: Boolean) {
        Settings.setEntry(Constants.PREFIX_PROFILES + Profiles.getAppId(id) + Constants.SUFIX_NAME, Profiles.getAppName(id), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(mode), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(spl), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(sppl), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(fppl), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(cpuBoost), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(smtEnabled), true)
    }

    public static async importFromSDTDP() {
        const cfg = await BackendUtils.getSdtdpCfg()
        if (cfg && cfg.tdpProfiles) {
            Object.keys(cfg.tdpProfiles).forEach((srcId) => {
                const id = srcId.replace("-ac-power", "")
                const ac = srcId.includes("-ac-power")
                const tdp = cfg.tdpProfiles[id].tdp
                const smt = cfg.tdpProfiles[id].smt
                const cpuBoost = cfg.tdpProfiles[id].cpuBoost

                const localId = id + (ac ? Constants.SUFIX_AC : Constants.SUFIX_BAT)
                if (!Profiles.existsProfileForId(localId)) {
                    Logger.info("Importing profile " + srcId + " as " + localId)
                    Profiles.saveProfileForId(localId, Mode.CUSTOM, tdp, tdp, tdp, cpuBoost, smt)
                } else {
                    Logger.info("Profile " + srcId + " already exists as " + localId)
                }
            })
        }
    }
}