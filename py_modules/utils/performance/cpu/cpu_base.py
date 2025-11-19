# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

from abc import ABC, abstractmethod
import glob
import subprocess

import decky  # pylint: disable=import-error


class BaseCpuPerformance(ABC):
    """Base Class for adjusting CPU performance"""

    BOOST_FN = glob.glob("/sys/devices/system/cpu/cpufreq/policy*/boost")

    ACPI_FN = "/sys/firmware/acpi/platform_profile"

    SMT_PATH = "/sys/devices/system/cpu/smt/control"
    GOV_FN = glob.glob("/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor")
    EPP_FN = glob.glob(
        "/sys/devices/system/cpu/cpu*/cpufreq/energy_performance_preference"
    )

    CPU_PRIORITY = -17
    IO_PRIORITY = int((CPU_PRIORITY + 20) / 5)
    IO_CLASS = 2

    def __init__(self, impl: str):
        decky.logger.info(f"Using {impl} implementation")

    @abstractmethod
    def get_tdp_ranges(self):
        """Get TDP ranges"""

    @abstractmethod
    def set_tdp(self, spl: int, sppt: int, fppt: int):
        """Set TDP values"""

    @abstractmethod
    def get_impl_id(self):
        """Get IMPL id"""

    def set_cpu_boost(self, enabled=True):
        """Set CPU Boost"""
        try:
            val = "1" if enabled else "0"
            for p in BaseCpuPerformance.BOOST_FN:
                decky.logger.debug(f"Setting CPU Boost to {val} by writing to '{p}'")
                with open(p, "w") as file:
                    file.write(val)
        except Exception as e:
            decky.logger.error(e)

    def set_smt(self, enabled=True):
        """Set multi-threading"""
        try:
            val = "on" if enabled else "off"
            decky.logger.debug(
                f"Setting SMT to {val} by writing to {BaseCpuPerformance.SMT_PATH}"
            )
            with open(BaseCpuPerformance.SMT_PATH, "w") as file:
                file.write(val)
                file.close()
        except Exception as e:
            decky.logger.error(e)

    def set_platform_profile(self, prof: str):
        """Set platform profile (only if differs)"""
        decky.logger.debug(
            f"Setting platform profile to '{prof}' by writing to {BaseCpuPerformance.ACPI_FN}"
        )
        try:
            with open(BaseCpuPerformance.ACPI_FN, "r") as f:
                current = f.read().strip()

            if current == prof:
                decky.logger.debug(
                    f"Platform profile already set to '{prof}', skipping write."
                )
                return
            with open(BaseCpuPerformance.ACPI_FN, "w") as f:
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
        for p in BaseCpuPerformance.GOV_FN:
            decky.logger.debug(f"Setting governor to {governor} by writing to {p}")
            with open(p, "w") as f:
                f.write(governor)

    def set_epp(self, epp: str):
        """Set CPU epp"""
        for p in BaseCpuPerformance.EPP_FN:
            decky.logger.debug(f"Setting EPP to {epp} by writing to {p}")
            with open(p, "w") as f:
                f.write(epp)

    def _get_process_tree(self, pid):
        """Retrieves the process tree of a given process ID."""
        children = [pid]
        with subprocess.Popen(
            ["ps", "--ppid", str(pid), "-o", "pid="], stdout=subprocess.PIPE
        ) as p:
            lines = p.stdout.readlines()
        for child_pid in lines:
            child_pid = child_pid.strip()
            if not child_pid:
                continue
            children.extend([int(child_pid.decode())])

        return children

    def renice(self, pid: int):
        """Renice process tree"""
        processed = set()

        while True:
            try:
                pids = self._get_process_tree(pid)

                # Filtramos usando ints (correcto)
                new_pids_int = [p for p in pids if p not in processed]

                if new_pids_int:
                    # Convertimos solo al llamar a subprocess
                    new_pids = list(map(str, new_pids_int))

                    subprocess.run(
                        ["renice", str(self.CPU_PRIORITY), "-p", *new_pids], check=False
                    )
                    subprocess.run(
                        [
                            "ionice",
                            f"-c{self.IO_CLASS}",
                            f"-n{self.IO_PRIORITY}",
                            "-p",
                            *new_pids,
                        ],
                        check=False,
                    )

                    # Guardamos ints en processed (fundamental)
                    processed.update(new_pids_int)

                else:
                    decky.logger.debug(f"Reniced {len(processed)} processes")
                    break

            except Exception as e:
                decky.logger.error(f"Error while renicing: {e}")
                break
