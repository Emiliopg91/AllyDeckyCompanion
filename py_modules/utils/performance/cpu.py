import decky
import subprocess

class CpuPerformance:
    ACPI_FN = "/sys/firmware/acpi/platform_profile"
    FTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_fppt"
    STDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl2_sppt"
    CTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl1_spl"
    APU_FN = "/sys/devices/platform/asus-nb-wmi/ppt_apu_sppt"
    BOOST_FN = "/sys/devices/system/cpu/cpufreq/boost"
    SMT_PATH = "/sys/devices/system/cpu/smt/control"
    GOV_FN = "/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor"

    @staticmethod
    def set_tdp(pretty: str, fn: str, val: int):
        decky.logger.debug(f"Setting tdp value '{pretty}' to {val} by writing to {fn}")
        with open(fn, "w") as f:
            f.write(f"{val}\n")
        return True

    @staticmethod
    def set_cpu_boost(enabled = True):
        try:
            val = "1" if enabled else "0"
            decky.logger.debug(f"Setting CPU Boost to {val} by writing to '{CpuPerformance.BOOST_FN}'")
            with open(CpuPerformance.BOOST_FN, 'w') as file:
                file.write(val)
                file.close()
        except Exception as e:
            decky.logger.error(e)

    @staticmethod
    def set_smt(enabled = True):
        try:
            val = "on" if enabled else "off"
            decky.logger.debug(f"Setting SMT to {val} by writing to {CpuPerformance.SMT_PATH}")
            with open(CpuPerformance.SMT_PATH, 'w') as file:
                file.write(val)
                file.close()
        except Exception as e:
            decky.logger.error(e)

    @staticmethod
    def set_platform_profile(prof: str):
        decky.logger.debug(f"Setting platform profile to '{prof}' by writing to {CpuPerformance.ACPI_FN}")
        with open(CpuPerformance.ACPI_FN, "w") as f:
            f.write(prof)

    @staticmethod
    def set_governor(governor:str):
        decky.logger.debug(f"Setting governor to {governor} by writing to {CpuPerformance.GOV_FN}")
        command = f'echo "{governor}" | tee {CpuPerformance.GOV_FN}'
        subprocess.run(command, shell=True, check=True)