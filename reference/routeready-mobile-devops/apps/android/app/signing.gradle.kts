// Reference snippet for apps/android/app/build.gradle.kts (drill 3).
// Release builds are signed with the UPLOAD key. Google re-signs with the app signing key (Play App Signing).
// Values come from the environment of a trusted release job — never from committed files.
android {
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
    defaultConfig {
        // Build number comes from the allocator, passed as a Gradle property by the package lane.
        versionCode = (project.findProperty("routereadyVersionCode") as String?)?.toInt() ?: 1
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = true            // keep mapping.txt for crash symbolication
            signingConfig = signingConfigs.getByName("upload")
        }
    }
}
