import os

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky
import plugin_config
import logger_utils
import sdtdp
import hardware
from performance import cpu, gpu
import plugin_update
import shutil
import subprocess
import miscelanea
from time import sleep

class Plugin:
    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def add(self, left, right):
        return left + right
    
# Configuration

    async def get_config(self):
        decky.logger.debug("Executing: get_config()")
        return plugin_config.get_config()

    async def set_config(self, key: str, value: str):
        decky.logger.debug("Executing: set_config(%s, %s)", key, value)
        plugin_config.set_config(key, value)

# Logger

    async def log(self, level: str, msg: str) -> int:
        return logger_utils.log(level, msg)

    async def get_plugin_log(self) -> str:
        decky.logger.debug("Executing: get_plugin_log()")
        return logger_utils.get_plugin_log()
    
# Lifecycle

    async def _main(self):
        logger_utils.configure_logger()
        decky.logger.info("Running "+decky.DECKY_PLUGIN_NAME)
        if not os.path.exists(miscelanea.ICONS_PATH):
            os.makedirs(miscelanea.ICONS_PATH, exist_ok=True)

    async def _unload(self):
        decky.logger.info("Unloading "+decky.DECKY_PLUGIN_NAME)

    async def _migration(self):
        decky.logger.info("Migrating plugin configuration")
        plugin_config.migrate()

# HARDWARE 
    async def set_charge_limit(self, limit: int):
        decky.logger.debug(f"Executing: set_charge_limit({limit})")
        hardware.set_charge_limit(limit)

# CPU 
    async def set_governor(self, governor:str):
        decky.logger.debug(f"Executing: set_governor({governor})")
        return cpu.set_governor(governor)

    async def set_platform_profile(self, prof: str):
        decky.logger.debug(f"Executing: set_platform_profile({prof})")
        cpu.set_platform_profile(prof)
        sleep(0.1)

    async def set_tdp(self, spl: int, sppl: int, fppl: int):
        try:
            decky.logger.debug(f"Executing: set_tdp({spl, sppl, fppl})")
            sleep(0.1)
            cpu.set_tdp('FAST', cpu.FTDP_FN, fppl)
            sleep(0.1)  
            cpu.set_tdp('SLOW', cpu.STDP_FN, sppl)
            sleep(0.1)
            cpu.set_tdp('APU', cpu.APU_FN, sppl)
            sleep(0.1)
            cpu.set_tdp('STEADY', cpu.CTDP_FN, spl)
            sleep(0.1)
        except Exception as e:
            decky.logger.error(e)

    async def set_cpu_boost(self, enabled: bool):
        decky.logger.debug(f"Executing: set_cpu_boost({enabled})")
        cpu.set_cpu_boost(enabled)

    async def set_smt(self, enabled: bool):
        decky.logger.debug(f"Executing: set_smt({enabled})")
        cpu.set_smt(enabled)
        sleep(0.1)
        
# GPU
    async def get_gpu_frequency_range(self):
        decky.logger.debug(f"Executing: get_gpu_frequency_range()")
        return gpu.get_gpu_frequency_range()

    async def set_gpu_frequency_range(self, min: int, max: int):
        decky.logger.debug(f"Executing: set_gpu_frequency_range({min}, {max})")
        return gpu.set_gpu_frequency_range(min, max)

#Plugin update
    async def ota_update(self):
        decky.logger.debug("Executing: ota_update()")
        # trigger ota update
        try:
            return plugin_update.ota_update()
        except Exception as e:
            decky.logger.error(e)
            return False

#SDTDP
    async def get_sdtdp_cfg(self):
        decky.logger.debug("Executing: get_sdtdp_cfg()")
        return sdtdp.get_config()

    async def is_sdtdp_cfg_present(self):
        decky.logger.debug("Executing: is_sdtdp_cfg_present()")
        return sdtdp.is_config_present()

    async def is_sdtdp_enabled(self):
        decky.logger.debug("Executing: is_sdtdp_enabled()")
        return sdtdp.is_enabled()
    
    async def disable_sdtdp(self):
        decky.logger.debug("Executing: disable_sdtdp()")
        src = sdtdp.plugin_dir
        dst = decky.DECKY_PLUGIN_DIR+"/SimpleDeckyTDP"
        shutil.move(src, dst)
        decky.logger.info(f"Moved '{src}' to '{dst}'")
        return True
        
#Miscelanea
    async def get_icon_for_app(self, appId:str):
        decky.logger.debug(f"Executing: get_icon_for_app({appId})")
        return miscelanea.get_icon_for_app(appId)
        
    async def save_icon_for_app(self, appId:str, img:str):
        decky.logger.debug(f"Executing: save_icon_for_app({appId}, {img})")
        return miscelanea.save_icon_for_app(appId, img)