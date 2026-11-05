# apps/ios · RouteReady (SwiftUI)

Same four screens as Android. The Xcode project is generated from **`project.yml`** with XcodeGen
(`local/10-ios.sh`), so `RouteReady.xcodeproj` is never committed. Bundle id `org.routeready.parent`,
scheme `RouteReady` (what `fastlane ios verify` expects). iOS 17+.

Debug talks to `http://localhost:8080` (the simulator shares your Mac's network); Release to the fake
production URL. A physical device can't reach `localhost`: use your Mac's LAN address, configured per build.

Guide: [docs/local/level-10.md](../../docs/local/level-10.md)
