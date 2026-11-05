# Level 11 · React Native: run StayReady

**Difficulty** ★★★★☆ · **Time** 30–45 min · **Sprint** 6–7 · **Ticket** MOB-110 (the StayReady lab app)

## The story
Dana: *"Our sister product StayReady is one React Native app shared by two vacation-rental companies, Cedar Cove and Harbor House. Two things must never happen: a guest seeing the other company's data, or one tap creating three housekeeping tickets. Run it and see how both are prevented."*

## Like I'm 10
One apartment building, two families. Your key opens **your** door only, and the building checks the key, not what you *say* your apartment number is. If you ring the doorbell three times because nobody answered, the pizza should still arrive once.

## Run it
```bash
local/05-emulator.sh                 # Android emulator running (or use 'ios' below on a Mac)
local/11-react-native.sh             # Android via Expo
local/11-react-native.sh ios         # iOS Simulator (Mac)
local/11-react-native.sh dev-build   # harder: compile a real native debug build with Gradle
```

## What happens, step by step
1. Installs **Node.js 24 LTS** into `.tools/node`, with the checksum checked against nodejs.org's `SHASUMS256.txt`. The npm cache goes to `.tools/npm-cache`.
2. `npm ci` installs the **exact** versions from `package-lock.json`: Expo SDK 58, React Native 0.88 and React 19.3. `npm install` could drift; `npm ci` can't.
3. `npm run typecheck` (TypeScript) and `npm test` (a Node unit test proving retries reuse one idempotency key).
4. `npx expo start --android` starts the Metro bundler and opens the app in **Expo Go** on the emulator. The Expo CLI installs Expo Go for you the first time.
   - `dev-build` instead runs `npx expo run:android`. It generates a native `android/` project and builds it with Gradle using the same `.tools` JDK and SDK, which is closer to what a release pipeline does.

## In the app
1. Pick **Guest at Cedar Cove**. You'll see Cabin 3.
2. Tap **Towels**. One request appears.
3. Sign out and pick **Harbor House**. You see only Suite B and none of Cedar Cove's requests.

## Look at the two safety features in code
| Safety | Where | How |
|---|---|---|
| Tenant isolation | `local/mock-api/server.py` → `_tenant()` | Tenant comes **only** from the verified token. Drill 10 flips this to trust a header, so you can see the leak |
| No duplicate requests | `stayready/mobile/src/api.ts` → `newIdempotencyKey()` + `withRetry()`; server `do_POST` | One key per tap, reused by every retry; the server returns the first result for a repeated key. Drill 9 removes the server half |

## Expected output
```
node v24.x  npm 11.x
✓ types and tests pass
Starting Metro Bundler
› Opening on Android...
› Metro waiting on exp://192.168.x.x:8081
```

## Done when
You've seen both tenants' screens, sent one request, and can explain both safety features.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `Network request failed` on Android | API not reachable from the emulator | API running? The app uses `http://10.0.2.2:8080` on Android |
| Real phone can't connect | `10.0.2.2` only works in the emulator | `EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8080 local/11-react-native.sh` |
| Expo Go version mismatch | Expo Go doesn't support SDK 58 yet/anymore | Use `dev-build` instead |
| `npm ci` fails: lockfile mismatch | `package.json` edited without updating the lock | `npm install` once, then commit `package-lock.json` |

## Interview angle
**Q: "How do you safely retry a POST from a mobile app on a bad network?"**
Generate an idempotency key per user action, send it with every retry of that action, and have the server store the result per (tenant, key) so a replay returns the original response instead of creating a duplicate. Also put tenant identity in the server-verified token, never in a client header.

**Next:** [Level 12](level-12.md)
