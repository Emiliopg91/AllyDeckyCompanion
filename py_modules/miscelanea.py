import requests
import base64
import mimetypes
import decky
import os

ICONS_PATH = decky.DECKY_PLUGIN_RUNTIME_DIR + "/icons"

def save_icon_for_app(appId, encoded_data):
    if "base64," in encoded_data:
        encoded_data = encoded_data.split(",")[1]

    decoded = base64.b64decode(encoded_data)

    file_name = ICONS_PATH + "/" + appId + ".jpg"
    with open(file_name, "wb") as file:
        file.write(decoded)

def get_icon_for_app(appId):
    file_name = ICONS_PATH + "/" + appId + ".jpg"

    if not os.path.isfile(file_name):
        return None

    mime_type, _ = mimetypes.guess_type(file_name)
    
    with open(file_name, "rb") as file:
        image_bytes = file.read()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
    return f"data:{mime_type};base64,{image_base64}"