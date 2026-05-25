const HID = require('node-hid');

const SONY_VENDOR_ID    = 0x054c;
const DUALSENSE_PRODUCT = 0x0ce6;

// Linux hidraw includes report ID at byte 0, shifting all offsets by 1
const B = process.platform === 'linux' ? 1 : 0;

const BUTTON_MAP = {
  square:   { byte: B,      mask: 0x10 },  // □
  cross:    { byte: B,      mask: 0x20 },  // ✕
  circle:   { byte: B,      mask: 0x40 },  // ○
  triangle: { byte: B,      mask: 0x80 },  // △
  options:  { byte: B + 10, mask: 0x20 },  // Options → quit
};

const ACTION_MAP = {
  cross:    'feed',
  circle:   'play',
  square:   'sleep',
  triangle: 'clean',
  options:  'quit',
};

// Keeps the device open for the full session — open once, reuse per action
class PadSession {
  constructor() {
    const found = HID.devices(SONY_VENDOR_ID, DUALSENSE_PRODUCT);
    if (!found.length) throw new Error('DualSense not found or not connected via USB');
    // Retry up to 5 times — macOS GCF may briefly hold the device
    let opened = false;
    for (let attempt = 0; attempt < 5 && !opened; attempt++) {
      for (const dev of found) {
        try {
          this.device = new HID.HID(dev.path);
          opened = true;
          break;
        } catch { /* try next */ }
      }
      if (!opened && attempt < 4) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
    if (!opened) throw new Error('DualSense found but could not be opened — check Input Monitoring permission');
    this.held = {};
    this.device.on('error', () => {}); // suppress unhandled error events
  }

  // Resolves with the action name on the next distinct button press
  waitForAction() {
    return new Promise((resolve) => {
      const onData = (data) => {
        if (process.env.DEBUG_PAD) {
          console.log([...data].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join(' '));
        }

        for (const [button, { byte, mask }] of Object.entries(BUTTON_MAP)) {
          const pressed = !!(data[byte] & mask);
          if (pressed && !this.held[button]) {
            this.held[button] = true;
            this.device.removeListener('data', onData);
            resolve(ACTION_MAP[button]);
            return;
          }
          if (!pressed) this.held[button] = false;
        }
      };

      this.device.on('data', onData);
    });
  }

  close() {
    try { this.device.close(); } catch { /* already closed */ }
  }
}

module.exports = { PadSession };
