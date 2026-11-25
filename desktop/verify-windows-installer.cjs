const { execFileSync } = require('node:child_process')

module.exports = async function verifyWindowsInstallers(result) {
  if (process.platform !== 'win32') return []
  for (const installer of result.artifactPaths.filter(path => /\.exe$/i.test(path))) {
    // Set an explicit label on the final file even if its directory inherits Low.
    execFileSync('icacls.exe', [installer, '/setintegritylevel', 'M'], { stdio: 'inherit' })
    execFileSync('icacls.exe', [installer], { stdio: 'inherit' })
  }
  return []
}
