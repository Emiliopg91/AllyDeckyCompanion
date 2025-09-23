# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

import glob
import os

import decky  # pylint: disable=import-error


class CpuPerformance:
    """Class for adjusting CPU performance"""

    ASUS_ARMORY_WMI_BASE = "/sys/class/firmware-attributes/asus-armoury/attributes"

    ACPI_FN = "/sys/firmware/acpi/platform_profile"
    FTDP_FN = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/current_value" if os.path.exists(f"{ASUS_ARMORY_WMI_BASE}/ppt_pl3_fppt/current_value") else f"{ASUS_ARMORY_WMI_BASE}/ppt_fppt/current_value"
    STDP_FN = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl2_sppt/current_value"
    CTDP_FN = f"{ASUS_ARMORY_WMI_BASE}/ppt_pl1_spl/current_value"
    
    BOOST_FN = glob.glob("/sys/devices/system/cpu/cpufreq/policy*/boost")

    SMT_PATH = "/sys/devices/system/cpu/smt/control"
    GOV_FN = glob.glob('/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor')

    @staticmethod
    def set_tdp(pretty: str, fn: str, val: int):
        """Set CPU TDP"""
        decky.logger.debug(f"Setting tdp value '{pretty}' to {val} by writing to {fn}")
        with open(fn, "w") as f:
            f.write(f"{val}\n")
            f.close()
        return True

    @staticmethod
    def set_cpu_boost(enabled=True):
        """Set CPU Boost"""
        try:
            val = "1" if enabled else "0"
            for p in CpuPerformance.BOOST_FN:
                decky.logger.debug(
                    f"Setting CPU Boost to {val} by writing to '{p}'"
                )
                with open(p, "w") as file:
                    file.write(val)
                    file.close()
        except Exception as e:
            decky.logger.error(e)

    @staticmethod
    def set_smt(enabled=True):
        """Set multi-threading"""
        try:
            val = "on" if enabled else "off"
            decky.logger.debug(
                f"Setting SMT to {val} by writing to {CpuPerformance.SMT_PATH}"
            )
            with open(CpuPerformance.SMT_PATH, "w") as file:
                file.write(val)
                file.close()
        except Exception as e:
            decky.logger.error(e)

    @staticmethod
    def set_platform_profile(prof: str):
        """Set platform profile"""
        decky.logger.debug(
            f"Setting platform profile to '{prof}' by writing to {CpuPerformance.ACPI_FN}"
        )
        with open(CpuPerformance.ACPI_FN, "w") as f:
            f.write(prof)
            f.close()

    @staticmethod
    def set_governor(governor: str):
        """Set CPU governor"""
        for p in CpuPerformance.GOV_FN:
            decky.logger.debug(
                f"Setting governor to {governor} by writing to {p}"
            )
            with open(p, "w") as f:
                f.write(governor)
                f.close()
