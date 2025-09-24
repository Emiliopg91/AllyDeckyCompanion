# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods, disable=consider-using-with

import os
import shutil
from time import sleep
from plugin_config import PluginConfig
from plugin_logger import PluginLogger
from plugin_update import PluginUpdate
from utils.sdtdp import SdtdpUtils
from utils.hardware import Hardware
from utils.performance.cpu import CpuPerformance
from utils.performance.gpu import GpuPerformance
from utils.miscelanea import Miscelanea

import decky  # pylint: disable=import-error


class Plugin:
    """Plugin main class"""

    # Lifecycle

    async def _main(self):
        PluginLogger.configure_logger()
        decky.logger.info("Running " + decky.DECKY_PLUGIN_NAME)
        if not os.path.exists(Miscelanea.ICONS_PATH):
            os.makedirs(Miscelanea.ICONS_PATH, exist_ok=True)

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
        """Get polugin log file content"""
        decky.logger.debug("Executing: get_plugin_log()")
        return PluginLogger.get_plugin_log()

    # HARDWARE
    async def set_charge_limit(self, limit: int):
        """Set device charge limit"""
        Hardware.set_charge_limit(limit)

    async def set_mcu_powersave(self, enabled: bool):
        """Set MCU power save mode"""
        Hardware.set_mcu_powersave(enabled)

    # CPU
    async def set_governor(self, governor: str):
        """Set CPU governor"""
        return CpuPerformance.set_governor(governor)

    async def set_platform_profile(self, prof: str):
        """Set CPU platform profile"""
        CpuPerformance.set_platform_profile(prof)
        sleep(0.1)

    async def get_tdp_ranges(self):
        """Get CPU TDP ranges"""
        try:
            return CpuPerformance.get_tdp_ranges()
        except Exception as e:
            decky.logger.error(e)

    async def set_tdp(self, spl: int, sppl: int, fppl: int):
        """Set CPU TDP"""
        try:
            sleep(0.1)
            CpuPerformance.set_tdp("FAST", CpuPerformance.FTDP_FN, fppl)
            sleep(0.1)
            CpuPerformance.set_tdp("SLOW", CpuPerformance.STDP_FN, sppl)
            sleep(0.1)
            CpuPerformance.set_tdp("STEADY", CpuPerformance.CTDP_FN, spl)
            sleep(0.1)
        except Exception as e:
            decky.logger.error(e)

    async def set_cpu_boost(self, enabled: bool):
        """Set CPU boost"""
        CpuPerformance.set_cpu_boost(enabled)

    async def set_smt(self, enabled: bool):
        """Set CPU multithreading status"""
        CpuPerformance.set_smt(enabled)
        sleep(0.1)

    # GPU
    async def get_gpu_frequency_range(self):
        """Get GPU freq range"""
        return GpuPerformance.get_gpu_frequency_range()

    async def set_gpu_frequency_range(self, min_freq: int, max_freq: int):
        """Set GPU freq range"""
        return GpuPerformance.set_gpu_frequency_range(min_freq, max_freq)

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
        return SdtdpUtils.get_config()

    async def is_sdtdp_cfg_present(self):
        """Check if SDTDP config is present"""
        return SdtdpUtils.is_config_present()

    async def is_sdtdp_enabled(self):
        """Check if SDTDP is enabled"""
        return SdtdpUtils.is_enabled()

    async def disable_sdtdp(self):
        """Disable SDTDP"""
        src = SdtdpUtils.plugin_dir
        dst = decky.DECKY_PLUGIN_DIR + "/SimpleDeckyTDP"
        shutil.move(src, dst)
        decky.logger.info(f"Moved '{src}' to '{dst}'")
        return True

    # Miscelanea
    async def get_icon_for_app(self, app_id: str):
        """Get icon for app"""
        return Miscelanea.get_icon_for_app(app_id)

    async def save_icon_for_app(self, app_id: str, img: str):
        """Save icon for app"""
        return Miscelanea.save_icon_for_app(app_id, img)

    async def boot_bios(self):
        """Boot into BIOS/UEFI"""
        return Miscelanea.boot_bios()

    async def boot_windows(self):
        """Boot into windows"""
        return Miscelanea.boot_windows()

    async def windows_present(self):
        """Check if windows is installed"""
        return Miscelanea.get_windows_uefi_entry() is not None
