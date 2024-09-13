
import { Logger, Settings } from "decky-plugin-framework"
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
        return Profiles.getProfileForId(Constants.DEFAULT_ID, true)
    }

    public static existsProfileForId(id: string | number): boolean {
        return Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE) !== null
    }

    public static getProfileForId(inputId: string | number, persist = false): Profile {
        const id = String(inputId)
        if (persist && !Profiles.existsProfileForId(id)) {
            Logger.info("No profile found for " + id + ", creating")

            Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(Settings.getEntry(Constants.DEFAULT_MODE, String(Constants.TDP_DEFAULT_MODE))), true)

            const tdps = this.getTdpForMode(Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE)))

            Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(Settings.getEntry(Constants.DEFAULT_SPL, String(tdps[0]))), true)
            Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(Settings.getEntry(Constants.DEFAULT_SPPL, String(tdps[1]))), true)
            Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(Settings.getEntry(Constants.DEFAULT_FPPL, String(tdps[2]))), true)
            Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(Settings.getEntry(Constants.DEFAULT_CPU_BOOST, String(Constants.CPU_DEFAULT_BOOST))), true)
            Settings.setEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(Settings.getEntry(Constants.DEFAULT_CPU_SMT, String(Constants.CPU_DEFAULT_SMT))), true)
        }

        const mode = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_MODE, String(Settings.getEntry(Constants.DEFAULT_MODE))))
        const spl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPL, String(Settings.getEntry(Constants.DEFAULT_SPL))))
        const sppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_SPPL, String(Settings.getEntry(Constants.DEFAULT_SPPL))))
        const fppl = Number(Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_FPPL, String(Settings.getEntry(Constants.DEFAULT_FPPL))))
        const cpuBoost = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_BOOST, String(Settings.getEntry(Constants.DEFAULT_CPU_BOOST))) == "true"
        const smtEnabled = Settings.getEntry(Constants.PREFIX_PROFILES + id + Constants.SUFIX_CPU_SMT, String(Settings.getEntry(Constants.DEFAULT_CPU_SMT))) == "true"

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