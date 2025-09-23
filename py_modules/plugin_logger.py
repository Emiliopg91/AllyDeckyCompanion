# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods, disable=consider-using-with

import logging

from plugin_config import PluginConfig

import decky  # pylint: disable=import-error


class PluginLogger:
    """Logger for plugin"""

    @staticmethod
    def log(level: str, msg: str) -> int:
        """
        Logs a message with the specified level.

        Parameters:
        level (str): The level of the log message ('debug', 'info', 'warn', or 'error').
        msg (str): The message to log.

        Returns:
        int: The status code indicating the success of the logging operation.
        """
        match level.strip().lower():
            case "debug":
                decky.logger.debug(msg)
            case "info":
                decky.logger.info(msg)
            case "warn":
                decky.logger.warning(msg)
            case "error":
                decky.logger.error(msg)

    @staticmethod
    def get_plugin_log() -> str:
        """
        Retrieves the entire plugin log.

        Returns:
        str: The plugin log.
        """
        log: str = ""
        for line in reversed(list(open(decky.DECKY_PLUGIN_LOG, encoding="utf-8"))):
            log = line + "\n" + log
            if "Logger initialized at level" in line.strip():
                break
        return log

    @staticmethod
    def configure_logger():
        """
        Configures the logger using the settings defined in PluginConfig.
        """
        formatter = logging.Formatter(
            fmt="[%(asctime)s,%(msecs)03d][%(levelname)s]%(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        logger_level = PluginConfig.get_config_item("log_level", "INFO")
        decky.logger.setLevel(logger_level)
        for h in decky.logger.handlers:
            h.setFormatter(formatter)
