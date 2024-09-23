import { Settings } from "decky-plugin-framework";
import { Constants } from "../utils/constants";
import { BackendUtils } from "../utils/backend";
import { WhiteBoardUtils } from "../utils/whiteboard";

export class SystemSettings {
  public static getLimitBattery(): number {
    return Number(
      Settings.getEntry(
        Constants.BATTERY_LIMIT,
        String(Constants.DEFAULT_BATTERY_LIMIT),
      ),
    );
  }

  public static setLimitBattery(limit: number): void {
    Settings.setEntry(Constants.BATTERY_LIMIT, String(limit), true);
    BackendUtils.setBatteryLimit(limit);
  }
  public static getProfilePerGame(): boolean {
    return Settings.getEntry(Constants.PROFILE_PER_GAME) == "true";
  }

  public static setProfilePerGame(enabled: boolean): void {
    Settings.setEntry(Constants.PROFILE_PER_GAME, String(enabled), true);
    WhiteBoardUtils.setProfilePerGame(enabled);
  }
}
