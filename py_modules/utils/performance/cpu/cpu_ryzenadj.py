# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

from time import sleep
import glob
import os
import decky  # pylint: disable=import-error
from .cpu_base import BaseCpuPerformance
import subprocess


class CpuPerformance(BaseCpuPerformance):
    RYZENADJ_PATH = os.path.join(decky.DECKY_PLUGIN_DIR, "bin", "ryzenadj")

    ASUS_NB_WMI = "/sys/devices/platform/asus-nb-wmi"

    FPPT_FN = f"{ASUS_NB_WMI}/ppt_fppt"
    SPPT_FN = f"{ASUS_NB_WMI}/ppt_pl2_sppt"
    SPL_FN = f"{ASUS_NB_WMI}/ppt_pl1_spl"

    DEF_RG = {"spl": [4, 30], "sppt": [4, 30], "fppt": [4, 30]}

    Z1_AC = {"spl": [7, 30], "sppt": [15, 43], "fppt": [15, 53]}
    Z1_DC = {"spl": [7, 25], "sppt": [15, 30], "fppt": [15, 35]}

    Z2_EX_AC = {"spl": [13, 35], "sppt": [16, 45], "fppt": [20, 55]}
    Z2_EX_DC = {"spl": [13, 25], "sppt": [16, 30], "fppt": [20, 36]}

    Z2_A_AC = {"spl": [6, 20], "sppt": [6, 20], "fppt": [6, 20]}
    Z2_A_DC = {"spl": [6, 20], "sppt": [6, 20], "fppt": [6, 20]}

    def __init__(self):
        """Identify this backend as the WMI-based implementation."""
        super().__init__("RyzenAdj")
        os.chmod(self.RYZENADJ_PATH, 0o777)

    def get_impl_id(self):
        return 1

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
        """Persist new SPL/SPPT/FPPT values through the ryzenadj"""
        sleep(0.1)
        decky.logger.debug(
            f"Setting TDP values to SPL: {spl}, SPPT: {sppt}, FPPT: {fppt}"
        )
        for i in range(3):
            subprocess.run(
                [
                    self.RYZENADJ_PATH,
                    "--stapm-limit",
                    f"{spl}000",
                    "--fast-limit",
                    f"{fppt}000",
                    "--slow-limit",
                    f"{sppt}000",
                    "--tctl-temp",
                    "95",
                    "--apu-skin-temp",
                    "95",
                    "--dgpu-skin-temp",
                    "95",
                ],
                check=False,
            )
            sleep(0.1)


CPU_PERFORMANCE = CpuPerformance()
