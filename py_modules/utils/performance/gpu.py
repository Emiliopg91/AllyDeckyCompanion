import decky
import glob
import re
import time
import subprocess

class GpuPerformance:
  GPU_FREQUENCY_PATH = glob.glob("/sys/class/drm/card?/device/pp_od_clk_voltage")[0]
  GPU_LEVEL_PATH = glob.glob("/sys/class/drm/card?/device/power_dpm_force_performance_level")[0]

  GPU_FREQUENCY_RANGE = None

  @staticmethod
  def get_gpu_frequency_range():
    global GPU_FREQUENCY_RANGE
    if GPU_FREQUENCY_RANGE:
      return GPU_FREQUENCY_RANGE
    try:
      freq_string = open(GpuPerformance.GPU_FREQUENCY_PATH,"r").read()
      od_sclk_matches = re.findall(r"OD_RANGE:\s*SCLK:\s*(\d+)Mhz\s*(\d+)Mhz", freq_string)

      if od_sclk_matches:
        frequency_range = [int(od_sclk_matches[0][0]), int(od_sclk_matches[0][1])]
        GPU_FREQUENCY_RANGE = frequency_range
        return frequency_range
    except Exception as e:
      decky.logger.error(e)
      
  def execute_gpu_frequency_command(command):
    cmd = f"echo '{command}' | tee {GpuPerformance.GPU_FREQUENCY_PATH}"
    result = subprocess.run(cmd, shell=True, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

  @staticmethod
  def set_gpu_frequency_range(min:int, max:int):
    with open(GpuPerformance.GPU_LEVEL_PATH,'w') as file:
      file.write("manual")
      file.close()
    time.sleep(0.1)
    try:
      GpuPerformance.execute_gpu_frequency_command(f"s 0 {min}")
      GpuPerformance.execute_gpu_frequency_command(f"s 1 {max}")
      GpuPerformance.execute_gpu_frequency_command("c")
    except Exception as e:
      decky.logger.error(f"{__name__} error while trying to write frequency range")
      decky.logger.error(e)