# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

import glob

import decky  # pylint: disable=import-error


class CpuPerformance:
    """Class for adjusting CPU performance"""

    ASUS_NB_WMI = "/sys/devices/platform/asus-nb-wmi"

    FPPT_FN = f"{ASUS_NB_WMI}/ppt_fppt"
    SPPT_FN = f"{ASUS_NB_WMI}/ppt_pl2_sppt"
    SPL_FN = f"{ASUS_NB_WMI}/ppt_pl1_spl"

    BOOST_FN = glob.glob("/sys/devices/system/cpu/cpufreq/policy*/boost")

    ACPI_FN = "/sys/firmware/acpi/platform_profile"

    GOV_FN = glob.glob("/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor")
    EPP_FN = glob.glob(
        "/sys/devices/system/cpu/cpu*/cpufreq/energy_performance_preference"
    )

    def get_tdp_ranges(self):
        """Get tdp ranges"""
        cpu_name = None
        with open("/proc/cpuinfo") as f:
            for line in f:
                if "model name" in line:
                    cpu_name = line.split(":")[1].strip()
                    break

        if "extreme" in cpu_name.lower():
            # Z1/2 Extreme
            return {"spl": [5, 35], "sppt": [5, 43], "fppt": [5, 53]}

        # Z2 A
        return {"spl": [6, 20], "sppt": [6, 20], "fppt": [6, 20]}

    def set_tdp(self, pretty: str, fn: str, val: int):
        """Set CPU TDP"""
        decky.logger.debug(f"Setting tdp value '{pretty}' to {val} by writing to {fn}")
        with open(fn, "w") as f:
            f.write(f"{val}\n")
        return True

    def set_cpu_boost(self, enabled=True):
        """Set CPU Boost"""
        try:
            val = "1" if enabled else "0"
            for p in CpuPerformance.BOOST_FN:
                decky.logger.debug(f"Setting CPU Boost to {val} by writing to '{p}'")
                with open(p, "w") as file:
                    file.write(val)
        except Exception as e:
            decky.logger.error(e)

    def set_platform_profile(self, prof: str):
        """Set platform profile"""
        decky.logger.debug(
            f"Setting platform profile to '{prof}' by writing to {CpuPerformance.ACPI_FN}"
        )
        try:
            with open(CpuPerformance.ACPI_FN, "w") as f:
                f.write(prof)
        except Exception as e:
            if prof == "low-power":
                decky.logger.error(
                    f"Error setting platform profile '{prof}', trying with 'quiet'"
                )
                self.set_platform_profile("quiet")
            else:
                raise e

    def set_governor(self, governor: str):
        """Set CPU governor"""
        for p in CpuPerformance.GOV_FN:
            decky.logger.debug(f"Setting governor to {governor} by writing to {p}")
            with open(p, "w") as f:
                f.write(governor)

    def set_epp(self, epp: str):
        """Set CPU epp"""
        for p in CpuPerformance.EPP_FN:
            decky.logger.debug(f"Setting EPP to {epp} by writing to {p}")
            with open(p, "w") as f:
                f.write(epp)


CPU_PERFORMANCE = CpuPerformance()
