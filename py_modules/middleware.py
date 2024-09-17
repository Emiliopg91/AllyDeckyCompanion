import decky_plugin
import re
import os
from time import sleep
import shutil
import subprocess

RYZENADJ_PATH = shutil.which('ryzenadj')
AMD_SMT_PATH="/sys/devices/system/cpu/smt/control"
FTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_fppt"
STDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl2_sppt"
CTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl1_spl"
EPP_FN = "/sys/firmware/acpi/platform_profile"
BAT_LIM_FN = "/sys/class/power_supply/BAT0/charge_control_end_threshold"
CPU_PATH = "/sys/devices/system/cpu/"
PROD_FN = "/sys/devices/virtual/dmi/id/product_name"
RYZENADJ_PATH = shutil.which('ryzenadj')

def set_charge_limit(lim: int):
    try:
        decky_plugin.logger.debug(f"Setting charge limit to {lim}%  by writing to {BAT_LIM_FN}")
        with open(BAT_LIM_FN, "w") as f:
            f.write(str(lim))
            f.close()
    except Exception as e:
        logging.error(e)

def set_platform_profile(prof: str):
    decky_plugin.logger.debug(f"Setting platform profile to '{prof}' by writing to {EPP_FN}")
    with open(EPP_FN, "w") as f:
        f.write(prof)

def ryzenadj(spl: int, sppl: int, fppl: int):
    if RYZENADJ_PATH:
        commands = [
            RYZENADJ_PATH,
            '--apu-slow-limit', str(spl*1000),
            '--stapm-limit', str(spl*1000),
            '--slow-limit', str(sppl*1000),
            '--fast-limit', str(fppl*1000)
        ]
        decky_plugin.logger.debug("Running '" + (" ".join(commands)) + "'")
        results = subprocess.call(commands)
        decky_plugin.logger.debug("Exit code '" + result + "'")

def set_tdp(pretty: str, fn: str, val: int):
    decky_plugin.logger.debug(f"Setting tdp value '{pretty}' to {val} by writing to {fn}")
    with open(fn, "w") as f:
        f.write(f"{val}\n")
    return True

def check_cpu_online(cpu_id):
    cpu_path = f"/sys/devices/system/cpu/cpu{cpu_id}/online"
    if os.path.exists(cpu_path):
        with open(cpu_path, 'r') as f:
            status = f.read().strip()
            return status == '1'
    else:
        return False

def get_online_cpus():
    online_cpus = ['0']
    cpu_pattern = re.compile(r'^cpu(\d+)$')
    for cpu_dir in os.listdir(CPU_PATH):
        match = cpu_pattern.match(cpu_dir)
        if match:
            cpu_id = match.group(1)
            if check_cpu_online(cpu_id):
                online_cpus.append(cpu_id)
    online_cpus.sort()
    return online_cpus

def get_cpb_boost_paths():
    cpu_nums = get_online_cpus()
    cpb_cpu_boost_paths = list(map(
        lambda cpu_num: f'/sys/devices/system/cpu/cpufreq/policy{cpu_num}/boost',
        cpu_nums
    ))
    return cpb_cpu_boost_paths

def set_cpb_boost(enabled):
    try:
        paths = get_cpb_boost_paths()
        for p in paths:
            with open(p, 'w') as file:
                file.write("1" if enabled else "0")
                file.close()
                sleep(0.1)
    except Exception as e:
        logging.error(e)

def set_cpu_boost(enabled = True):
    try:
        decky_plugin.logger.debug(f"Setting CPU Boost to {enabled} by writing to '/sys/devices/system/cpu/cpufreq/policy*/boost'")
        set_cpb_boost(enabled)
    except Exception as e:
        logging.error(e)

def set_smt(enabled = True):
    try:
        val = "on" if enabled else "off"
        decky_plugin.logger.debug(f"Setting SMT to {val} by writing to {AMD_SMT_PATH}")
        with open(AMD_SMT_PATH, 'w') as file:
            file.write(val)
            file.close()
    except Exception as e:
        logging.error(e)

def is_ally_x():
    with open(PROD_FN) as f:
        prod = f.read().strip()
        return "RC72L" in prod
    return False

def is_ally():
    with open(PROD_FN) as f:
        prod = f.read().strip()
        return "Ally" in prod
    return False