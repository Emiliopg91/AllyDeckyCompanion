import os
import subprocess
from pathlib import Path


class Utils:
    plugin_dir = os.getcwd()
    plugin_name = os.path.basename(plugin_dir)
    log_dir = os.path.join(plugin_dir, "logs")
    plugin_package_json = os.path.join(plugin_dir, "package.json")
    deck_settings_json = os.path.join(plugin_dir, ".vscode", "deck-settings.json")
    id_rsa_file = os.path.join(Path.home(), ".ssh", "id_rsa")

    @staticmethod
    def handle_error(e, log_file):
        print("\nAn error has been produced: \n    " + str(e))
        print("Check logs at " + log_file)
        exit(1)

    @staticmethod
    def run_command(command, check, log_file, password=None):
        try:
            cmd_str = "    " + (" ".join(command))
            if password is not None:
                cmd_str = cmd_str.replace(password, "*" * len(password))
            print(cmd_str, flush=True)

            with open(log_file, "a") as f:
                f.write("#" * 72 + "\n")
                f.write(" ".join(command) + "\n\n")

                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                )

                # leer línea por línea
                for line in process.stdout:
                    print("      " + line, end="", flush=True)  # mostrar por consola
                    f.write(line)  # escribir en log

                process.wait()

                f.write(f"\n\nReturn code: {process.returncode}\n")
                f.write("#" * 72 + "\n\n")
                f.flush()

                print(f"    Return code: {process.returncode}", flush=True)

                if check and process.returncode != 0:
                    raise Exception(f"Unexpected error code {process.returncode}")

        except Exception as e:
            Utils.handle_error(e, log_file)
