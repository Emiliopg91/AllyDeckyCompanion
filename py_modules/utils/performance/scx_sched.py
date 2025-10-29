import json
import shutil
import subprocess
import time

import decky  # pylint: disable=import-error


class ScxSched:

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
                subprocess.run(["scxctl", "list"], capture_output=True, text=True)
                .stdout.strip()
                .replace("supported schedulers: ", "")
            )

            data = json.loads(output)
            self.__schedulers = [v for v in data if v in self.SCHEDULERS_CONFIG]
            decky.logger.info(
                f"Supported {len(self.__schedulers)} schedulers: {self.__schedulers}"
            )

            output = (
                subprocess.run(["scxctl", "get"], capture_output=True, text=True)
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
        if self.__current == scheduler:
            return

        action = "start"
        if self.__current is not None:
            action = "switch"

        command = ["scxctl", action, "--sched", scheduler]

        if subprocess.run(command).returncode == 0:
            self.__current = scheduler

    def stop(self):
        if self.__current == None:
            return

        if subprocess.run(["scxctl", "stop"]).returncode == 0:
            self.__current = None

    @property
    def available(self):
        return self.__schedulers


SCX_SCHED = ScxSched()

SCX_SCHED.start("lavd")
time.sleep(3)
SCX_SCHED.start("bpfland")
time.sleep(3)
SCX_SCHED.stop()
