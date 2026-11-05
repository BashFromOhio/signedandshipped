# Level 00 · Doctor: is this machine ready?

**Difficulty** ★☆☆☆☆ · **Time** 5 min · **Sprint** 1 · **Ticket** MOB-101 (pin the toolchain)

## The story
Dana: *"CI broke last month because the build machine changed under us. Before you install anything, tell me exactly what this laptop has."*

## Like I'm 10
Before a road trip, you check the tires, the fuel and the map. You don't start driving and hope.

## Run it
```bash
local/00-doctor.sh
```
It installs **nothing**. It only looks.

## What it checks, in order
1. **Your OS and CPU.** These decide which JDK, SDK and emulator image the next levels download (Intel `x64` or Apple Silicon/ARM `aarch64`).
2. **Basic tools**: `curl` (downloads), `unzip`/`tar` (unpacking), `git`, and `python3` (the mock API and small helpers).
3. **Disk space.** The emulator image alone is about 1.5 GB, and you want 15 GB free.
4. **Emulator acceleration.** Linux needs `/dev/kvm`, macOS has it built in, and WSL usually can't run the emulator at all (see [Windows and WSL](windows-wsl.md)).
5. **Optional extras**: Xcode (Level 10) and Ruby (Level 09).
6. **A system Java, if you have one.** It gets ignored on purpose. Level 01 installs a private one so your result matches CI and your teammates.

## Expected output (abridged)
```
▶ Basic tools (needed by every level)
✓ curl  (/usr/bin/curl)
...
▶ Disk space (needs ~15 GB for the Android SDK + emulator image)
✓ 87 GB free
▶ Result
✓ Ready. Report saved to .tools/doctor.txt
```

## Done when
`✓ Ready` is printed and `.tools/doctor.txt` exists.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `python3 missing` on a Mac | Apple's command line tools aren't installed | `xcode-select --install` |
| `unzip missing` on Ubuntu/WSL | Minimal image | `sudo apt-get install -y unzip curl git python3` |
| `/dev/kvm exists but you can't use it` | You're not in the `kvm` group | `sudo usermod -aG kvm $USER`, then log out and back in |
| `Unsupported OS` on Windows | You ran it in PowerShell or Git Bash | Use WSL Ubuntu: [windows-wsl.md](windows-wsl.md) |

## Interview angle
**Q: "How do you stop 'works on my machine'?"**
Pin every tool version in one reviewed file (`docs/toolchain.md`), install exactly those versions in CI and locally, and print the toolchain into every build log so you can tell when it changed. Level 00 is the "look before you change anything" part.

**Next:** [Level 01](level-01.md)
