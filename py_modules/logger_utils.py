import decky_plugin
import plugin_config
import logging


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
            decky_plugin.logger.debug(msg)
        case "info":
            decky_plugin.logger.info(msg)
        case "warn":
            decky_plugin.logger.warn(msg)
        case "error":
            decky_plugin.logger.error(msg)

def get_plugin_log() -> str:
    """
    Retrieves the entire plugin log.

    Returns:
    str: The plugin log.
    """
    log: str = ""
    for line in reversed(list(open(decky_plugin.DECKY_PLUGIN_LOG))):
        log = line + '\n' + log  
        if "Logger initialized at level" in line.strip():
            break
    return log

def configure_logger():
    formatter = logging.Formatter(
        fmt='[%(asctime)s,%(msecs)03d][%(levelname)s]%(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    logger_level=plugin_config.get_config_item("log_level", "INFO")
    decky_plugin.logger.setLevel(logger_level)
    for h in decky_plugin.logger.handlers:
        h.setFormatter(formatter)
