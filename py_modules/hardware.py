import decky
import subprocess

BAT_LIM_FN = "/sys/class/power_supply/BAT0/charge_control_end_threshold"
PROD_FN = "/sys/devices/virtual/dmi/id/product_name"

def set_charge_limit(lim: int):
    try:
        decky.logger.debug(f"Setting charge limit to {lim}%  by writing to {BAT_LIM_FN}")
        with open(BAT_LIM_FN, "w") as f:
            f.write(str(lim))
            f.close()
    except Exception as e:
        decky.logger.error(e)

def get_pn():
    try:
        with open(PROD_FN) as f:
            content = f.read().strip()
            parts = content.replace('_', ' ').split()
            return parts[-1]
    except Exception as e:
        decky.logger.error(e)
    return ""

def is_ally_x():
    return "RC72L" in get_pn()

def is_ally():
    return "RC71L" in get_pn()

def bios_version():
    cad="Version: "+get_pn()+"."
    result = subprocess.run(['/usr/bin/bash', '-c', 'dmidecode | grep "'+cad+'"'], 
                            stdout=subprocess.PIPE, 
                            stderr=subprocess.PIPE, 
                            text=True)
    
    if result.returncode != 0:
        return "Unknown"
    
    output = result.stdout.strip()
    version_line = output.split(cad)[1].strip()
    
    return version_line