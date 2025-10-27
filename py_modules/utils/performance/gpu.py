# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

import glob
import re
import time

import decky  # pylint: disable=import-error


class GpuPerformance:
    """Class for adjust GPU performance"""

    GPU_FREQUENCY_PATH = glob.glob("/sys/class/drm/card?/device/pp_od_clk_voltage")[0]
    GPU_LEVEL_PATH = glob.glob(
        "/sys/class/drm/card?/device/power_dpm_force_performance_level"
    )[0]

    GPU_FREQUENCY_RANGE = None

    def get_gpu_frequency_range(self):
        """Set GPU freq range"""
        if GpuPerformance.GPU_FREQUENCY_RANGE:
            return GpuPerformance.GPU_FREQUENCY_RANGE

        try:
            with open(GpuPerformance.GPU_FREQUENCY_PATH, "r") as f:
                freq_string = f.read()

            od_sclk_matches = re.findall(
                r"OD_RANGE:\s*SCLK:\s*(\d+)Mhz\s*(\d+)Mhz", freq_string
            )

            if od_sclk_matches:
                frequency_range = [
                    int(od_sclk_matches[0][0]),
                    int(od_sclk_matches[0][1]),
                ]
                GpuPerformance.GPU_FREQUENCY_RANGE = frequency_range
                return frequency_range
        except Exception as e:
            decky.logger.error(e)

        return [0, 0]

    def execute_gpu_frequency_command(self, command):
        """Execute GPU freq command"""
        with open(GpuPerformance.GPU_FREQUENCY_PATH, "w") as file:
            file.write(command)

    def set_gpu_frequency_range(self, min_freq: int, max_freq: int):
        """Set GPU freq range"""
        with open(GpuPerformance.GPU_LEVEL_PATH, "w") as file:
            file.write("manual")

        time.sleep(0.1)

        try:
            self.execute_gpu_frequency_command(f"s 0 {min_freq}")
            self.execute_gpu_frequency_command(f"s 1 {max_freq}")
            self.execute_gpu_frequency_command("c")
        except Exception as e:
            decky.logger.error(
                f"{__name__} error while trying to write frequency range"
            )
            decky.logger.error(e)


GPU_PERFORMANCE = GpuPerformance()
