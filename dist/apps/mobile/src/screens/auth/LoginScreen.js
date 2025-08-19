"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const react_redux_1 = require("react-redux");
const native_1 = require("@react-navigation/native");
const authSlice_1 = require("@/store/slices/authSlice");
const theme_1 = require("@/utils/theme");
const LoadingSpinner_1 = __importDefault(require("@/components/common/LoadingSpinner"));
const LoginScreen = () => {
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [emailError, setEmailError] = (0, react_1.useState)('');
    const [passwordError, setPasswordError] = (0, react_1.useState)('');
    const dispatch = (0, react_redux_1.useDispatch)();
    const navigation = (0, native_1.useNavigation)();
    const { isLoading, error, biometricInfo } = (0, react_redux_1.useSelector)((state) => state.auth);
    (0, react_1.useEffect)(() => {
        dispatch((0, authSlice_1.checkBiometricAvailability)());
    }, [dispatch]);
    (0, react_1.useEffect)(() => {
        if (error) {
            react_native_1.Alert.alert('Login Failed', error);
        }
    }, [error]);
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };
    const validatePassword = (password) => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };
    const handleLogin = async () => {
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        if (isEmailValid && isPasswordValid) {
            try {
                await dispatch((0, authSlice_1.login)({ email, password })).unwrap();
            }
            catch (error) {
                // Error is handled by the useEffect above
                console.error('Login error:', error);
            }
        }
    };
    const handleBiometricLogin = async () => {
        try {
            await dispatch((0, authSlice_1.loginWithBiometrics)()).unwrap();
        }
        catch (error) {
            react_native_1.Alert.alert('Biometric Login Failed', 'Please try logging in with your email and password.');
        }
    };
    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };
    const getBiometricButtonText = () => {
        if (!biometricInfo.isAvailable)
            return 'Biometric Login Unavailable';
        if (biometricInfo.biometryType === 'FaceID')
            return 'Login with Face ID';
        if (biometricInfo.biometryType === 'TouchID')
            return 'Login with Touch ID';
        return 'Login with Biometrics';
    };
    const getBiometricIcon = () => {
        if (biometricInfo.biometryType === 'FaceID')
            return 'face-recognition';
        if (biometricInfo.biometryType === 'TouchID')
            return 'fingerprint';
        return 'shield-account';
    };
    return (<react_native_1.KeyboardAvoidingView style={styles.container} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'}>
      <react_native_1.ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <react_native_1.View style={styles.logoContainer}>
          <react_native_paper_1.Text variant="displaySmall" style={styles.title}>
            Investment Platform
          </react_native_paper_1.Text>
          <react_native_paper_1.Text variant="bodyLarge" style={styles.subtitle}>
            Secure access to your portfolio
          </react_native_paper_1.Text>
        </react_native_1.View>

        <react_native_paper_1.Surface style={styles.formContainer} elevation={2}>
          <react_native_paper_1.TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={!!emailError} style={styles.input} left={<react_native_paper_1.TextInput.Icon icon="email"/>}/>
          {emailError ? (<react_native_paper_1.Text variant="bodySmall" style={styles.errorText}>
              {emailError}
            </react_native_paper_1.Text>) : null}

          <react_native_paper_1.TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password" error={!!passwordError} style={styles.input} left={<react_native_paper_1.TextInput.Icon icon="lock"/>} right={<react_native_paper_1.TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)}/>}/>
          {passwordError ? (<react_native_paper_1.Text variant="bodySmall" style={styles.errorText}>
              {passwordError}
            </react_native_paper_1.Text>) : null}

          <react_native_paper_1.Button mode="contained" onPress={handleLogin} disabled={isLoading} style={styles.loginButton} contentStyle={styles.buttonContent}>
            {isLoading ? <LoadingSpinner_1.default size={20}/> : 'Sign In'}
          </react_native_paper_1.Button>

          <react_native_paper_1.Button mode="text" onPress={handleForgotPassword} style={styles.forgotButton}>
            Forgot Password?
          </react_native_paper_1.Button>

          {biometricInfo.isAvailable && biometricInfo.isEnabled && (<>
              <react_native_paper_1.Divider style={styles.divider}/>
              <react_native_paper_1.Button mode="outlined" onPress={handleBiometricLogin} disabled={isLoading} style={styles.biometricButton} icon={getBiometricIcon()}>
                {getBiometricButtonText()}
              </react_native_paper_1.Button>
            </>)}

          {biometricInfo.isAvailable && !biometricInfo.isEnabled && (<>
              <react_native_paper_1.Divider style={styles.divider}/>
              <react_native_paper_1.Text variant="bodySmall" style={styles.biometricSetupText}>
                Enable biometric login for faster access
              </react_native_paper_1.Text>
            </>)}
        </react_native_paper_1.Surface>

        <react_native_1.View style={styles.footer}>
          <react_native_paper_1.Text variant="bodySmall" style={styles.footerText}>
            Secured with enterprise-grade encryption
          </react_native_paper_1.Text>
        </react_native_1.View>
      </react_native_1.ScrollView>
    </react_native_1.KeyboardAvoidingView>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme_1.spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme_1.spacing.xl,
    },
    title: {
        color: theme_1.theme.colors.primary,
        textAlign: 'center',
        marginBottom: theme_1.spacing.sm,
    },
    subtitle: {
        color: theme_1.theme.colors.onSurfaceVariant,
        textAlign: 'center',
    },
    formContainer: {
        padding: theme_1.spacing.lg,
        borderRadius: 16,
        marginBottom: theme_1.spacing.lg,
    },
    input: {
        marginBottom: theme_1.spacing.sm,
    },
    errorText: {
        color: theme_1.theme.colors.error,
        marginBottom: theme_1.spacing.sm,
        marginLeft: theme_1.spacing.sm,
    },
    loginButton: {
        marginTop: theme_1.spacing.md,
        marginBottom: theme_1.spacing.md,
    },
    buttonContent: {
        paddingVertical: theme_1.spacing.sm,
    },
    forgotButton: {
        alignSelf: 'center',
    },
    divider: {
        marginVertical: theme_1.spacing.md,
    },
    biometricButton: {
        marginTop: theme_1.spacing.sm,
    },
    biometricSetupText: {
        textAlign: 'center',
        color: theme_1.theme.colors.onSurfaceVariant,
        marginTop: theme_1.spacing.sm,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: theme_1.theme.colors.onSurfaceVariant,
        textAlign: 'center',
    },
});
exports.default = LoginScreen;
