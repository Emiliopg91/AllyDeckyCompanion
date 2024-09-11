import { Settings } from 'decky-plugin-framework'
import { Constants } from '../utils/constants'
import { BackendUtils } from '../utils/backend'

export class SystemSettings {
    public static getLimitBattery() {
        return Settings.getEntry(Constants.BATTERY_LIMIT, String(Constants.DEFAULT_BATTERY_LIMIT)) == "true"
    }

    public static setLimitBattery(limit: boolean) {
        Settings.setEntry(Constants.BATTERY_LIMIT, String(limit), true)
        BackendUtils.setBatteryLimit(limit)
    }
}