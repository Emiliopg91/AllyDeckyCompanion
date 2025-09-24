import pckage from '../../package.json';
import plugin from '../../plugin.json';
import { Mode } from './models';

export class Constants {
  public static PLUGIN_NAME = plugin.name;
  public static PLUGIN_VERSION = pckage.version;

  public static CFG_SCHEMA_VERS = Constants.PLUGIN_VERSION;
  public static CFG_SCHEMA_PROP = 'schema';

  public static SUFIX_AC = '.acpower';
  public static SUFIX_BAT = '.battery';

  public static DEFAULT_DEFAULT = 'default';
  public static DEFAULT_ID = Constants.DEFAULT_DEFAULT + Constants.SUFIX_BAT;
  public static DEFAULT_ID_AC = Constants.DEFAULT_DEFAULT + Constants.SUFIX_AC;

  public static TDP_DEFAULT_MODE = Mode.PERFORMANCE;
  public static TDP_AC_DEFAULT_MODE = Mode.TURBO;
  public static CPU_DEFAULT_SMT = true;
  public static CPU_DEFAULT_BOOST = false;
  public static DEFAULT_BATTERY_LIMIT = 100;

  public static PROFILE_SILENT = 'silent';
  public static PROFILE_PERFORMANCE = 'performance';
  public static PROFILE_TURBO = 'turbo';
  public static PROFILE_CUSTOM = 'custom';

  public static AllySilentSPL = 13;
  public static AllySilentSPPL = 15;
  public static AllySilentFPPL = 17;
  public static AllyPerformanceSPL = 17;
  public static AllyPerformanceSPPL = 20;
  public static AllyPerformanceFPPL = 25;
  public static AllyTurboSPL = 25;
  public static AllyTurboSPPL = 27;
  public static AllyTurboFPPL = 30;

  public static AllyXSilentSPL = 10;
  public static AllyXPerformanceSPL = 15;
  public static AllyXTurboSPL = 25;

  public static ALLY_BIOS_URL =
    'https://rog.asus.com/support/webapi/product/GetPDBIOS?website=global&model=rog-ally-2023&pdid=0&m1id=23629&cpu=RC71L&LevelTagId=220680&systemCode=rog';
  public static ALLY_X_BIOS_URL =
    'https://rog.asus.com/support/webapi/product/GetPDBIOS?website=global&model=rog-ally-x-2024&pdid=0&m1id=26436&cpu=RC72LA&LevelTagId=230371&systemCode=rog';
}
