import os

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky
import plugin_config
import logger_utils
import sdtdp
import middleware
import plugin_update
import shutil
import subprocess
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

    async def _unload(self):
        decky.logger.info("Unloading "+decky.DECKY_PLUGIN_NAME)

    async def _migration(self):
        decky.logger.info("Migrating plugin configuration")
        plugin_config.migrate()

# BATTERY 
    async def set_charge_limit(self, limit: int):
        decky.logger.debug(f"Executing: set_charge_limit({limit})")
        middleware.set_charge_limit(limit)

# TDP 
    async def set_platform_profile(self, prof: str):
        decky.logger.debug(f"Executing: set_platform_profile({prof})")
        middleware.set_platform_profile(prof)

    async def set_tdp(self, spl: int, sppl: int, fppl: int):
        try:
            decky.logger.debug(f"Executing: set_tdp({spl, sppl, fppl})")
            sleep(0.1)
            middleware.set_tdp('STEADY', middleware.CTDP_FN, spl)
            sleep(0.1)
            middleware.set_tdp('SLOW', middleware.STDP_FN, sppl)
            sleep(0.1)
            middleware.set_tdp('FAST', middleware.FTDP_FN, fppl)
            sleep(0.1)  
        except Exception as e:
            decky.logger.error(e)

    async def set_cpu_boost(self, enabled: bool):
        decky.logger.debug(f"Executing: set_cpu_boost({enabled})")
        middleware.set_cpu_boost(enabled)

    async def set_smt(self, enabled: bool):
        decky.logger.debug(f"Executing: set_smt({enabled})")
        middleware.set_smt(enabled)
        

#MISC
    async def is_ally_x(self):
        decky.logger.debug("Executing: is_ally_x()")
        return middleware.is_ally_x()

    async def is_ally(self):
        decky.logger.debug("Executing: is_ally()")
        return middleware.is_ally()

    async def ota_update(self):
        decky.logger.debug("Executing: ota_update()")
        # trigger ota update
        try:
            return plugin_update.ota_update()
        except Exception as e:
            decky.logger.error(e)
            return False

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
    
    async def bios_version(self):
        decky.logger.debug("Executing: bios_version()")
        return middleware.bios_version()
        