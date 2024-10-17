import os
import json
import shutil
import hashlib
from jobs.utils import Utils

class Builder:
    def __init__(self):
        # Global variables
        self.plugin_dir = Utils.plugin_dir
        self.plugin_name = Utils.plugin_name
        self.plugin_backend_image = "decky/" + self.plugin_name.lower()
        self.plugin_backend_dir = os.path.join(self.plugin_dir, "backend")
        self.plugin_defaults_dir = os.path.join(self.plugin_dir, "defaults")
        self.plugin_py_dir = os.path.join(self.plugin_dir, "py_modules")
        self.plugin_main_py_file = os.path.join(self.plugin_dir, "main.py")
        self.plugin_backend_dockerfile_dir = os.path.join(self.plugin_backend_dir, "Dockerfile")
        self.plugin_backend_output_dir = os.path.join(self.plugin_backend_dir, "out")

        self.log_dir = os.path.join(Utils.log_dir, "build")
        self.log_clean_workspace = os.path.join(self.log_dir, "00-clean-workspace.log")
        self.log_build_frontend = os.path.join(self.log_dir, "01-frontend-build.log")
        self.log_binary_copy = os.path.join(self.log_dir, "02-remote-binary-copy.log")
        self.log_backend_build_backend = os.path.join(self.log_dir, "03-backend-build.log")
        self.log_copy_additional_files = os.path.join(self.log_dir, "04-copy-additional-files.log")
        self.log_package_plugin = os.path.join(self.log_dir, "05-package-plugin.log")

        self.build_out_base_dir = os.path.join(Utils.plugin_dir, "out")
        self.build_out_dir = os.path.join(self.build_out_base_dir, self.plugin_name)
        self.build_out_dist_dir = os.path.join(self.build_out_dir, "dist")
        self.build_dist_dir = os.path.join(self.plugin_dir, "dist")

    def _check_container_runtime(self):
        if shutil.which("docker"):
            return "docker"
        elif shutil.which("podman"):
            return "podman"
        else:
            print("Error: Neither Docker nor Podman is installed.")
            exit(1)

    def _clean_directories(self):
        print("  Cleaning workspace")
        os.makedirs(self.log_dir)

        if os.path.exists(self.build_out_base_dir) or os.path.exists(self.build_dist_dir):
            if os.path.exists(self.build_dist_dir):
                Utils.run_command(["rm", "-r", self.build_dist_dir], True, self.log_clean_workspace)
            if os.path.exists(self.build_out_base_dir):
                Utils.run_command(["rm", "-r", self.build_out_base_dir], True, self.log_clean_workspace)

    def _build_frontend(self):
        print("  Building frontend")
        Utils.run_command(["pnpm", "install", "--no-frozen-lockfile"], True, self.log_build_frontend)
        Utils.run_command(["pnpm", "run", "build"], True, self.log_build_frontend)
        Utils.run_command(["mkdir", "-p", self.build_out_dist_dir], False, self.log_build_frontend)
        Utils.run_command(["cp", "-r", self.build_dist_dir + "/.", self.build_out_dist_dir], True, self.log_build_frontend)

    def _build_backend(self):
        print("  Building backend")
        if os.path.exists(self.plugin_backend_dir) and os.path.exists(self.plugin_backend_dockerfile_dir):
            if os.path.exists(self.plugin_backend_output_dir):
                Utils.run_command(["rm", "-r", self.plugin_backend_output_dir], True, self.log_backend_build_backend)
            Utils.run_command(["mkdir", "-p", self.plugin_backend_output_dir], False, self.log_backend_build_backend)
            Utils.run_command([self.plugin_cp, "build", "-f", self.plugin_backend_dockerfile_dir, "-t", self.plugin_backend_image, self.plugin_dir], True, self.log_backend_build_backend)
            Utils.run_command(["chmod", "-R", "777", self.plugin_dir], True, self.log_backend_build_backend)
            Utils.run_command([self.plugin_cp, "run", "--rm", "-e", "RELEASE_TYPE=production", "--privileged",
                            "-v", self.plugin_backend_dir + ":/backend",
                            "-v", self.plugin_backend_output_dir + ":/backend/out",
                            "-v", self.plugin_dir + ":/plugin", self.plugin_backend_image], True, self.log_backend_build_backend)
            Utils.run_command(["cp", "-r", self.plugin_backend_output_dir + "/.", self.build_out_dir], True, self.log_backend_build_backend)

    def _copy_additional_files(self):
        print("  Copying additional files")
        Utils.run_command(["cp", "-r", self.plugin_defaults_dir + "/.", self.build_out_dir], True, self.log_copy_additional_files)
        Utils.run_command(["cp", "-r", self.plugin_py_dir, os.path.join(self.build_out_dir, "py_modules")], True, self.log_copy_additional_files)
        Utils.run_command(["cp", self.plugin_main_py_file, self.build_out_dir], True, self.log_copy_additional_files)
        Utils.run_command(["cp", os.path.join(self.plugin_dir, "LICENSE"), self.build_out_dir], True, self.log_copy_additional_files)
        Utils.run_command(["cp", os.path.join(self.plugin_dir, "README.md"), self.build_out_dir], True, self.log_copy_additional_files)
        Utils.run_command(["cp", os.path.join(self.plugin_dir, "package.json"), self.build_out_dir], True, self.log_copy_additional_files)
        Utils.run_command(["cp", os.path.join(self.plugin_dir, "plugin.json"), self.build_out_dir], True, self.log_copy_additional_files)

    def _copy_remote_binaries(self):
        with open(self.log_binary_copy, 'a') as log_file:
            print("  Copying remote binaries")
            if not os.path.exists(Utils.plugin_package_json):
                log_file.write("    Failed to read " + Utils.plugin_package_json + "\n")
                exit(1)

            with open(Utils.plugin_package_json) as f:
                package_data = json.load(f)

            remote_binaries = package_data.get("devRemoteBinaries", [])
            if not remote_binaries:
                return

            for binary in remote_binaries:
                url = binary.get('url', '')
                expected_checksum = binary.get('sha256hash', '')
                dest_filename = binary.get('name', '')
                print("    " + os.path.basename(url))
                log_file.write("    " + os.path.basename(url) + "\n")

                if not url or not expected_checksum or not dest_filename:
                    log_file.write("      Error: Missing fields in devRemoteBinaries configuration\n")
                    exit(1)

                dest_file_path = os.path.join(self.plugin_dir, dest_filename)

                if os.path.exists(dest_file_path):
                    actual_checksum = hashlib.sha256(open(dest_file_path, 'rb').read()).hexdigest()
                    if actual_checksum == expected_checksum:
                        print("      File already exists and checksums match: " + dest_file_path)
                        continue
                    else:
                        print("      Checksum mismatch for existing file, removing: " + dest_file_path)
                        os.remove(dest_file_path)

                print("      Downloading binary from: " + url)
                log_file.write("      Downloading binary from: " + url + "\n")

                Utils.run_command(["wget", "-q", "-O", dest_file_path, url], True, self.log_binary_copy)

                actual_checksum = hashlib.sha256(open(dest_file_path, 'rb').read()).hexdigest()

                if actual_checksum == expected_checksum:
                    print("        File saved to " + dest_file_path)
                else:
                    print("        Error: Checksums do not match for file at URL: " + url + ". Expected: " + expected_checksum + ", Got: " + actual_checksum)
                    log_file.write("        Error: Checksums do not match for file at URL: " + url + ". Expected: " + expected_checksum + ", Got: " + actual_checksum + "\n")
                    exit(1)

    def _package_plugin(self):
        print("  Packaging plugin")
        os.chdir(self.build_out_base_dir)
        try:
            Utils.run_command(["tar", "-czvf", self.plugin_name + ".tar.gz", self.plugin_name], True, self.log_package_plugin)
            Utils.run_command(["zip", "-r", self.plugin_name + ".zip", self.plugin_name], True, self.log_package_plugin)
        except Exception as e:
            os.chdir(self.plugin_dir)
        os.chdir(self.plugin_dir)

    def build(self):
        print("Building plugin " + self.plugin_name)
        self.plugin_cp = self._check_container_runtime()
        self._clean_directories()
        self._build_frontend()
        self._copy_remote_binaries()
        self._build_backend()
        self._copy_additional_files()
        self._package_plugin()
        print("Build successful")
