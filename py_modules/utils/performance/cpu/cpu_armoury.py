# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

from time import sleep
import os

import decky  # pylint: disable=import-error
from .cpu_base import BaseCpuPerformance


class CpuPerformance(BaseCpuPerformance):
    """Class for adjusting CPU performance"""

    ASUS_ARMORY_WMI_BASE = "/sys/class/firmware-attributes/asus-armoury/attributes"

    FPPT_FN = (
        f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/current_value"
        if os.path.exists(f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/current_value")
        else f"{ASUS_ARMORY_WMI_BASE}/ppt_fppt/current_value"
    )
    FPPT_MIN = (
        f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/min_value"
        if os.path.exists(f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/min_value")
        else f"{ASUS_ARMORY_WMI_BASE}/ppt_fppt/min_value"
    )
    FPPT_MAX = (
        f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/max_value"
        if os.path.exists(f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/max_value")
        else f"{ASUS_ARMORY_WMI_BASE}/ppt_fppt/max_value"
    )

    SPPT_FN = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl2_sppt/current_value"
    SPPT_MIN = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl2_sppt/min_value"
    SPPT_MAX = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl2_sppt/max_value"

    SPL_FN = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl1_spl/current_value"
    SPL_MIN = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl1_spl/min_value"
    SPL_MAX = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl1_spl/max_value"

    def __init__(self):
        super().__init__("Armoury")

    def get_impl_id(self):
        return 0

    def get_tdp_ranges(self):
        with open(CpuPerformance.SPL_MIN, "r") as f:
            spl_min = int(f.read().strip())
        with open(CpuPerformance.SPL_MAX, "r") as f:
            spl_max = int(f.read().strip())

        with open(CpuPerformance.SPPT_MIN, "r") as f:
            sppt_min = int(f.read().strip())
        with open(CpuPerformance.SPPT_MAX, "r") as f:
            sppt_max = int(f.read().strip())

        with open(CpuPerformance.FPPT_MIN, "r") as f:
            fppt_min = int(f.read().strip())
        with open(CpuPerformance.FPPT_MAX, "r") as f:
            fppt_max = int(f.read().strip())

        return {
            "spl": [spl_min, spl_max],
            "sppt": [sppt_min, sppt_max],
            "fppt": [fppt_min, fppt_max],
        }

    def set_tdp(self, spl, sppt, fppt):
        ranges = self.get_tdp_ranges()
        sleep(0.1)
        self._set_tdp("FPPT", self.FPPT_FN, ranges["fppt"][1])
        self._set_tdp("SPPT", self.SPPT_FN, ranges["sppt"][1])
        self._set_tdp("SPL ", self.SPL_FN, ranges["spl"][1])
        sleep(0.1)
        self._set_tdp("SPL ", self.SPL_FN, spl)
        self._set_tdp("SPPT", self.SPPT_FN, sppt)
        self._set_tdp("FPPT", self.FPPT_FN, fppt)
        sleep(0.1)

    def _set_tdp(self, pretty: str, fn: str, val: int):
        """Set CPU TDP"""
        decky.logger.debug(f"Setting {pretty} to {val} by writing to {fn}")
        with open(fn, "w") as f:
            f.write(f"{val}\n")


CPU_PERFORMANCE = CpuPerformance()
