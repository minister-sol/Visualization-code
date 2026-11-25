#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
deb=$(realpath "$1")
stage=$(mktemp -d)
trap 'rm -rf -- "$stage"' EXIT
version=$(dpkg-deb -f "$deb" Version)
test "$(dpkg-deb -f "$deb" Package)" = codelens-desktop
test "$(dpkg-deb -f "$deb" Architecture)" = amd64
dpkg-deb -x "$deb" "$stage/payload"
python3 "$root/scripts/build_static.py" --verify "$stage/payload/opt/codelens/resources/app/site"
cat > "$stage/app.spec" <<EOF
%global __os_install_post %{nil}
%global _build_id_links none
Name: codelens-desktop
Version: $version
Release: 1
Summary: Offline algorithm and data structure visualizer
License: LicenseRef-CodeLens AND MIT AND BSD-3-Clause
BuildArch: x86_64
Requires: gtk3, nss, alsa-lib, mesa-libgbm, libXScrnSaver
%global __requires_exclude ^libffmpeg[.]so.*$
AutoProv: no
%description
CodeLens desktop visualizer with 77 offline topics.
%install
mkdir -p %{buildroot}
cp -a "$stage/payload/." %{buildroot}/
%files
%defattr(-,root,root,-)
/opt/codelens
/usr/share/applications/codelens.desktop
EOF
mkdir -p "$stage/rpmdb"
rpmbuild --dbpath "$stage/rpmdb" --define "_topdir $stage/build" --define "_rpmformat 4" --define "_binary_payload w3.gzdio" -bb "$stage/app.spec"
out="$root/artifacts/centos"
mkdir -p "$out"
cp "$stage"/build/RPMS/x86_64/*.rpm "$out/"
cd "$out"
pkg="codelens-desktop-$version-1.x86_64.rpm"
rpm --dbpath "$stage/rpmdb" -K "$pkg"
sha256sum "$pkg" > SHA256.txt
