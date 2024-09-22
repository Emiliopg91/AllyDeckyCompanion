import decky
import glob
import re

GPU_FREQUENCY_PATH = glob.glob("/sys/class/drm/card?/device/pp_od_clk_voltage")[0]
GPU_LEVEL_PATH = glob.glob("/sys/class/drm/card?/device/power_dpm_force_performance_level")[0]

GPU_FREQUENCY_RANGE = None

def get_gpu_frequency_range():
  global GPU_FREQUENCY_RANGE
  if GPU_FREQUENCY_RANGE:
    return GPU_FREQUENCY_RANGE
  try:
    freq_string = open(GPU_FREQUENCY_PATH,"r").read()
    od_sclk_matches = re.findall(r"OD_RANGE:\s*SCLK:\s*(\d+)Mhz\s*(\d+)Mhz", freq_string)

    if od_sclk_matches:
      frequency_range = [int(od_sclk_matches[0][0]), int(od_sclk_matches[0][1])]
      GPU_FREQUENCY_RANGE = frequency_range
      return frequency_range
  except Exception as e:
    decky.logger.error(e)