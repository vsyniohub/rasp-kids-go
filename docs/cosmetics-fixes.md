# Cosmetics Fixes

## 1. Message banner — fixed width

**Problem:** The action result message (e.g. `□  Zzz... Robobo is having sweet dreams!`) can be longer than the box inner width (W=38), pushing the right border out of alignment.

**Expected:**
```
╠══════════════════════════════════════╣
║  □  Zzz... Robobo is having sweet d… ║
╚══════════════════════════════════════╝
```

**Fix:** Truncate or wrap the message text to fit within W=38 characters before rendering, and always pad the remainder so the right border stays fixed.
