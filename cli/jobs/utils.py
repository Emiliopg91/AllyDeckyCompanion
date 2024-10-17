import os
import subprocess
from pathlib import Path

class Utils:
    plugin_dir = os.getcwd()
    plugin_name = os.path.basename(plugin_dir)
    log_dir = os.path.join(plugin_dir, "logs")
    plugin_package_json = os.path.join(plugin_dir, "package.json")
    deck_settings_json = os.path.join(plugin_dir, ".vscode", "deck-settings.json")
    id_rsa_file = os.path.join(Path.home(),".ssh","id_rsa")

    @staticmethod
    def handle_error(e, log_file):
        print("\nAn error has been produced: \n    "+str(e))
        print("Check logs at "+log_file)
        exit(1)

    @staticmethod
    def run_command(command, check, log_file):
        with open(log_file, 'a') as f:
            try:
                f.write("########################################################################\n")
                f.write(" ".join(command)+"\n\n\n")
                f.flush()
                result = subprocess.run(command, stderr=f, stdout=f)
                f.write("\n\nReturn code: "+str(result.returncode)+"\n")
                f.flush()
                if(check and result.returncode != 0):
                    raise Exception("Unexpected error code "+str(result.returncode))
                f.write("########################################################################")
                f.flush()
            except Exception as e:
                Utils.handle_error(e, log_file)
