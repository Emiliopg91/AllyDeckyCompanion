import os
import json
import re
import subprocess
import getpass
import shutil
from pathlib import Path
from jobs.utils import Utils

class Setup:
    def __init__(self):
        # Obtiene la ruta del archivo desde la clase Utils
        self.settings_path = Utils.deck_settings_json
        self.log_dir = os.path.join(Utils.log_dir, "setup")
        self.log_key_copy = os.path.join(self.log_dir, "1-copy-rsa-key.log")

    def check_settings(self):
        if os.path.exists(self.log_dir):
            shutil.rmtree(self.log_dir)
        os.makedirs(self.log_dir)

        if not os.path.exists(Utils.id_rsa_file) or not os.path.exists(self.settings_path):
            print("Setting up project for deployment")
            if not os.path.exists(self.settings_path):
                self._create_settings() 
            if not os.path.exists(Utils.id_rsa_file):       
                self.generate_id_rsa()
            print("Setup finished")

    def _create_settings(self):
        print("  Creating deck-settings.json")
        while True:
            ip = input("    Deck's IP: ")
            if self.is_valid_ip(ip):
                break
            else:
                print("      Invalid IP, try again")
        while True:
            port = input("    Deck's SSH port (default 22): ") or "22"
            if port.isdigit() and self.is_valid_port(int(port)):
                break
            else:
                print("      Invalid port, try again")
        
        while True:
            user = input("    Deck's user (default 'deck'): ") or "deck"
            if len(user) > 0:
                break
            else:
                print("      Invalid user, try again")

        while True:
            cefPort = input("    Deck's CEF port (default 8081): ") or "8081"
            if cefPort.isdigit() and self.is_valid_port(int(cefPort)):
                break
            else:
                print("      Invalid port, try again")
        

        config_data = {
            "deckip": ip,
            "deckport": port,
            "deckuser": user,
            "deckcefport": cefPort,
        }

        with open(self.settings_path, 'w') as file:
            json.dump(config_data, file, indent=4)

    def generate_id_rsa(self):
        try:
            print("  Generating RSA key for SSH")
            Utils.run_command(["ssh-keygen", "-t", "rsa", "-f", Utils.id_rsa_file], True, self.log_key_copy)
            print("    SSH key generated. Ensure appending local '" + Utils.id_rsa_file + ".pub' to Deck's '~/.ssh/authorized_keys'")
            exit(0)
        except Exception as e:
            Utils.handle_error(e, self.log_key_copy)
            os.remove(Utils.id_rsa_file)
            os.remove(Utils.id_rsa_file + ".pub")    

    @staticmethod
    def is_valid_ip(ip):
        ip_pattern = re.compile(r"^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])"
                                r"(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$")
        return ip_pattern.match(ip) is not None

    @staticmethod
    def is_valid_port(port):
        return 1 <= port <= 65535
