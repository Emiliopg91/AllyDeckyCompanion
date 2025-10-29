# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods, disable=consider-using-with

import os
import shutil
from time import sleep
from plugin_config import PluginConfig
from plugin_logger import PluginLogger
from plugin_update import PluginUpdate
from utils.sdtdp import SDTDP
from utils.hardware import HARDWARE
from utils.performance.cpu import CPU_PERFORMANCE
from utils.performance.gpu import GPU_PERFORMANCE
from utils.miscelanea import MISCELANEA

import decky  # pylint: disable=import-error


class Plugin:
    """Plugin main class"""

    # Lifecycle

    async def _main(self):
        PluginLogger.configure_logger()
        decky.logger.info("Running " + decky.DECKY_PLUGIN_NAME)
        if not os.path.exists(MISCELANEA.ICONS_PATH):
            os.makedirs(MISCELANEA.ICONS_PATH, exist_ok=True)

    async def _unload(self):
        decky.logger.info("Unloading " + decky.DECKY_PLUGIN_NAME)

    async def _migration(self):
        decky.logger.info("Migrating plugin configuration")
        PluginConfig.migrate()

    # Configuration
    async def get_config(self):
        """Get plugin config"""
        decky.logger.debug("Executing: get_config()")
        return PluginConfig.get_config()

    async def set_config(self, key: str, value):
        """Set plugin config entry"""
        decky.logger.debug("Executing: set_config(%s, %s)", key, str(value))
        PluginConfig.set_config(key, value)

    # Logger
    async def log(self, level: str, msg: str) -> int:
        """Write line to log"""
        return PluginLogger.log(level, msg)

    async def get_plugin_log(self) -> str:
        """Get plugin log file content"""
        decky.logger.debug("Executing: get_plugin_log()")
        return PluginLogger.get_plugin_log()

    # HARDWARE
    async def set_charge_limit(self, limit: int):
        """Set device charge limit"""
        HARDWARE.set_charge_limit(limit)

    async def set_mcu_powersave(self, enabled: bool):
        """Set MCU power save mode"""
        HARDWARE.set_mcu_powersave(enabled)

    # CPU
    async def set_governor(self, governor: str):
        """Set CPU governor"""
        return CPU_PERFORMANCE.set_governor(governor)

    async def set_epp(self, epp: str):
        """Set CPU epp"""
        return CPU_PERFORMANCE.set_epp(epp)

    async def set_platform_profile(self, prof: str):
        """Set CPU platform profile"""
        CPU_PERFORMANCE.set_platform_profile(prof)
        sleep(0.1)

    async def get_tdp_ranges(self):
        """Get CPU TDP ranges"""
        try:
            return CPU_PERFORMANCE.get_tdp_ranges()
        except Exception as e:
            decky.logger.error(e)

    async def set_tdp(self, spl: int, sppl: int, fppl: int):
        """Set CPU TDP"""
        try:
            sleep(0.1)
            CPU_PERFORMANCE.set_tdp("FAST", CPU_PERFORMANCE.FPPT_FN, fppl)
            sleep(0.1)
            CPU_PERFORMANCE.set_tdp("SLOW", CPU_PERFORMANCE.SPPT_FN, sppl)
            sleep(0.1)
            CPU_PERFORMANCE.set_tdp("STEADY", CPU_PERFORMANCE.SPL_FN, spl)
            sleep(0.1)
        except Exception as e:
            decky.logger.error(e)

    async def set_cpu_boost(self, enabled: bool):
        """Set CPU boost"""
        CPU_PERFORMANCE.set_cpu_boost(enabled)

    # GPU
    async def get_gpu_frequency_range(self):
        """Get GPU freq range"""
        return GPU_PERFORMANCE.get_gpu_frequency_range()

    async def set_gpu_frequency_range(self, min_freq: int, max_freq: int):
        """Set GPU freq range"""
        return GPU_PERFORMANCE.set_gpu_frequency_range(min_freq, max_freq)

    # Plugin update
    async def ota_update(self):
        """trigger ota update"""
        try:
            return PluginUpdate.ota_update()
        except Exception as e:
            decky.logger.error(e)
            return False

    # SDTDP
    async def get_sdtdp_cfg(self):
        """Get SDTDP config"""
        return SDTDP.get_config()

    async def is_sdtdp_cfg_present(self):
        """Check if SDTDP config is present"""
        return SDTDP.is_config_present()

    async def is_sdtdp_enabled(self):
        """Check if SDTDP is enabled"""
        return SDTDP.is_enabled()

    async def disable_sdtdp(self):
        """Disable SDTDP"""
        src = SDTDP.plugin_dir
        dst = decky.DECKY_PLUGIN_DIR + "/SimpleDeckyTDP"
        shutil.move(src, dst)
        decky.logger.info(f"Moved '{src}' to '{dst}'")
        return True

    # Miscelanea
    async def get_icon_for_app(self, app_id: str):
        """Get icon for app"""
        return MISCELANEA.get_icon_for_app(app_id)

    async def save_icon_for_app(self, app_id: str, img: str):
        """Save icon for app"""
        return MISCELANEA.save_icon_for_app(app_id, img)

    async def boot_bios(self):
        """Boot into BIOS/UEFI"""
        return MISCELANEA.boot_bios()

    async def boot_windows(self):
        """Boot into windows"""
        return MISCELANEA.boot_windows()

    async def windows_present(self):
        """Check if windows is installed"""
        return MISCELANEA.get_windows_uefi_entry() is not None
