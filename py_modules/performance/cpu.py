import decky

FTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_fppt"
STDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl2_sppt"
CTDP_FN = "/sys/devices/platform/asus-nb-wmi/ppt_pl1_spl"
BOOST_FN = "/sys/devices/system/cpu/cpufreq/boost"
SMT_PATH="/sys/devices/system/cpu/smt/control"

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