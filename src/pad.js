const fs         = require('fs');
const { execSync } = require('child_process');

const PS_PATTERN = /playstation|dualshock|dualsense|sony.*controller|wireless controller/i;

// ─── Linux (Raspberry Pi) ─────────────────────────────────────────────────────

function detectLinux() {
  const SYS_INPUT = '/sys/class/input';
  if (!fs.existsSync(SYS_INPUT)) return null;

  try {
    const entries = fs.readdirSync(SYS_INPUT);
    for (const entry of entries) {
      if (!entry.startsWith('js')) continue;

      const namePath = `${SYS_INPUT}/${entry}/device/name`;
      if (!fs.existsSync(namePath)) continue;

      const name = fs.readFileSync(namePath, 'utf8').trim();
      if (PS_PATTERN.test(name)) {
        return { device: `/dev/input/${entry}`, name };
      }
    }
  } catch {
    // No permission or unexpected FS structure — skip silently
  }

  return null;
}

// ─── macOS ────────────────────────────────────────────────────────────────────

function detectMac() {
  try {
    const output = execSync('system_profiler SPUSBDataType 2>/dev/null', {
      timeout: 6000,
    }).toString();

    for (const line of output.split('\n')) {
      // Device entries end with a colon, e.g. "    DualSense Wireless Controller:"
      if (line.trimEnd().endsWith(':') && PS_PATTERN.test(line)) {
        return { device: 'HID', name: line.trim().replace(/:$/, '') };
      }
    }
  } catch {
    // system_profiler unavailable or timed out — skip silently
  }

  return null;
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Detects a connected PlayStation controller on Linux or macOS.
 * Returns { device, name } if found, or null otherwise.
 */
function detectPlayStationPad() {
  if (process.platform === 'linux')  return detectLinux();
  if (process.platform === 'darwin') return detectMac();
  return null;
}

module.exports = { detectPlayStationPad };
