#!/usr/bin/env bash
# Sign and verify the CodeLens release checksum file (Linux / macOS)
#
# Usage:
#   ./scripts/sign-release.sh release/SHA256SUMS-1.1.0.txt artifacts
#
# Steps:
#   1. verify every listed artifact under the artifacts root, tolerating CRLF
#      line endings and directory prefixes in the checksum file;
#   2. write a detached ASCII-armor signature next to the checksum file.
#
# The signature always covers the file exactly as it will be published, so
# `gpg --verify <sums>.asc <sums>` reproduces on any platform.
#
# Optional package-level signatures are not run by default, because they change
# the package bytes and therefore the SHA-256 that the checksum file lists:
#   debsigs --sign=origin -k <key-id> codelens-desktop_1.1.0_amd64.deb
#   rpm --addsign codelens-desktop-1.1.0-1.x86_64.rpm

set -euo pipefail

SUMS=${1:-release/SHA256SUMS-1.1.0.txt}
ROOT=${2:-artifacts}

if [ ! -f "$SUMS" ]; then
  echo "checksum file not found: $SUMS" >&2
  exit 1
fi

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
tr -d '\r' < "$SUMS" | sed -E 's#^([0-9a-fA-F]{64})[[:space:]]+.*/([^/]+)$#\1  \2#' > "$tmp"

checked=0
while read -r hash name; do
  [ -n "${hash:-}" ] || continue
  path=$(find "$ROOT" -type f -name "$name" | head -n 1)
  if [ -z "$path" ]; then
    echo "artifact not found under $ROOT: $name" >&2
    exit 1
  fi
  actual=$(sha256sum "$path" | cut -d' ' -f1)
  if [ "$actual" != "$(echo "$hash" | tr 'A-F' 'a-f')" ]; then
    echo "hash mismatch for $name: expected $hash got $actual" >&2
    exit 1
  fi
  echo "OK  $name  $actual"
  checked=$((checked + 1))
done < "$tmp"

gpg --batch --yes --armor --detach-sign -o "$SUMS.asc" "$SUMS"
gpg --batch --verify "$SUMS.asc" "$SUMS"

echo "verified $checked files; signature written to $SUMS.asc"
echo "publish $SUMS and $SUMS.asc together so users can run: gpg --verify $SUMS.asc $SUMS"
