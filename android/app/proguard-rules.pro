########## React Native Core ##########
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

########## Hermes (if enabled) ##########
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.jni.**

########## JS Engine Native Methods ##########
-keepclassmembers class * {
    @com.facebook.jni.HybridData <fields>;
    native <methods>;
}

########## Annotations ##########
-keepattributes *Annotation*

########## React Native Reanimated (you already have) ##########
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

########## OkHttp (used by React Native networking) ##########
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

########## Gson (used internally by RN & some libs) ##########
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**

########## AndroidX ##########
-dontwarn androidx.**
-keep class androidx.** { *; }

########## Flipper (debug only, safe to ignore in release) ##########
-dontwarn com.facebook.flipper.**
-dontwarn com.facebook.flipper.plugins.**
