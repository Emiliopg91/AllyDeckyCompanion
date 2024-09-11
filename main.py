import os

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin
import plugin_config
import logger_utils
import middleware
import plugin_update
from time import sleep

class Plugin:
    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def add(self, left, right):
        return left + right
    
# Configuration

    async def get_config(self):
        decky_plugin.logger.debug("Executing: get_config()")
        return plugin_config.get_config()

    async def set_config(self, key: str, value: str):
        decky_plugin.logger.debug("Executing: set_config(%s, %s)", key, value)
        plugin_config.set_config(key, value)

# Logger

    async def log(self, level: str, msg: str) -> int:
        decky_plugin.logger.debug("Executing: log()")
        return logger_utils.log(level, msg)

    async def get_plugin_log(self) -> str:
        decky_plugin.logger.debug("Executing: get_plugin_log()")
        return logger_utils.get_plugin_log()
    
# Lifecycle

    async def _main(self):
        logger_utils.configure_logger()
        decky_plugin.logger.info("Running "+decky_plugin.DECKY_PLUGIN_NAME)

    async def _unload(self):
        decky_plugin.logger.info("Unloading "+decky_plugin.DECKY_PLUGIN_NAME)

    async def _migration(self):
        decky_plugin.logger.info("Migrating plugin configuration")
        plugin_config.migrate()

# BATTERY 
    async def set_charge_limit(self, enabled: bool):
        decky_plugin.logger.debug(f"Executing: set_charge_limit({enabled})")
        middleware.set_charge_limit(enabled)

# TDP 
    async def set_platform_profile(self, prof: str):
        decky_plugin.logger.debug(f"Executing: set_platform_profile({prof})")
        middleware.set_platform_profile(prof)

    async def set_tdp(self, spl: int, sppl: int, fppl: int):
        try:
            decky_plugin.logger.debug(f"Executing: set_tdp({spl, sppl, fppl})")
            sleep(0.1)
            middleware.set_tdp('STEADY', middleware.CTDP_FN, spl)
            sleep(0.1)
            middleware.set_tdp('SLOW', middleware.STDP_FN, sppl)
            sleep(0.1)
            middleware.set_tdp('FAST', middleware.FTDP_FN, fppl)
            sleep(0.1)  
        except Exception as e:
            logging.error(e)

    async def set_cpu_boost(self, enabled: bool):
        decky_plugin.logger.debug(f"Executing: set_cpu_boost({enabled})")
        middleware.set_cpu_boost(enabled)

    async def set_smt(self, enabled: bool):
        decky_plugin.logger.debug(f"Executing: set_smt({enabled})")
        middleware.set_smt(enabled)
        

#MISC
    async def is_ally_x(self):
        decky_plugin.logger.debug("Executing: is_ally_x()")
        return middleware.is_ally_x()

    async def is_ally(self):
        decky_plugin.logger.debug("Executing: is_ally()")
        return middleware.is_ally()

    async def ota_update(self):
        # trigger ota update
        try:
            plugin_update.ota_update()
        except Exception as e:
            logging.error(e)