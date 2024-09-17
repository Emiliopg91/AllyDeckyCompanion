import { Settings } from 'decky-plugin-framework'
import { Constants } from '../utils/constants'
import { BackendUtils } from '../utils/backend'
import { State } from '../utils/state'

export class SystemSettings {
    public static getLimitBattery() {
        return Number(Settings.getEntry(Constants.BATTERY_LIMIT, String(Constants.DEFAULT_BATTERY_LIMIT)))
    }

    public static setLimitBattery(limit: number) {
        Settings.setEntry(Constants.BATTERY_LIMIT, String(limit), true)
        BackendUtils.setBatteryLimit(limit)
    }
    public static getProfilePerGame() {
        return Settings.getEntry(Constants.PROFILE_PER_GAME) == "true"
    }

    public static setProfilePerGame(enabled: boolean) {
        Settings.setEntry(Constants.PROFILE_PER_GAME, String(enabled), true)
        State.PROFILE_PER_GAME = enabled
    }
}