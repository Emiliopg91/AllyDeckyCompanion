
import { Game, Logger, Settings, Translator } from "decky-plugin-framework"
import { Constants } from '../utils/constants'
import { Mode } from "../utils/mode"
import { State } from "../utils/state"

export interface Profile {
    mode: number
    spl: number
    sppl: number
    fppl: number
    cpuBoost: boolean
    smtEnabled: boolean
}

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
        const persist = (id == Constants.DEFAULT_ID || id == Constants.DEFAULT_ID_AC)
        if (persist && !Profiles.existsProfileForId(id)) {
            Logger.info("No profile found for " + id + ", creating")

            if (!id.endsWith(Constants.SUFIX_AC)) {
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(Settings.getEntry(Constants.DEFAULT_MODE, String(Constants.TDP_DEFAULT_MODE))), true)

                const tdps = Profiles.getTdpForMode(Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE)))

                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(Settings.getEntry(Constants.DEFAULT_SPL, String(tdps[0]))), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(Settings.getEntry(Constants.DEFAULT_SPPL, String(tdps[1]))), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(Settings.getEntry(Constants.DEFAULT_FPPL, String(tdps[2]))), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(Settings.getEntry(Constants.DEFAULT_CPU_BOOST, String(Constants.CPU_DEFAULT_BOOST))), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(Settings.getEntry(Constants.DEFAULT_CPU_SMT, String(Constants.CPU_DEFAULT_SMT))), true)
            } else {
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(Mode.TURBO), true)

                const tdps = Profiles.getTdpForMode(Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE)))

                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(tdps[0]), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(tdps[1]), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(tdps[2]), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(false), true)
                Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(true), true)
            }

        }

        let mode: number
        let spl: number
        let sppl: number
        let fppl: number
        let cpuBoost: boolean
        let smtEnabled: boolean

        if (!id.endsWith(Constants.SUFIX_AC)) {
            mode = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(Settings.getEntry(Constants.DEFAULT_MODE))))
            spl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(Settings.getEntry(Constants.DEFAULT_SPL))))
            sppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(Settings.getEntry(Constants.DEFAULT_SPPL))))
            fppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(Settings.getEntry(Constants.DEFAULT_FPPL))))
            cpuBoost = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(Settings.getEntry(Constants.DEFAULT_CPU_BOOST))) == "true"
            smtEnabled = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(Settings.getEntry(Constants.DEFAULT_CPU_SMT))) == "true"

        } else {
            const turboProf = Profiles.getTdpForMode(Mode.TURBO)
            mode = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(Mode.TURBO)))
            spl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(turboProf[0])))
            sppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(turboProf[1])))
            fppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(turboProf[2])))
            cpuBoost = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(false)) == "true"
            smtEnabled = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(true)) == "true"
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
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(mode), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(spl), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(sppl), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(fppl), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(cpuBoost), true)
        Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(smtEnabled), true)
    }
}