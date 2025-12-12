import platform

if "-cachyos-" in platform.uname().release.lower():
    from utils.performance.cpu.cpu_armoury import CPU_PERFORMANCE
else:
    from utils.performance.cpu.cpu_wmi import CPU_PERFORMANCE

__all__ = ["CPU_PERFORMANCE"]
