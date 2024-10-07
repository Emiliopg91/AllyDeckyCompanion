import os
import decky
import json

# Plugin directories and files

plugin_dir = decky.DECKY_PLUGIN_DIR + "/../SimpleDeckyTDP"
cfg_property_file = decky.DECKY_PLUGIN_SETTINGS_DIR + "/../SimpleDeckyTDP/settings.json"

def get_config(): 
    with open(cfg_property_file, "r") as jsonFile:
        return json.load(jsonFile)

def is_config_present():
    return os.path.exists(cfg_property_file)

def is_enabled():
    return os.path.exists(plugin_dir)