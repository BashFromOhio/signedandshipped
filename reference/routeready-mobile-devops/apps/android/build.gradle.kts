// Versions are pinned here and recorded in docs/toolchain.md. Upgrade only through a reviewed PR (MOB-101).
// AGP 8.13 needs Gradle 8.13+ and JDK 17+. Kotlin 2.2.x is supported by AGP 8.13.
plugins {
    id("com.android.application") version "8.13.0" apply false
    id("org.jetbrains.kotlin.android") version "2.2.20" apply false
}
