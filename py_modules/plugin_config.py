import os
from pathlib import Path
import decky_plugin
import json

# Plugin directories and files
plugin_dir = Path(decky_plugin.DECKY_PLUGIN_DIR)
config_dir = Path(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR)

cfg_property_file = config_dir / "plugin.json"

def get_config(): 
    """
    Reads and parses the plugin configuration file.

    Returns:
    list: A list of key-value pairs representing the configuration.
    """
    with open(cfg_property_file, "r") as jsonFile:
        return json.load(jsonFile)

def set_config(key: str, value: str):
    """
    Sets a configuration key-value pair in the plugin configuration file.

    Parameters:
    key (str): The key to set.
    value (str): The value to set for the key.
    """
    with open(cfg_property_file, "r") as jsonFile:
        data = json.load(jsonFile)
    with open(cfg_property_file, "w") as f:
        data[key] = value
        json_object = json.dumps(data, indent=4)
        with open(cfg_property_file, "w") as outfile:
            outfile.write(json_object)


def get_config_item(name: str, default: str = None):
    """
    Retrieves a configuration item by name.

    Parameters:
    name (str): The name of the configuration item.
    default (str, optional): The default value if the item is not found. Defaults to None.

    Returns:
    str: The value of the configuration item.
    """
    with open(cfg_property_file, "r") as jsonFile:
        data = json.load(jsonFile)
        if "percentage" in data:
            return data[name]
        else:
            return default

def migrate():
    """
    Performs migration tasks if necessary, like creating directories and files, and setting default configurations.
    """
    if not config_dir.is_dir():
        os.makedirs(config_dir, exist_ok=True)
    if not cfg_property_file.is_file():
        cfg_property_file.touch()
        dictionary = {
            "log_level": "INFO"
        }
        json_object = json.dumps(dictionary, indent=4)
        with open(cfg_property_file, "w") as outfile:
            outfile.write(json_object)
