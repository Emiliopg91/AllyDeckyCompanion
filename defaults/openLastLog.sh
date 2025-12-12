#!/usr/bin/env bash

clear

logdir="$HOME/homebrew/logs/AllyDeckyCompanion"
logfile=$(ls -Art "$logdir" 2>/dev/null | tail -n 1)
path="$logdir/$logfile"

if [[ -z "$logfile" ]]; then
    echo "No log file found in $logdir"
    exit 1
fi

cat "$path"
tail -c 0 -f "$path"