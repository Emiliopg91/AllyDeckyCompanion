import decky
import os

BAT_LIM_FN = "/sys/class/power_supply/BAT0/charge_control_end_threshold"
LEGACY_MCU_POWERSAVE_PATH = "/sys/devices/platform/asus-nb-wmi/mcu_powersave"
ASUS_ARMORY_MCU_POWERSAVE_PATH = "/sys/class/firmware-attributes/asus-armoury/attributes/mcu_powersave"

class Hardware:
    @staticmethod
    def set_charge_limit(lim: int):
        decky.logger.debug(f"Setting charge limit to {lim}%  by writing to {BAT_LIM_FN}")
        with open(BAT_LIM_FN, "w") as f:
            f.write(str(lim))
            f.close()

    @staticmethod
    def set_mcu_powersave(enabled: bool):
        if os.path.exists(LEGACY_MCU_POWERSAVE_PATH):
            with open(LEGACY_MCU_POWERSAVE_PATH, 'w') as file:
                decky.logger.debug(f"Setting MCU powersave to {enabled} by writing to {LEGACY_MCU_POWERSAVE_PATH}")
                file.write('1' if enabled else '0')
                file.close()
        elif os.path.exists(ASUS_ARMORY_MCU_POWERSAVE_PATH):
            with open(ASUS_ARMORY_MCU_POWERSAVE_PATH, 'w') as file:
                decky.logger.debug(f"Setting MCU powersave to {enabled} by writing to {ASUS_ARMORY_MCU_POWERSAVE_PATH}")
                file.write('1' if enabled else '0')
                file.close()