# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

from time import sleep
import glob

import decky  # pylint: disable=import-error
from .cpu_base import BaseCpuPerformance


class CpuPerformance(BaseCpuPerformance):

    ASUS_NB_WMI = "/sys/devices/platform/asus-nb-wmi"

    FPPT_FN = f"{ASUS_NB_WMI}/ppt_fppt"
    SPPT_FN = f"{ASUS_NB_WMI}/ppt_pl2_sppt"
    SPL_FN = f"{ASUS_NB_WMI}/ppt_pl1_spl"

    DEF_RG = {"spl": [4, 30], "sppt": [4, 30], "fppt": [4, 30]}

    Z1_AC = {"spl": [7, 30], "sppt": [15, 43], "fppt": [15, 53]}
    Z1_DC = {"spl": [7, 25], "sppt": [15, 30], "fppt": [15, 35]}

    Z2_EX_AC = {"spl": [7, 35], "sppt": [14, 45], "fppt": [19, 55]}
    Z2_EX_DC = {"spl": [7, 35], "sppt": [13, 45], "fppt": [19, 55]}

    Z2_A_AC = {"spl": [6, 20], "sppt": [6, 20], "fppt": [6, 20]}
    Z2_A_DC = {"spl": [6, 20], "sppt": [6, 20], "fppt": [6, 20]}

    def __init__(self):
        """Identify this backend as the WMI-based implementation."""
        super().__init__("WMI")

    def get_impl_id(self):
        return 2

    def get_tdp_ranges(self):
        """Return the (min, max) SPL/SPPT/FPPT limits detected for the current CPU."""
        on_ac = False
        for path in glob.glob("/sys/class/power_supply/AC*/online"):
            try:
                with open(path, "r") as f:
                    if f.read().strip() == "1":
                        on_ac = True
                        break
            except FileNotFoundError:
                continue

        cpu_name = None
        with open("/proc/cpuinfo") as f:
            for line in f:
                if "model name" in line:
                    cpu_name = line.split(":")[1].strip()
                    break

        if "z1" in cpu_name.lower():
            return CpuPerformance.Z1_AC if on_ac else CpuPerformance.Z1_DC

        if "z2" in cpu_name.lower():
            if "extreme" in cpu_name.lower():
                return CpuPerformance.Z2_EX_AC if on_ac else CpuPerformance.Z2_EX_DC

            return CpuPerformance.Z2_A_AC if on_ac else CpuPerformance.Z2_A_DC

        return CpuPerformance.DEF_RG

    def set_tdp(self, spl, sppt, fppt):
        """Persist new SPL/SPPT/FPPT values through the WMI sysfs knobs."""
        sleep(0.1)
        self._set_tdp("FAST", self.FPPT_FN, fppt)
        sleep(0.1)
        self._set_tdp("SLOW", self.SPPT_FN, sppt)
        sleep(0.1)
        self._set_tdp("STEADY", self.SPL_FN, spl)
        sleep(0.1)

    def _set_tdp(self, pretty: str, fn: str, val: int):
        """Write a single TDP value to the corresponding sysfs file."""
        decky.logger.debug(f"Setting tdp value '{pretty}' to {val} by writing to {fn}")
        with open(fn, "w") as f:
            f.write(f"{val}\n")


CPU_PERFORMANCE = CpuPerformance()
