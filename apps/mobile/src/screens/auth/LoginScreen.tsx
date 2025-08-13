import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  IconButton,
  Divider,
} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {AppDispatch, RootState} from '@/store';
import {login, loginWithBiometrics, checkBiometricAvailability} from '@/store/slices/authSlice';
import {theme, spacing} from '@/utils/theme';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const {isLoading, error, biometricInfo} = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    dispatch(checkBiometricAvailability());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
    }
  }, [error]);

  const validateEmail = (email: string): boolean => {
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

  const validatePassword = (password: string): boolean => {
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
        await dispatch(login({email, password})).unwrap();
      } catch (error) {
        // Error is handled by the useEffect above
        console.error('Login error:', error);
      }
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await dispatch(loginWithBiometrics()).unwrap();
    } catch (error) {
      Alert.alert(
        'Biometric Login Failed',
        'Please try logging in with your email and password.',
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const getBiometricButtonText = () => {
    if (!biometricInfo.isAvailable) return 'Biometric Login Unavailable';
    if (biometricInfo.biometryType === 'FaceID') return 'Login with Face ID';
    if (biometricInfo.biometryType === 'TouchID') return 'Login with Touch ID';
    return 'Login with Biometrics';
  };

  const getBiometricIcon = () => {
    if (biometricInfo.biometryType === 'FaceID') return 'face-recognition';
    if (biometricInfo.biometryType === 'TouchID') return 'fingerprint';
    return 'shield-account';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text variant="displaySmall" style={styles.title}>
            Investment Platform
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Secure access to your portfolio
          </Text>
        </View>

        <Surface style={styles.formContainer} elevation={2}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={!!emailError}
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />
          {emailError ? (
            <Text variant="bodySmall" style={styles.errorText}>
              {emailError}
            </Text>
          ) : null}

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            error={!!passwordError}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {passwordError ? (
            <Text variant="bodySmall" style={styles.errorText}>
              {passwordError}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}>
            {isLoading ? <LoadingSpinner size={20} /> : 'Sign In'}
          </Button>

          <Button
            mode="text"
            onPress={handleForgotPassword}
            style={styles.forgotButton}>
            Forgot Password?
          </Button>

          {biometricInfo.isAvailable && biometricInfo.isEnabled && (
            <>
              <Divider style={styles.divider} />
              <Button
                mode="outlined"
                onPress={handleBiometricLogin}
                disabled={isLoading}
                style={styles.biometricButton}
                icon={getBiometricIcon()}>
                {getBiometricButtonText()}
              </Button>
            </>
          )}

          {biometricInfo.isAvailable && !biometricInfo.isEnabled && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={styles.biometricSetupText}>
                Enable biometric login for faster access
              </Text>
            </>
          )}
        </Surface>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Secured with enterprise-grade encryption
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  formContainer: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  loginButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  divider: {
    marginVertical: spacing.md,
  },
  biometricButton: {
    marginTop: spacing.sm,
  },
  biometricSetupText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default LoginScreen;