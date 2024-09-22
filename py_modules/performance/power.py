import decky

EPP_FN = "/sys/firmware/acpi/platform_profile"

def set_platform_profile(prof: str):
    decky.logger.debug(f"Setting platform profile to '{prof}' by writing to {EPP_FN}")
    with open(EPP_FN, "w") as f:
        f.write(prof)