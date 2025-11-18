import os
from pathlib import Path
import getpass
import json
import shutil
from jobs.utils import Utils


class Deployer:
    def __init__(self):
        self.plugin_dir = Utils.plugin_dir
        self.plugin_name = Utils.plugin_name
        self.output_root = os.path.join(self.plugin_dir, "out")

        self.log_dir = os.path.join(Utils.log_dir, "deploy")
        self.log_permissions = os.path.join(self.log_dir, "01-setting-permissions.log")
        self.log_clearing = os.path.join(self.log_dir, "02-clearing-folder.log")
        self.log_deploying = os.path.join(self.log_dir, "03-deploying-plugin.log")
        self.log_restart_decky = os.path.join(self.log_dir, "04-restart-decky.log")

        with open(Utils.deck_settings_json, "r") as f:
            settings = json.load(f)
            self.deck_ip = settings.get("deckip")
            self.deck_port = settings.get("deckport")
            self.deck_user = settings.get("deckuser")
            self.deck_dir = "/home/" + self.deck_user

    def _get_deck_password(self):
        while True:
            self.deck_pass = getpass.getpass(
                "  Enter password for " + self.deck_user + "@" + self.deck_ip + ": "
            )
            if self.deck_pass:
                break
            print("    Password cannot be empty. Please try again.")

    def _clean_directories(self):
        print("  Cleaning workspace", flush=True)
        if os.path.exists(self.log_dir):
            shutil.rmtree(self.log_dir)
        os.makedirs(self.log_dir)

    def _clearing_folder(self):
        print("  Clearing folders", flush=True)
        Utils.run_command(
            [
                "ssh",
                "-p",
                str(self.deck_port),
                f"{self.deck_user}@{self.deck_ip}",
                f"mkdir -p {self.deck_dir}/homebrew/plugins/{self.plugin_name}",
            ],
            False,
            self.log_clearing,
        )

    def _chmod_folders(self):
        print("  Setting folder permissions", flush=True)
        Utils.run_command(
            [
                "ssh",
                "-p",
                str(self.deck_port),
                f"{self.deck_user}@{self.deck_ip}",
                f"echo '{self.deck_pass}' | sudo -S -p '' chmod -R 777 {self.deck_dir}/homebrew/plugins",
            ],
            True,
            self.log_permissions,
            self.deck_pass,
        )

    def _deploy_plugin(self):
        print("  Deploying plugin", flush=True)
        Utils.run_command(
            [
                "rsync",
                "-azp",
                "--delete",
                "--chmod=D0755,F0755",
                f"{self.output_root}/{self.plugin_name}",
                f"{self.deck_user}@{self.deck_ip}:{self.deck_dir}/homebrew/plugins",
            ],
            False,
            self.log_deploying,
        )

    def _restart_decky(self):
        print("  Restarting Decky", flush=True)
        Utils.run_command(
            [
                "ssh",
                "-p",
                str(self.deck_port),
                f"{self.deck_user}@{self.deck_ip}",
                f"echo '{self.deck_pass}' | sudo -S -p '' systemctl restart plugin_loader.service",
            ],
            False,
            self.log_restart_decky,
            self.deck_pass,
        )

    def deploy(self):
        print("Deploying plugin " + self.plugin_name, flush=True)
        self._get_deck_password()
        self._clean_directories()
        self._clearing_folder()
        self._chmod_folders()
        self._deploy_plugin()
        self._restart_decky()
        print("Deployment finished")
