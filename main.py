# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods, disable=consider-using-with

import os
from time import sleep
from plugin_config import PluginConfig
from plugin_logger import PluginLogger
from plugin_update import PluginUpdate
from utils.hardware import HARDWARE
from utils.performance.cpu import CPU_PERFORMANCE
from utils.performance.gpu import GPU_PERFORMANCE
from utils.performance.scx_sched import SCX_SCHED
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

    async def is_ac_connected(self):
        """Check if AC is online"""
        return HARDWARE.is_ac_connected()

    # CPU
    async def set_epp(self, epp: str):
        """Set CPU epp"""
        return CPU_PERFORMANCE.set_epp(epp)

    async def set_platform_profile(self, prof: str):
        """Set CPU platform profile"""
        CPU_PERFORMANCE.set_platform_profile(prof)
        sleep(0.1)

    async def get_cpu_impl(self):
        """Set CPU manager id"""
        return CPU_PERFORMANCE.get_impl_id()

    async def get_tdp_ranges(self):
        """Get CPU TDP ranges"""
        try:
            return CPU_PERFORMANCE.get_tdp_ranges()
        except Exception as e:
            decky.logger.error(e)

    async def set_tdp(self, spl: int, sppl: int, fppl: int):
        """Set CPU TDP"""
        try:
            CPU_PERFORMANCE.set_tdp(spl, sppl, fppl)
        except Exception as e:
            decky.logger.error(e)

    async def set_cpu_boost(self, enabled: bool):
        """Set CPU boost"""
        CPU_PERFORMANCE.set_cpu_boost(enabled)

    async def set_smt(self, enabled: bool):
        """Set CPU multithreading status"""
        CPU_PERFORMANCE.set_smt(enabled)
        sleep(0.1)

    async def renice(self, pid: int):
        """Renice processes"""
        CPU_PERFORMANCE.renice(pid)

    async def get_cores_count(self):
        """Get CPU cores count"""
        return CPU_PERFORMANCE.get_cores_count()

    async def enable_cores(self, p_cores, e_cores, smt):
        """Enable CPU Cores"""
        return CPU_PERFORMANCE.enable_cores(p_cores, e_cores, smt)

    # Schedulers
    async def get_schedulers(self):
        """Get all available schedulers"""
        return SCX_SCHED.available

    async def set_scheduler(self, scheduler: str):
        """Activate scheduler"""
        SCX_SCHED.start(scheduler)

    async def stop_scheduler(self):
        """Stop scheduler if running"""
        SCX_SCHED.stop()

    async def get_default_sched_name(self):
        """Get default sched name"""
        return SCX_SCHED.default_name

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

    # Miscelanea
    async def get_icon_for_app(self, app_id: int):
        """Get icon for app"""
        return MISCELANEA.get_icon_for_app(app_id)

    async def save_icon_for_app(self, app_id: int, img: str):
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
