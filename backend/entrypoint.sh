#!/bin/sh
set -e

echo "Generating backend"

cd /backend

echo "--- Building ryzenadj lib ---"
git clone https://github.com/FlyGoat/RyzenAdj /tmp/ryzenadj
cd /tmp/ryzenadj
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release .. || exit 1
make || exit 1
mv ryzenadj /backend/out/ryzenadj || exit 1
chmod +x /backend/out/ryzenadj || exit 1

cd /backend

echo "--- Cleaning up ---"
rm -rf ./ryzenadj

echo "Generated backend"