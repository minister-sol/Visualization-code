# Sign and verify the CodeLens release checksum file (Windows / PowerShell 7)
#
# Usage:
#   pwsh -File scripts/sign-release.ps1 -SumsFile release/SHA256SUMS-1.1.0.txt -ArtifactsRoot artifacts
#
# Behaviour:
#   1. parses each "<sha256>  <name>" line of the checksum file;
#   2. locates <name> under the artifacts root (recursively) and re-hashes it;
#   3. fails on any mismatch, so a signature is never produced for the wrong bytes;
#   4. writes <SumsFile>.asc next to the checksum file with a detached ASCII-armor signature.
#
# The private key must already exist in the local GnuPG keyring.

param(
  [Parameter(Mandatory = $true)][string]$SumsFile,
  [string]$ArtifactsRoot = 'artifacts',
  [string]$Gpg = '',
  [string]$KeyFingerprint = ''
)

$ErrorActionPreference = 'Stop'

if (-not $Gpg) {
  $candidates = @(
    'C:\Program Files\GnuPG\bin\gpg.exe',
    'C:\Program Files (x86)\GnuPG\bin\gpg.exe'
  )
  $Gpg = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if (-not $Gpg) { throw 'gpg.exe not found; install GnuPG first (winget install GnuPG.GnuPG)' }
}

$sumsPath = (Resolve-Path -LiteralPath $SumsFile).Path
$root = (Resolve-Path -LiteralPath $ArtifactsRoot).Path

$lines = Get-Content -LiteralPath $sumsPath | Where-Object { $_ -match '^[0-9a-fA-F]{64}\s{1,}\S' }
if (-not $lines) { throw "no checksum lines found in $sumsPath" }

$checked = 0
foreach ($line in $lines) {
  $hash = ($line -split '\s{1,}', 2)[0].ToLower()
  $name = ($line -split '\s{1,}', 2)[1].Trim()
  $leaf = Split-Path -Leaf $name

  $matches = Get-ChildItem -LiteralPath $root -Recurse -File -Filter $leaf | Select-Object -First 1
  if (-not $matches) { throw "artifact not found under ${root}: $name" }

  $actual = (Get-FileHash -LiteralPath $matches.FullName -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $hash) { throw "hash mismatch for $name : expected $hash, got $actual" }
  "OK  $name  $actual"
  $checked++
}

& $Gpg --batch --yes --armor --detach-sign -o "$sumsPath.asc" $sumsPath
if ($LASTEXITCODE -ne 0) { throw 'gpg detach-sign failed' }

& $Gpg --batch --verify "$sumsPath.asc" $sumsPath 2>&1 | ForEach-Object { $_ }
if ($LASTEXITCODE -ne 0) { throw 'gpg verify failed' }

$signer = (& $Gpg --batch --list-packets "$sumsPath.asc" 2>&1 | Select-String -Pattern 'keyid' | Select-Object -First 1).ToString()
"verified=$checked files; signature written to $sumsPath.asc"
"signer: $signer"
if ($KeyFingerprint) {
  $fpr = (& $Gpg --batch --with-colons --fingerprint $KeyFingerprint 2>&1 | Select-String -Pattern '^fpr:' | Select-Object -First 1).ToString()
  "expected key: $fpr"
}
