# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

from abc import ABC, abstractmethod
import glob
import os
import subprocess
from collections import defaultdict

import decky  # pylint: disable=import-error


class BaseCpuPerformance(ABC):
    """Base Class for adjusting CPU performance"""

    BOOST_FN = "/sys/devices/system/cpu/cpufreq/boost"

    ACPI_FN = "/sys/firmware/acpi/platform_profile"

    SMT_PATH = "/sys/devices/system/cpu/smt/control"

    CPU_PRIORITY = -17
    IO_PRIORITY = int((CPU_PRIORITY + 20) / 5)
    IO_CLASS = 2

    def __init__(self, impl: str):
        decky.logger.info(f"Using {impl} implementation")

        try:
            onlines = glob.glob("/sys/devices/system/cpu/cpu*/online")
            for online in onlines:
                with open(online, "w") as file:
                    file.write("1")
                    file.close()
        except Exception as e:
            print(e)

        self.smt_map = BaseCpuPerformance.__get_smt_map()
        cpu_cache_ids = BaseCpuPerformance.__build_cache_groups()
        p_cores, c_cores = BaseCpuPerformance.__detect_p_and_c_cores(cpu_cache_ids)
        p_phys, c_phys = BaseCpuPerformance.__detect_physical_cores_only(
            p_cores, c_cores, self.smt_map
        )
        self.cores = sorted(p_phys + c_phys)
        self.p_cores = p_phys
        self.c_cores = c_phys

        decky.logger.info(f"Cores: {', '.join(str(c) for c in self.cores)}")
        decky.logger.info(f"P-cores: {', '.join(str(c) for c in p_phys)}")
        decky.logger.info(f"C-cores: {', '.join(str(c) for c in c_phys)}")
        decky.logger.info("CPU-SMT map:")
        for core, smts in self.smt_map.items():
            decky.logger.info(f"  {core}: {','.join(str(c) for c in smts)}")

    @staticmethod
    def __build_cache_groups():
        cache_groups = {}
        next_id = 0
        cpu_cache_ids = {}

        for cpu_path in sorted(glob.glob("/sys/devices/system/cpu/cpu[0-9]*")):
            cpu_id = int(cpu_path.split("cpu")[-1])
            cpu_cache_ids[cpu_id] = {"L1d": None, "L1i": None, "L2": None, "L3": None}

            for idx_path in glob.glob(os.path.join(cpu_path, "cache", "index*")):
                level = BaseCpuPerformance.__read(os.path.join(idx_path, "level"))
                ctype = BaseCpuPerformance.__read(os.path.join(idx_path, "type"))
                shared = BaseCpuPerformance.__read(
                    os.path.join(idx_path, "shared_cpu_list")
                )

                if level is None or ctype is None or shared is None:
                    continue

                key = (level, ctype, shared)

                if key not in cache_groups:
                    cache_groups[key] = next_id
                    next_id += 1

                group_id = cache_groups[key]

                if level == "1" and ctype == "Data":
                    cpu_cache_ids[cpu_id]["L1d"] = group_id
                elif level == "1" and ctype == "Instruction":
                    cpu_cache_ids[cpu_id]["L1i"] = group_id
                elif level == "2":
                    cpu_cache_ids[cpu_id]["L2"] = group_id
                elif level == "3":
                    cpu_cache_ids[cpu_id]["L3"] = group_id

        return cpu_cache_ids

    @staticmethod
    def __detect_physical_cores_only(pcores, ccores, smt_map):
        p_phys = []
        c_phys = []

        for cpu in pcores:
            if cpu in smt_map:
                p_phys.append(cpu)

        for cpu in ccores:
            if cpu in smt_map:
                c_phys.append(cpu)

        return sorted(p_phys), sorted(c_phys)

    @staticmethod
    def __detect_p_and_c_cores(cpu_cache_ids):
        l3_groups = defaultdict(list)

        for cpu, caches in cpu_cache_ids.items():
            l3 = caches["L3"]
            l3_groups[l3].append(cpu)

        # ordenar grupos por tamaño
        sorted_groups = sorted(l3_groups.items(), key=lambda x: len(x[1]))

        if len(sorted_groups) < 2:
            return sorted_groups[0][1], []

        p_cores = sorted_groups[0][1]
        c_cores = sorted_groups[1][1]

        return sorted(p_cores), sorted(c_cores)

    @staticmethod
    def __read(path):
        try:
            with open(path) as f:
                return f.read().strip()
        except:  # pylint: disable=W0702
            return None

    def get_cores_count(self):
        """Get CPU cores count"""
        return [len(self.p_cores), len(self.c_cores)]

    def set_cpu_boost(self, enabled=True):
        """Set CPU Boost"""
        try:
            val = "1" if enabled else "0"
            decky.logger.debug(
                f"Setting CPU Boost to {val} by writing to '{BaseCpuPerformance.BOOST_FN}'"
            )
            with open(BaseCpuPerformance.BOOST_FN, "w") as file:
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

    def set_epp(self, epp: str):
        """Set CPU epp"""
        cores = []
        for core, siblings in self.smt_map.items():
            cores.append(core)
            for sc in siblings:
                cores.append(sc)

        cores = sorted(cores)

        governor = "powersave"

        for c in cores:
            p_e = (
                f"/sys/devices/system/cpu/cpu{c}/cpufreq/energy_performance_preference"
            )
            p_g = f"/sys/devices/system/cpu/cpu{c}/cpufreq/scaling_governor"

            prev_gov = self.__read(p_g)
            prev_epp = self.__read(p_e)

            if prev_gov != governor or prev_epp != epp:
                if prev_gov != governor:
                    decky.logger.debug(
                        f"Setting governor to {governor} by writing to {p_g}"
                    )
                    with open(p_g, "w") as f:
                        f.write(governor)
                if prev_epp != epp:
                    decky.logger.debug(f"Setting EPP to {epp} by writing to {p_e}")
                    with open(p_e, "w") as f:
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
                new_pids_int = [p for p in pids if p not in processed]
                if new_pids_int:
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
                    processed.update(new_pids_int)

                else:
                    decky.logger.debug(f"Reniced {len(processed)} processes")
                    break

            except Exception as e:
                decky.logger.error(f"Error while renicing: {e}")
                break

    @staticmethod
    def __get_smt_map():
        res = {}
        seen = set()

        for core in range(256):
            if core not in seen:
                file = f"/sys/devices/system/cpu/cpu{core}/topology/cluster_cpus_list"

                if not os.path.exists(file):
                    break

                seen.add(core)
                cores = BaseCpuPerformance.__read(file).split(",")
                for c in cores:
                    c = int(c)
                    seen.add(c)
                    if c != core:
                        if core not in res:
                            res[core] = []
                        res[core].append(c)

        return res

    def __set_core_state(self, core, p_core, state):
        path = f"/sys/devices/system/cpu/cpu{core}/online"
        try:
            if os.path.exists(path) != 0:
                with open(path, "r") as f:
                    enabled = int(f.read().strip()) == 1

                if enabled != state:
                    core_type = "p-core" if p_core else "e-core"
                    action = "Enabling" if state else "Disabling"
                    value = "1" if state else "0"

                    decky.logger.debug(
                        f"{action} {core_type} {core} by writing {value} to {path}"
                    )
                    with open(path, "w") as f:
                        f.write(value)
        except Exception as e:
            decky.logger.error(f"Cannot enable core {core}: {e}")

    def __get_cores_status(
        self,
        core_list: list[int],
        enabled_cores: int,
        smt: bool,
        cores_status: dict[int, bool],
    ):
        for idx in range(len(core_list)):  # pylint: disable=C0200
            core = core_list[idx]
            enabled = idx < enabled_cores

            cores_status[core] = enabled

            if core in self.smt_map and len(self.smt_map[core]) > 0:
                for subcore in self.smt_map[core]:
                    cores_status[subcore] = enabled and smt

    def enable_cores(self, p_cores, e_cores, smt):
        """Enable CPU cores"""
        p_cores = min(max(p_cores, 1), len(self.p_cores))
        e_cores = min(max(e_cores, 0), len(self.c_cores))

        core_status = {}

        self.__get_cores_status(self.p_cores, p_cores, smt, core_status)
        self.__get_cores_status(self.c_cores, e_cores, smt, core_status)

        decky.logger.info("Setting cores status:")
        decky.logger.info(
            f"  Enabled:  {', '.join([str(c) for c in sorted(core_status.keys()) if core_status[c]])}"
        )
        decky.logger.info(
            f"  Disabled: {', '.join([str(c) for c in sorted(core_status.keys()) if not core_status[c]])}"
        )
        for core in sorted(core_status.keys()):
            self.__set_core_state(core, core in self.p_cores, core_status[core])

    @abstractmethod
    def get_tdp_ranges(self):
        """Get TDP ranges"""

    @abstractmethod
    def set_tdp(self, spl: int, sppt: int, fppt: int):
        """Set TDP values"""

    @abstractmethod
    def get_impl_id(self):
        """Get IMPL id"""
