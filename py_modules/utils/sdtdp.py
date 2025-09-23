# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods , unspecified-encoding

import os
import json

import decky  # pylint: disable=import-error


# Plugin directories and files
class SdtdpUtils:
    """Class for managing SDTDP installation"""

    plugin_dir = decky.DECKY_PLUGIN_DIR + "/../SimpleDeckyTDP"
    cfg_property_file = (
        decky.DECKY_PLUGIN_SETTINGS_DIR + "/../SimpleDeckyTDP/settings.json"
    )

    @staticmethod
    def get_config():
        """Get SDTDP configuration"""
        with open(SdtdpUtils.cfg_property_file, "r") as json_file:
            return json.load(json_file)

    @staticmethod
    def is_config_present():
        """Check if SDTDP exists"""
        return os.path.exists(SdtdpUtils.cfg_property_file)

    @staticmethod
    def is_enabled():
        """Check if SDTDP is enabled"""
        return os.path.exists(SdtdpUtils.plugin_dir)
