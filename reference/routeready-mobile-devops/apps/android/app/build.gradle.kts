import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Debug talks to the local mock API; release talks to "production" (a fake URL in this lab) - MOB-111.
val debugApi = (project.findProperty("routereadyApiBaseUrl") as String?) ?: "http://10.0.2.2:8080"
val releaseApi = (project.findProperty("routereadyReleaseApiBaseUrl") as String?) ?: "https://api.routeready.example"

android {
    namespace = "org.routeready.parent"
    compileSdk = 36

    defaultConfig {
        applicationId = "org.routeready.parent"
        minSdk = 26
        targetSdk = 36
        // Build number comes from the allocator (local: .tools/build-number), passed as a Gradle property - MOB-107.
        versionCode = (project.findProperty("routereadyVersionCode") as String?)?.toInt() ?: 1
        versionName = "1.5.0"
    }

    // Release builds are signed with the UPLOAD key. Google re-signs with the app signing key (Play App Signing).
    // Values come from the environment (local/08-sign-release.sh or a trusted CI job), never from committed files - MOB-108.
    signingConfigs {
        create("upload") {
            val ks = System.getenv("ROUTEREADY_UPLOAD_KEYSTORE")
            if (ks != null) {
                storeFile = file(ks)
                storePassword = System.getenv("ROUTEREADY_UPLOAD_STORE_PASSWORD")
                keyAlias = System.getenv("ROUTEREADY_UPLOAD_KEY_ALIAS")
                keyPassword = System.getenv("ROUTEREADY_UPLOAD_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        getByName("debug") {
            buildConfigField("String", "API_BASE_URL", "\"$debugApi\"")
        }
        getByName("release") {
            buildConfigField("String", "API_BASE_URL", "\"$releaseApi\"")
            isMinifyEnabled = true // R8 shrinks + obfuscates; keep mapping.txt for readable crash reports (MOB-114)
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (System.getenv("ROUTEREADY_UPLOAD_KEYSTORE") != null) {
                signingConfig = signingConfigs.getByName("upload")
            }
        }
    }

    buildFeatures { buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
        htmlReport = true
    }
}

kotlin {
    compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
}

dependencies {
    // The app itself has zero third-party dependencies (fewer things to break while you learn).
    testImplementation("junit:junit:4.13.2")
    // Real org.json for JVM unit tests (Android's built-in copy is a stub off-device).
    testImplementation("org.json:json:20240303")
}
