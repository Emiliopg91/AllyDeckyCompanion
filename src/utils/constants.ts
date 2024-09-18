import { Mode } from "./mode";
import plugin from "../../plugin.json"
import pckage from "../../package.json"

export class Constants {
    public static CFG_SCHEMA_VERS = 2;
    public static CFG_SCHEMA_PROP = "schema";

    public static PLUGIN_NAME = plugin.name;
    public static PLUGIN_VERSION = pckage.version;

    public static SUFIX_AC = ".acpower"
    public static SUFIX_BAT = ".battery"

    public static DEFAULT_DEFAULT = "default"
    public static DEFAULT_ID = Constants.DEFAULT_DEFAULT + Constants.SUFIX_BAT
    public static DEFAULT_ID_AC = Constants.DEFAULT_DEFAULT + Constants.SUFIX_AC

    public static TDP_DEFAULT_MODE = Mode.PERFORMANCE;
    public static TDP_AC_DEFAULT_MODE = Mode.TURBO;
    public static CPU_DEFAULT_SMT = true
    public static CPU_DEFAULT_BOOST = false
    public static DEFAULT_BATTERY_LIMIT = 100

    public static PREFIX_PROFILES = "profiles."
    public static SUFIX_NAME = ".name"
    public static SUFIX_SPL = ".cpu.tdp.spl"
    public static SUFIX_SPPL = ".cpu.tdp.sppl"
    public static SUFIX_FPPL = ".cpu.tdp.fppl"
    public static SUFIX_CPU_BOOST = ".cpu.boost"
    public static SUFIX_CPU_SMT = ".cpu.smt"
    public static SUFIX_MODE = ".mode"

    public static DEFAULT_MODE = Constants.PREFIX_PROFILES + Constants.DEFAULT_ID + Constants.SUFIX_MODE
    public static DEFAULT_SPL = Constants.PREFIX_PROFILES + Constants.DEFAULT_ID + Constants.SUFIX_SPL
    public static DEFAULT_SPPL = Constants.PREFIX_PROFILES + Constants.DEFAULT_ID + Constants.SUFIX_SPPL
    public static DEFAULT_FPPL = Constants.PREFIX_PROFILES + Constants.DEFAULT_ID + Constants.SUFIX_FPPL
    public static DEFAULT_CPU_BOOST = Constants.PREFIX_PROFILES + Constants.DEFAULT_ID + Constants.SUFIX_CPU_BOOST
    public static DEFAULT_CPU_SMT = Constants.PREFIX_PROFILES + Constants.DEFAULT_ID + Constants.SUFIX_CPU_SMT

    public static PREFIX_SETTINGS = "settings."
    public static BATTERY_LIMIT = Constants.PREFIX_SETTINGS + "limit_battery"
    public static PROFILE_PER_GAME = Constants.PREFIX_SETTINGS + "profile_per_game"

    public static PROFILE_SILENT = "silent"
    public static PROFILE_PERFORMANCE = "performance"
    public static PROFILE_TURBO = "turbo"
    public static PROFILE_CUSTOM = "custom"

    public static AllySilentSPL = 13
    public static AllySilentSPPL = 14
    public static AllySilentFPPL = 17
    public static AllyPerformanceSPL = 17
    public static AllyPerformanceSPPL = 20
    public static AllyPerformanceFPPL = 25
    public static AllyTurboSPL = 25
    public static AllyTurboSPPL = 27
    public static AllyTurboFPPL = 30

    public static AllyXSilentSPL = 10
    public static AllyXPerformanceSPL = 15
    public static AllyXTurboSPL = 25
}