import pckage from '../../package.json';
import plugin from '../../plugin.json';
import { Epp, Mode, TdpPresets } from './models';

export class Constants {
  public static PLUGIN_NAME = plugin.name;
  public static PLUGIN_VERSION = pckage.version;

  public static CFG_SCHEMA_VERS = Constants.PLUGIN_VERSION;
  public static CFG_SCHEMA_PROP = 'schema';

  public static STEAM_OS = 'SteamOS';

  public static PROFILE_SILENT = 'silent';
  public static PROFILE_PERFORMANCE = 'performance';
  public static PROFILE_TURBO = 'turbo';
  public static PROFILE_CUSTOM = 'custom';

  public static DEFAULT_MODE = Mode.PERFORMANCE;
  public static DEFAULT_AC_MODE = Mode.TURBO;
  public static DEFAULT_CPU_BOOST = false;
  public static DEFAULT_BATTERY_LIMIT = 100;
  public static DEFAULT_SMT = true;
  public static DEFAULT_EPP = Epp.BALANCE_POWER;

  public static AllyTdpPresets: TdpPresets = {
    [Mode.SILENT]: { spl: 13, sppl: 15, fppl: 17 },
    [Mode.PERFORMANCE]: { spl: 17, sppl: 20, fppl: 25 },
    [Mode.TURBO]: { spl: 25, sppl: 27, fppl: 30 },
    [Mode.CUSTOM]: { spl: 17, sppl: 20, fppl: 25 }
  };

  public static AllyXTdpPresets: TdpPresets = {
    [Mode.SILENT]: { spl: 10, sppl: 15, fppl: 17 },
    [Mode.PERFORMANCE]: { spl: 15, sppl: 20, fppl: 25 },
    [Mode.TURBO]: { spl: 25, sppl: 27, fppl: 30 },
    [Mode.CUSTOM]: { spl: 15, sppl: 20, fppl: 25 }
  };

  public static XboxAllyTdpPresets: TdpPresets = {
    [Mode.SILENT]: { spl: 6, sppl: 6, fppl: 6 },
    [Mode.PERFORMANCE]: { spl: 15, sppl: 15, fppl: 15 },
    [Mode.TURBO]: { spl: 25, sppl: 25, fppl: 25 },
    [Mode.CUSTOM]: { spl: 15, sppl: 15, fppl: 15 }
  };

  public static XboxAllyXTdpPresets: TdpPresets = {
    [Mode.SILENT]: { spl: 13, sppl: 15, fppl: 19 },
    [Mode.PERFORMANCE]: { spl: 17, sppl: 20, fppl: 25 },
    [Mode.TURBO]: { spl: 25, sppl: 27, fppl: 30 },
    [Mode.CUSTOM]: { spl: 17, sppl: 20, fppl: 25 }
  };

  public static ALLY_BIOS_URL =
    'https://rog.asus.com/support/webapi/product/GetPDBIOS?website=global&model=rog-ally-2023&pdid=0&m1id=23629&cpu=RC71L&LevelTagId=220680&systemCode=rog';
  public static ALLY_X_BIOS_URL =
    'https://rog.asus.com/support/webapi/product/GetPDBIOS?website=global&model=rog-ally-x-2024&pdid=0&m1id=26436&cpu=RC72LA&LevelTagId=230371&systemCode=rog';
  public static XBOX_ALLY_X_BIOS_URL =
    'https://rog.asus.com/support/webapi/ProductV2/GetPDBIOS?website=es&model=rog-xbox-ally-x-2025&pdid=0&m1id=32330&cpu=&LevelTagId=239839&systemCode=rog';
  public static XBOX_ALLY_BIOS_URL =
    'https://rog.asus.com/support/webapi/ProductV2/GetPDBIOS?website=es&model=rog-xbox-ally-2025&pdid=0&m1id=32331&cpu=&LevelTagId=239840&systemCode=rog';
}
