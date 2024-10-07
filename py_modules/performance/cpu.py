import decky
import subprocess

ACPI_FN = "/sys/firmware/acpi/platform_profile"
FTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_fppt"
STDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl2_sppt"
CTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl1_spl"
APU_FN = "/sys/devices/platform/asus-nb-wmi/ppt_apu_sppt"
BOOST_FN = "/sys/devices/system/cpu/cpufreq/boost"
SMT_PATH = "/sys/devices/system/cpu/smt/control"
GOV_FN = "/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor"

def get_online_cpus():
  online_cpus = ['0']
  cpu_path = '/sys/devices/system/cpu/'
  cpu_pattern = re.compile(r'^cpu(\d+)$')

  for cpu_dir in os.listdir(cpu_path):
    match = cpu_pattern.match(cpu_dir)
    if match:
      cpu_id = match.group(1)
      if check_cpu_online(cpu_id):
        online_cpus.append(cpu_id)
  
  online_cpus.sort()

  return online_cpus

def set_tdp(pretty: str, fn: str, val: int):
    decky.logger.debug(f"Setting tdp value '{pretty}' to {val} by writing to {fn}")
    with open(fn, "w") as f:
        f.write(f"{val}\n")
    return True

def set_cpu_boost(enabled = True):
    try:
        val = "1" if enabled else "0"
        decky.logger.debug(f"Setting CPU Boost to {val} by writing to '{BOOST_FN}'")
        with open(BOOST_FN, 'w') as file:
            file.write(val)
            file.close()
    except Exception as e:
        decky.logger.error(e)

def set_smt(enabled = True):
    try:
        val = "on" if enabled else "off"
        decky.logger.debug(f"Setting SMT to {val} by writing to {SMT_PATH}")
        with open(SMT_PATH, 'w') as file:
            file.write(val)
            file.close()
    except Exception as e:
        decky.logger.error(e)

def set_platform_profile(prof: str):
    decky.logger.debug(f"Setting platform profile to '{prof}' by writing to {ACPI_FN}")
    with open(ACPI_FN, "w") as f:
        f.write(prof)

def set_governor(governor:str):
    decky.logger.debug(f"Setting governor to {governor} by writing to {GOV_FN}")
    command = f'echo "{governor}" | tee {GOV_FN}'
    subprocess.run(command, shell=True, check=True)