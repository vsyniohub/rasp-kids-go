# Debug Commands

## Check connected input devices on Raspberry Pi

```
cat /proc/bus/input/devices
```

Lists all input devices. Look for `DualSense` in the `Name` field.

## Check DualSense button presses (raw HID bytes)

Connect the DualSense via USB, then run:

```
sudo node -e "
const HID = require('node-hid');
const d = new HID.HID(0x054c, 0x0ce6);
d.on('data', data => {
  console.log([...data].slice(0, 16).map(b => b.toString(16).padStart(2,'0')).join(' '));
});
setTimeout(() => { d.close(); process.exit(); }, 10000);
"
```

Press buttons during the 10 seconds. The value at **byte 8** changes when face buttons are pressed:

| Button | Byte 8 value |
|--------|-------------|
| idle   | `08`        |
| ✕      | `28`        |
| □      | `18`        |
| △      | `88`        |
| ○      | `48`        |
