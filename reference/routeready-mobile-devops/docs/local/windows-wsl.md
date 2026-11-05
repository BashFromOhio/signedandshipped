# Windows and WSL

The scripts are Bash, so on Windows they run inside **WSL** (Windows Subsystem for Linux), the same Linux CI uses.

## 1. Install WSL (once)
PowerShell **as Administrator**:
```powershell
wsl --install -d Ubuntu
```
Restart, open **Ubuntu** from the Start menu, and create a Linux username.

## 2. Clone inside Linux, not on C:
```bash
sudo apt-get update && sudo apt-get install -y curl unzip git python3
cd ~ && git clone <your-repo-url> routeready-mobile-devops && cd routeready-mobile-devops
local/00-doctor.sh
```
Keep the repo in your Linux home (`~`). Working under `/mnt/c/...` is many times slower for Gradle and npm.

## 3. What works in WSL
| Level | In WSL? | Notes |
|---|---|---|
| 00–04 | Yes | JDK, SDK, Gradle, API, debug build |
| 05 emulator | Usually **no** | The emulator needs hardware virtualization with a display; see below |
| 06–08 | Yes, with a device | Use a Windows-side emulator or a USB phone (below) |
| 09 | Yes | `sudo apt-get install -y ruby-full build-essential` |
| 10 iOS | **No** | Needs a Mac. Mark BLOCKED |
| 11 | Yes, with a device | Same device options |

## 4. Getting a device to WSL's adb
**Option A: Android Studio's emulator on Windows (simplest)**
1. Install Android Studio **on Windows**, create an emulator in Device Manager, and start it.
2. In PowerShell: `adb kill-server; adb -a -P 5037 nodaemon server` (leave that window open). `-a` lets other machines, including WSL, connect.
3. In WSL, point adb at the Windows server:
   ```bash
   export ADB_SERVER_SOCKET=tcp:$(ip route show default | awk '{print $3}'):5037
   source local/env.sh && adb devices
   ```
   The WSL `adb` version should match Windows' closely. If it doesn't, use the same platform-tools release on both.
4. The emulator on Windows reaches Windows' localhost via `10.0.2.2`. With WSL2 mirrored networking (Windows 11: `networkingMode=mirrored` in `%UserProfile%\.wslconfig`), the API in WSL is reachable at Windows' localhost, so `10.0.2.2:8080` works unchanged.

**Option B: a real phone over USB**
Install [usbipd-win](https://github.com/dorssel/usbipd-win), then `usbipd list` / `usbipd bind --busid X-Y` / `usbipd attach --wsl --busid X-Y` in an admin PowerShell. The phone then appears in WSL's `adb devices`. Use `adb reverse tcp:8080 tcp:8080` and a `localhost` API URL (see [Level 05](level-05.md)).

Both options touch Windows outside the project folder, which is unavoidable for hardware access. Note that in your progress file.
