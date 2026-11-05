# The app uses no reflection, so R8 needs no keep rules.
# Keep line numbers so stack traces can be retraced with mapping.txt.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
