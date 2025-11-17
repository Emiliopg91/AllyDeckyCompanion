import platform
import os

if "-cachyos-" in platform.uname().release.lower():
    if os.path.exists("/sys/class/firmware-attributes/asus-armoury"):
        from utils.performance.cpu.cpu_armoury import CPU_PERFORMANCE
    else:
        from utils.performance.cpu.cpu_ryzenadj import CPU_PERFORMANCE
else:
    from utils.performance.cpu.cpu_wmi import CPU_PERFORMANCE

__all__ = ["CPU_PERFORMANCE"]
