#!/usr/bin/bash
# does the following:
# - AllyDeckyCompanion Decky Plugin
if [ "$EUID" -eq 0 ]
  then echo "Please do not run as root"
  exit
fi


echo "Removing previous install if it exists"

cd $HOME

sudo rm -rf $HOME/homebrew/plugins/AllyDeckyCompanion

echo "Installing AllyDeckyCompanion for ROG Ally Series control"
# download + install simple decky tdp
curl -L $(curl -s https://api.github.com/repos/Emiliopg91/AllyDeckyCompanion/releases/latest | grep "browser_download_url" | cut -d '"' -f 4) -o $HOME/AllyDeckyCompanion.tar.gz
sudo tar -xzf AllyDeckyCompanion.tar.gz -C $HOME/homebrew/plugins

# Install complete, remove build dir
rm  $HOME/AllyDeckyCompanion.tar.gz
sudo systemctl restart plugin_loader.service

echo "Installation complete"
