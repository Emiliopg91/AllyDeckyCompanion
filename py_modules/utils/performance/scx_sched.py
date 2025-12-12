import json
import shutil
import subprocess
import os

import decky  # pylint: disable=import-error


class ScxSched:
    """Class for management of schedulers"""

    SCHEDULERS_CONFIG = {
        "bpfland": "-m performance",
        "flash": "-m all",
        "lavd": "--performance",
    }

    def __init__(self):
        self.__schedulers = []
        self.__initial: str = None
        self.__current: str = None

        if shutil.which("scxctl"):
            output = (
                subprocess.run(
                    ["scxctl", "list"], capture_output=True, text=True, check=True
                )
                .stdout.strip()
                .replace("supported schedulers: ", "")
            )

            data = json.loads(output)
            self.__schedulers = [v for v in data if v in self.SCHEDULERS_CONFIG]
            decky.logger.info(
                f"Supported {len(self.__schedulers)} schedulers: {self.__schedulers}"
            )

            output = (
                subprocess.run(
                    ["scxctl", "get"], capture_output=True, text=True, check=True
                )
                .stdout.strip()
                .replace("supported schedulers: ", "")
            )
            if output.startswith("running"):
                self.__current = output.split(" ")[1].lower()
                self.__initial = self.__current
                decky.logger.info(f"Default scheduler: {self.__initial}")
            else:
                decky.logger.info("No default scheduler")

    def start(self, scheduler: str):
        """Start new scheduler run"""
        if self.__current == scheduler:
            return

        action = "start"
        if self.__current is not None:
            action = "switch"

        command = [
            "scxctl",
            action,
            "--sched",
            scheduler,
            f'--args={self.SCHEDULERS_CONFIG[scheduler]}',
        ]

        if subprocess.run(command, check=True).returncode == 0:
            self.__current = scheduler

    def stop(self):
        """Stop running scheduler"""
        if self.__current is None:
            return

        if subprocess.run(["scxctl", "stop"], check=True).returncode == 0:
            self.__current = None

    @property
    def available(self):
        """Get available schedulers"""
        return self.__schedulers

    @property
    def default_name(self):
        """Get default scheduler name"""
        path = "/proc/sys/kernel/sched_bore"
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                if f.read().strip() == "1":
                    return "bore"

        return "eevdf"


SCX_SCHED = ScxSched()
