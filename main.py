import os

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin
import plugin_config
import logger_utils

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