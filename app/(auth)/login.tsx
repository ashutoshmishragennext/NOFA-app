import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useGoogleAuth } from "@/components/utils/GoogleAuth";
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get("window");

// Complete auth session for OAuth
WebBrowser.maybeCompleteAuthSession();

// Social Media Icons
const GoogleIcon = () => (
  <View style={styles.socialIconPlaceholder}>
    <Image
      source={require("../../assets/images/google.png")}
      style={styles.icon}
    />
  </View>
);

const FacebookIcon = () => (
  <View style={styles.socialIconPlaceholder}>
    <Image
      source={require("../../assets/images/facebook.png")}
      style={styles.icon}
    />
  </View>
);

// Eye Icon for password visibility
const EyeIcon = ({ visible }:any) => (
  <Text style={styles.eyeIcon}>{visible ? "👁️" : "🫣"}</Text>
);

export default function ApartmentLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = () => {
    router.push('/(auth)/register');
  };

  const { login, googleSignIn, user } = useAuth();
  const { request, response, promptAsync } = useGoogleAuth();
  const router = useRouter();

  const getRoleGroup = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '(super-admin)';
      case 'ADMIN':
        return '(admin)';
      case 'USER':
        return '(user)';
      default:
        return '(user)';
    }
  };

  useEffect(() => {    
    if(user?.role) {
      console.log("user in login", user);
      // Redirect to dashboard if user is already logged in
      const role = getRoleGroup(user.role);
      router.replace(`${role}/dashboard` as any);
    }
  }, [user?.role]);

  // Handle Google sign-in response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Google Sign-In Error', 'Authentication was cancelled or failed');
    }
  }, [response]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsGoogleLoading(true);
      const { authentication } = response;
      
      if (authentication?.accessToken) {
        await googleSignIn(authentication.accessToken);
        // Success - user will be redirected by useEffect above
      } else {
        throw new Error('No access token received');
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error.message || 'Authentication failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      if (!request) {
        Alert.alert('Error', 'Google sign-in is not ready yet');
        return;
      }
      await promptAsync();
      // Response will be handled by useEffect
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setIsGoogleLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === "Google") {
      handleGoogleLogin();
    } else {
      Alert.alert("Social Login", `Login with ${provider} coming soon!`);
    }
  };

  return (
    <LinearGradient
      colors={["#f0f9ff", "#e0f2fe", "#bae6fd"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={styles.card}>
          {/* Logo */}
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />

          {/* Form Content */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign in your account</Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ex. jon.smith@email.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading && !isGoogleLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••••"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading && !isGoogleLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isGoogleLoading}
                >
                  <EyeIcon visible={showPassword} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.signInButton,
                (isLoading || isGoogleLoading) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              <LinearGradient
                colors={["#06b6d4", "#14b8a6"]}
                start={{ x: 0, y: 0 }}   
                end={{ x: 1, y: 1 }} 
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.loadingText}>Signing In...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>SIGN IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>


              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>
                  Don&apos;t have an account?{" "}
                  <TouchableOpacity onPress={handleSignUp}>
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </TouchableOpacity>
                </Text>
              </View>
            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  (isLoading || isGoogleLoading) && styles.socialButtonDisabled
                ]}
                onPress={() => handleSocialLogin("Google")}
                disabled={isLoading || isGoogleLoading || !request}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#06b6d4" />
                ) : (
                  <GoogleIcon />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialButton,
                  (isLoading || isGoogleLoading) && styles.socialButtonDisabled
                ]}
                onPress={() => handleSocialLogin("Facebook")}
                disabled={isLoading || isGoogleLoading}
              >
                <FacebookIcon />
              </TouchableOpacity>
            </View>

            {/* Loading indicator for Google */}
            {isGoogleLoading && (
              <View style={styles.googleLoadingContainer}>
                <Text style={styles.googleLoadingText}>
                  Authenticating with Google...
                </Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our{" "}
                <Text style={styles.linkText}>Terms of Use</Text> and{" "}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 0,
  },
  icon: {
    height: 25,
    width: 25,
  },
  logo: {
    width: 360,
    height: 120,
    resizeMode: "contain",
  },
  card: {
    paddingVertical: 40,
    flex: 1,
    backgroundColor: "white",
    borderRadius: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  formContainer: {
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#fff",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
  signInButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#6b7280",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialIconPlaceholder: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  googleLoadingContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  googleLoadingText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#06b6d4",
    fontWeight: "500",
  },
});
