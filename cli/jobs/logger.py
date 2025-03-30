from pathlib import Path
import json
import subprocess
from jobs.utils import Utils

class LoggerOpener:
    def __init__(self):
        self.plugin_name = Utils.plugin_name

        with open(Utils.deck_settings_json, 'r') as f:
            settings = json.load(f)
            self.deck_ip = settings.get('deckip')
            self.deck_port = settings.get('deckport')
            self.deck_user = settings.get('deckuser')
            self.deck_dir = '/home/' + self.deck_user

    def open(self):
        command = [
            "ssh", self.deck_user + "@" + self.deck_ip, "-p", str(self.deck_port),
            "-t", "-i", Utils.id_rsa_file,
            self.deck_dir + "/homebrew/plugins/" + self.plugin_name + "/openLastLog.sh"
        ]
        subprocess.run(command)
