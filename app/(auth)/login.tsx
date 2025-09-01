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
const { width } = Dimensions.get("window");

// Social Media Icons (you can replace with actual icon libraries like react-native-vector-icons)
const GoogleIcon = () => (
  <View style={styles.socialIconPlaceholder}>
        {/* <Fontisto name="google" color="#000" size={24} /> */}
         <Image
                  source={require("../../assets/images/google.png")}
                  style={styles.icon}
                />
    {/* <Text style={styles.socialIconText}>G</Text> */}
  </View>
);

// const AppleIcon = () => (
//   <View style={styles.socialIconPlaceholder}>
//     {/* <Text style={styles.socialIconText}>🍎</Text> */}
//     <Fontisto name="apple" color="#000" size={24} />
//   </View>
// );

const FacebookIcon = () => (
  <View style={styles.socialIconPlaceholder}>
    {/* <Text style={styles.socialIconText}>f</Text> */}
        {/* <Fontisto name="facebook" color="#000" size={24} /> */}
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
  const [showPassword, setShowPassword] = useState(false);

   const {login , user} = useAuth()

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
  }, [user?.role])

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
  const handleSocialLogin = (provider: string) => {
    Alert.alert("Social Login", `Login with ${provider} clicked`);
  };

  return (
    <LinearGradient
      colors={["#f0f9ff", "#e0f2fe", "#bae6fd"]}
      style={styles.container}
    >
      {/* <SafeAreaView style={styles.safeArea}> */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={styles.card}>
            {/* Header with Logo */}
            
            {/* <LinearGradient
              colors={["#06b6d4", "#14b8a6"]}
              style={styles.header}
            > */}
              <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logo}
                />
              {/* <View style={styles.logoContainer}>
                
                <Text style={styles.logoText}>APARTMENT TIMES</Text>
              </View> */}
              {/* <Text style={styles.tagline}>Voice of Apartment Residents</Text> */}
            {/* </LinearGradient> */}

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
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <EyeIcon visible={showPassword} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
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

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or sign in with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Google")}
                >
                  <GoogleIcon />
                </TouchableOpacity>

                {/* <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Apple")}
                >
                  <AppleIcon />
                </TouchableOpacity> */}

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Facebook")}
                >
                  <FacebookIcon />
                </TouchableOpacity>
              </View>

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
      {/* </SafeAreaView> */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
      paddingVertical: 0,

  },
  safeArea: {
    flex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 0,
  },
  icon:{
   height:25,
   width:25,
  },
  logo: {
    width: 360,
    height: 120,
    resizeMode: "contain",
  },

  card: {
    
    paddingVertical:40,
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
  header: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  logoText: {
    color: "#06b6d4",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tagline: {
    color: "white",
    fontSize: 11,
    opacity: 0.9,
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
  socialIconPlaceholder: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  socialIconText: {
    fontSize: 16,
    fontWeight: "600",
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