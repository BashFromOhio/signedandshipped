# Level 05 · Create and boot an emulator

**Difficulty** ★★★☆☆ · **Time** 15–30 min (1.5 GB image the first time) · **Sprint** 1 · **Ticket** MOB-103

## The story
Dana: *"No test phone on your first day. Make a virtual one, and make it the same way CI would: from the command line, with a name we can script."*

## Like I'm 10
An emulator is a pretend phone inside your computer. It behaves like a real phone, just slower to start.

## Run it
```bash
local/05-emulator.sh               # with a window
local/05-emulator.sh --headless    # no window (how CI runs it)
local/05-emulator.sh --stop
```

## What happens, step by step
1. It picks the right **system image** for your CPU: `x86_64` on Intel/AMD, `arm64-v8a` on Apple Silicon and ARM Linux.
2. `sdkmanager` installs `emulator` and `system-images;android-36;google_apis;<abi>` into `.tools/android-sdk`.
3. `avdmanager create avd -n routeready_api36 -d pixel_7` creates the virtual device. Because `ANDROID_USER_HOME` points into `.tools`, the AVD lives in **`.tools/android-user-home/avd`**, not `~/.android`.
4. It starts the emulator in the background (log: `.tools/emulator.log`), then `adb wait-for-device`.
5. It polls `getprop sys.boot_completed` until it says `1`. "Device connected" isn't the same as "Android finished booting", and CI scripts that skip this wait are flaky.

## Expected output
```
emulator pid 48213 (log: .tools/emulator.log). Waiting for Android to finish booting…
✓ booted: emulator-5554  Android 16
```

## Done when
`adb devices` lists `emulator-5554  device`.

## No emulator? Use a real phone instead
1. On the phone: Settings → About → tap **Build number** 7 times → Developer options → **USB debugging** on.
2. Plug it in and accept the "Allow USB debugging" prompt.
3. `source local/env.sh && adb devices` should show your phone.
4. A real phone can't use `10.0.2.2`. Run `adb reverse tcp:8080 tcp:8080` so the phone's `localhost:8080` reaches your computer, and build with `-ProutereadyApiBaseUrl=http://localhost:8080`, or edit `gradle.properties`.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `KVM is required` / extremely slow (Linux) | Virtualization off, or no permission | Enable VT-x/AMD-V in BIOS; `sudo usermod -aG kvm $USER` |
| Doesn't start on WSL | Nested virtualization/GUI limits | [windows-wsl.md](windows-wsl.md) |
| Times out at boot | Low RAM/CPU, or first boot is slow | Close apps; read `.tools/emulator.log`; try `--headless` |
| `PANIC: Missing emulator engine program` | Emulator package not installed | Re-run the script |

## Interview angle
**Q: "Your emulator UI tests are flaky in CI. Where do you start?"**
Wait for `sys.boot_completed`, not just `adb wait-for-device`. Disable animations. Use a fixed AVD definition. Capture `logcat` and a screenshot on failure. Quarantine a flaky test with a ticket and an owner rather than retrying until it's green (drill 8 in the game).

**Next:** [Level 06](level-06.md)
