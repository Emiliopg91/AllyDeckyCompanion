import decky
import subprocess

BAT_LIM_FN = "/sys/class/power_supply/BAT0/charge_control_end_threshold"

class Hardware:
    @staticmethod
    def set_charge_limit(lim: int):
        decky.logger.debug(f"Setting charge limit to {lim}%  by writing to {BAT_LIM_FN}")
        with open(BAT_LIM_FN, "w") as f:
            f.write(str(lim))
            f.close()