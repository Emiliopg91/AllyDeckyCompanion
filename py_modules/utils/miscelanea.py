import base64
import mimetypes
import subprocess
import decky
import os
import re


class Miscelanea:
    ICONS_PATH = decky.DECKY_PLUGIN_RUNTIME_DIR + "/icons"

    @staticmethod
    def save_icon_for_app(appId, encoded_data):
        if "base64," in encoded_data:
            encoded_data = encoded_data.split(",")[1]

        decoded = base64.b64decode(encoded_data)

        file_name = Miscelanea.ICONS_PATH + "/" + appId + ".jpg"
        with open(file_name, "wb") as file:
            file.write(decoded)

    @staticmethod
    def get_icon_for_app(appId):
        file_name = Miscelanea.ICONS_PATH + "/" + appId + ".jpg"

        if not os.path.isfile(file_name):
            return None

        mime_type, _ = mimetypes.guess_type(file_name)

        with open(file_name, "rb") as file:
            image_bytes = file.read()
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        return f"data:{mime_type};base64,{image_base64}"

    @staticmethod
    def boot_bios():
        subprocess.run("systemctl reboot --firmware-setup", shell=True, check=False)

    @staticmethod
    def boot_windows():
        entry = Miscelanea.get_windows_uefi_entry()
        subprocess.run(f"efibootmgr -n {entry} && reboot", shell=True, check=False)

    @staticmethod
    def get_windows_uefi_entry():
        try:
            # Ejecutar el comando efibootmgr
            result = subprocess.run(
                ["efibootmgr"], capture_output=True, text=True, check=True
            )
            output = result.stdout

            # Expresión regular para encontrar la entrada de Windows Boot Manager
            match = re.search(r"Boot(\d{4})\*\s*Windows Boot Manager", output)

            if match:
                return match.group(1)  # Retorna solo el número de la entrada
            else:
                print("No se encontró la entrada de Windows Boot Manager.")
                return None

        except subprocess.CalledProcessError as e:
            print(f"Error al ejecutar efibootmgr: {e}")
            return None
