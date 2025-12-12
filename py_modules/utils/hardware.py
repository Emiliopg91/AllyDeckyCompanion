# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

import os
import glob
import decky  # pylint: disable=import-error


class Hardware:
    """Class for managing Hardware adjustments"""

    BAT_LIM_FN = "/sys/class/power_supply/BAT0/charge_control_end_threshold"
    LEGACY_MCU_POWERSAVE_PATH = "/sys/devices/platform/asus-nb-wmi/mcu_powersave"
    ASUS_ARMORY_MCU_POWERSAVE_PATH = "/sys/class/firmware-attributes/asus-armoury/attributes/mcu_powersave/current_value"

    def set_charge_limit(self, lim: int):
        """Set battery charge limit"""
        decky.logger.debug(
            f"Setting charge limit to {lim}%  by writing to {Hardware.BAT_LIM_FN}"
        )
        with open(Hardware.BAT_LIM_FN, "w") as f:
            f.write(str(lim))
            f.close()

    def set_mcu_powersave(self, enabled: bool):
        """Set MCU powersave mode"""
        if os.path.exists(Hardware.LEGACY_MCU_POWERSAVE_PATH):
            with open(Hardware.LEGACY_MCU_POWERSAVE_PATH, "w") as file:
                decky.logger.debug(
                    f"Setting MCU powersave to {enabled} by writing to {Hardware.LEGACY_MCU_POWERSAVE_PATH}"
                )
                file.write("1" if enabled else "0")
                file.close()
        elif os.path.exists(Hardware.ASUS_ARMORY_MCU_POWERSAVE_PATH):
            with open(Hardware.ASUS_ARMORY_MCU_POWERSAVE_PATH, "w") as file:
                decky.logger.debug(
                    f"Setting MCU powersave to {enabled} by writing to {Hardware.ASUS_ARMORY_MCU_POWERSAVE_PATH}"
                )
                file.write("1" if enabled else "0")
                file.close()

    def is_ac_connected(self):
        """Check if AC is online"""
        for p in glob.glob("/sys/class/power_supply/AC*/online"):
            with open(p, "r") as f:
                return int(f.read().strip()) == 1

        return False


HARDWARE = Hardware()
