#!/usr/bin/env bash
# Run from any directory with a verified Electron Linux release zip as argument.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
zip=$(realpath "$1")
name=$(basename "$zip")
expected=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))[sys.argv[2]])' "$root/desktop/node_modules/electron/checksums.json" "$name")
echo "$expected  $zip" | sha256sum --check
stage=$(mktemp -d)
trap 'rm -rf -- "$stage"' EXIT
app="$stage/opt/codelens"
mkdir -p "$app" "$stage/DEBIAN" "$stage/usr/share/applications"
python3 -m zipfile -e "$zip" "$app"
chmod 755 "$app/electron" "$app/chrome_crashpad_handler"
chmod 4755 "$app/chrome-sandbox"
mv "$app/electron" "$app/codelens"
mkdir -p "$app/resources/app"
cp "$root/desktop/"{main.cjs,package.json} "$app/resources/app/"
python3 "$root/scripts/build_static.py" --output "$app/resources/app/site"
version=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["version"])' "$root/desktop/package.json")
cat > "$stage/DEBIAN/control" <<EOF
Package: codelens-desktop
Version: $version
Architecture: amd64
Maintainer: CodeLens Project
Section: education
Priority: optional
Depends: libc6, libgtk-3-0, libnss3, libasound2 | libasound2t64, libxss1, libgbm1, libxkbcommon0, libx11-xcb1, libxshmfence1, libdrm2, libatk-bridge2.0-0, libatspi2.0-0, libxcomposite1, libxdamage1, libxrandr2, libcups2
Description: CodeLens offline algorithm and data structure visualizer
EOF
cat > "$stage/usr/share/applications/codelens.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=CodeLens
Comment=Offline algorithm and data structure visualizer
Exec=/opt/codelens/codelens
Icon=applications-education
Terminal=false
Categories=Education;ComputerScience;
EOF
out="$root/artifacts/linux"
mkdir -p "$out"
pkg="$out/codelens-desktop_${version}_amd64.deb"
dpkg-deb --root-owner-group -Zgzip -z3 --build "$stage" "$pkg"
(cd "$out" && sha256sum "$(basename "$pkg")" > SHA256.txt)
