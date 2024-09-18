import os
from pathlib import Path
import decky
import json

# Plugin directories and files
plugin_dir = Path(decky.DECKY_PLUGIN_DIR)
config_dir = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)

cfg_property_file = config_dir / "plugin.json"

def flatten_json(nested_json, parent_key=''):
    """
    Aplana un JSON jerárquico.

    Args:
    nested_json (dict): El JSON original con jerarquía.
    parent_key (str): La clave base usada durante la recursión (para claves padres).

    Returns:
    dict: Un diccionario con claves jerarquizadas usando el separador.
    """
    items = {}
    for key, value in nested_json.items():
        new_key = parent_key + '.' + key if parent_key else key
        if isinstance(value, dict):
            # Recursión si el valor es otro diccionario
            items.update(flatten_json(value, new_key))
        else:
            items[new_key] = value
    return items

def get_config(): 
    """
    Reads and parses the plugin configuration file.

    Returns:
    list: A list of key-value pairs representing the configuration.
    """
    with open(cfg_property_file, "r") as jsonFile:
        config_data = json.load(jsonFile)

    # Inicializamos el diccionario plano
    flat_config = {}

    # Función inline para recorrer el JSON recursivamente y aplanarlo
    stack = [(config_data, '')]  # Pila con el JSON inicial y la clave vacía
    while stack:
        current, parent_key = stack.pop()

        for key, value in current.items():
            new_key = parent_key + '.' + key if parent_key else key

            if isinstance(value, dict):
                # Si el valor es otro diccionario, lo añadimos a la pila para seguir recorriendo
                stack.append((value, new_key))
            else:
                # Si es un valor simple, lo agregamos al diccionario plano
                flat_config[new_key] = value

    return flat_config

def set_config(key: str, value: str):
    """
    Sets a configuration key-value pair in the plugin configuration file.

    Parameters:
    key (str): The key to set.
    value (str): The value to set for the key.
    """
    with open(cfg_property_file, "r+") as jsonFile:
        data = json.load(jsonFile)
        
        keys = key.split(".")
        d = data
        
        for k in keys[:-1]:
            if k not in d:
                d[k] = {}
            d = d[k]
        
        d[keys[-1]] = value

        jsonFile.seek(0)
        json.dump(data, jsonFile, indent=4)
        jsonFile.truncate()


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
        
        keys = name.split(".")
        d = data
        
        for k in keys:
            if k in d:
                d = d[k]
            else:
                return default
        
        return d

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
