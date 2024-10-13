import os
import decky
import json

# Plugin directories and files
class SdtdpUtils:
    plugin_dir = decky.DECKY_PLUGIN_DIR + "/../SimpleDeckyTDP"
    cfg_property_file = decky.DECKY_PLUGIN_SETTINGS_DIR + "/../SimpleDeckyTDP/settings.json"

    @staticmethod
    def get_config(): 
        with open(SdtdpUtils.cfg_property_file, "r") as jsonFile:
            return json.load(jsonFile)

    @staticmethod
    def is_config_present():
        return os.path.exists(SdtdpUtils.cfg_property_file)

    @staticmethod
    def is_enabled():
        return os.path.exists(SdtdpUtils.plugin_dir)