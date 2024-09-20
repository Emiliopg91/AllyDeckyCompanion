
import { Game, Logger, Settings, Translator } from "decky-plugin-framework"
import { Constants } from '../utils/constants'
import { Mode } from "../utils/mode"
import { State } from "../utils/state"
import { debounce } from "lodash"
import { BackendUtils } from "../utils/backend"
import { Profile } from "../utils/models"
import { SpreadSheet, SpreadSheetCell } from "../utils/spreadsheet"

export class Profiles {

    public static summary() {

        const profiles = Settings.getConfigurationStructured()["profiles"]

        let profCount = 0;
        let sortedAppIds: Array<{ appId: string, name: string }> = []
        Object.keys(profiles).forEach((appId) => {
            sortedAppIds.push({ appId, name: profiles[appId].name })
            Object.keys(profiles[appId]).forEach((pwr) => {
                if (pwr != "name") {
                    profCount++
                }
            })
        })
        sortedAppIds = sortedAppIds.sort((n1, n2) => {
            if (n1.appId == "default") {
                return -1
            } else if (n2.appId == "default") {
                return 1
            } else if (n1.name > n2.name) {
                return 1;
            } else if (n1.name < n2.name) {
                return -1;
            } else
                return 0;
        });

        Logger.info("")
        Logger.info("Loaded profiles " + profCount + " for " + Object.keys(profiles).length + " games: ")

        const headers: Array<SpreadSheetCell> = []
        headers.push({ data: "NAME", align: "center" })
        headers.push({ data: "APPID", align: "center" })
        headers.push({ data: "POWER", align: "center" })
        headers.push({ data: "MODE", align: "center" })
        headers.push({ data: "SPL*", align: "center" })
        headers.push({ data: "SPPL*", align: "center" })
        headers.push({ data: "FPPL*", align: "center" })
        headers.push({ data: "SMT*", align: "center" })
        headers.push({ data: "BOOST*", align: "center" })

        const body: Array<Array<SpreadSheetCell>> = []
        sortedAppIds.forEach((entry) => {
            let isFirst = true
            Object.keys(profiles[entry.appId]).forEach((pwr) => {
                if (pwr != "name") {
                    const profile = profiles[entry.appId][pwr]

                    let line: Array<SpreadSheetCell> = []
                    line.push({ data: (isFirst ? profiles[entry.appId].name : ""), align: "right", rowspan: !isFirst })
                    line.push({ data: (isFirst ? entry.appId : ""), align: "right", rowspan: !isFirst })
                    line.push({ data: pwr.toUpperCase(), align: "right" })
                    line.push({ data: Mode[Number(profile.mode)], align: "right" })
                    line.push({ data: profile.cpu.tdp.spl, align: "right" })
                    line.push({ data: profile.cpu.tdp.sppl, align: "right" })
                    line.push({ data: profile.cpu.tdp.fppl, align: "right" })
                    line.push({ data: profile.cpu.smt, align: "right" })
                    line.push({ data: profile.cpu.boost, align: "right" })

                    body.push(line)

                    isFirst = false
                }
            })
        })

        SpreadSheet.printSpreadSheet(headers, body)
        Logger.info("")
        Logger.info("* Only is used on CUSTOM mode")
        Logger.info("")
    }

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
            cpuBoost: false,
            smtEnabled: true
        }
    }

    private static debouncedApplyGameProfile = debounce((id: string) => {
        const profile: Profile = Profiles.getProfileForId(id)
        if (profile.mode != Mode.CUSTOM) {
            const tdpProfile = Profiles.getProfileForMode(profile.mode)
            profile.spl = tdpProfile.spl
            profile.sppl = tdpProfile.sppl
            profile.fppl = tdpProfile.fppl
            profile.cpuBoost = tdpProfile.cpuBoost
            profile.smtEnabled = tdpProfile.smtEnabled
        }
        Logger.info("Applying profile " + id)
        BackendUtils.setTdpProfile(profile)
    }, 250)

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
            const tmpProf = Profiles.getProfileForMode(mode)
            spl = tmpProf.spl
            sppl = tmpProf.sppl
            fppl = tmpProf.fppl
            cpuBoost = tmpProf.cpuBoost
            smtEnabled = tmpProf.smtEnabled

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

    public static getProfileForMode(mode: Mode) {
        let spl = 0
        let sppl = 0
        let fppl = 0
        let cpuBoost = Constants.CPU_DEFAULT_BOOST
        let smtEnabled = Constants.CPU_DEFAULT_SMT

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

        return ({ mode, spl, sppl, fppl, cpuBoost, smtEnabled } as Profile)
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
                const smt = cfg.tdpProfiles[id].smt
                const cpuBoost = cfg.tdpProfiles[id].cpuBoost
                let tdp = cfg.tdpProfiles[id].tdp
                if (tdp < 5) {
                    tdp = 5
                } else if (tdp > Constants.AllyTurboFPPL) {
                    tdp = Constants.AllyTurboFPPL
                }


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