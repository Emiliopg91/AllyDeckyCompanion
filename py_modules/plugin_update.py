# pylint: disable=missing-module-docstring, line-too-long, broad-exception-caught, too-few-public-methods, disable=consider-using-with

import os
import stat
import urllib.request
import json
import ssl
import subprocess
import shutil

import decky  # pylint: disable=import-error


class PluginUpdate:
    """Class for plugin update"""

    @staticmethod
    def recursive_chmod(path, perms):
        """Set chmod recursively"""
        for dirpath, _, filenames in os.walk(path):
            current_perms = os.stat(dirpath).st_mode
            os.chmod(dirpath, current_perms | perms)
            for filename in filenames:
                os.chmod(os.path.join(dirpath, filename), current_perms | perms)

    @staticmethod
    def download_latest_build():
        """Download latest version"""
        url = (
            "http://api.github.com/repos/Emiliopg91/AllyDeckyCompanion/releases/latest"
        )
        decky.logger.info("Downloading plugin update")
        gcontext = ssl.SSLContext()

        response = urllib.request.urlopen(url, context=gcontext)
        json_data = json.load(response)

        download_url = json_data.get("assets")[0].get("browser_download_url")

        file_path = f"/tmp/{decky.DECKY_PLUGIN_NAME}.tar.gz"

        with urllib.request.urlopen(download_url, context=gcontext) as response, open(
            file_path, "wb"
        ) as output_file:
            output_file.write(response.read())
            output_file.close()
        decky.logger.info("Downloaded!")

        return file_path

    @staticmethod
    def chown_recursive(path: str, uid: int, gid: int):
        os.chown(path, uid, gid)

        for root, dirs, files in os.walk(path):
            for d in dirs:
                os.chown(os.path.join(root, d), uid, gid)
            for f in files:
                os.chown(os.path.join(root, f), uid, gid)

    @staticmethod
    def ota_update():
        """Trigger OTA update"""
        downloaded_filepath = PluginUpdate.download_latest_build()

        if os.path.exists(downloaded_filepath):
            plugin_dir = f"{decky.DECKY_USER_HOME}/homebrew/plugins/AllyDeckyCompanion"

            try:
                PluginUpdate.recursive_chmod(plugin_dir, stat.S_IWUSR)
                shutil.rmtree(plugin_dir)
            except Exception as e:
                decky.logger.error(f"OTA error during removal of old plugin {e}")

            try:
                shutil.unpack_archive(
                    downloaded_filepath, f"{decky.DECKY_USER_HOME}/homebrew/plugins"
                )
                os.remove(downloaded_filepath)
                decky.logger.debug("Adjusting user and group id")
                PluginUpdate.chown_recursive(
                    f"{decky.DECKY_USER_HOME}/homebrew/plugins/AllyDeckyCompanion", 0, 0
                )
            except Exception as e:
                decky.logger.error(f"Error during OTA install {e}")

            return True

        return False
