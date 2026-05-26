import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppCountryPicker, AppInput, AppText } from '../../components';
import { Country, DEFAULT_COUNTRY } from '../../constants/countries';
import { useTheme, useTranslation } from '../../providers/AppProviders';
import SupplierApi from '../../service/supplierApi';
import { getStorage } from '../../utils/Storage';

const APP_LOGO = require('../../../assets/splash/appIcon.png');

type SupplierLoginMethod = 'password' | 'otp';
type LoginField = 'phone' | 'password' | 'otp';
type ForgotPasswordField = 'phone' | 'otp';
type RegisterField =
  | 'name'
  | 'phone'
  | 'email'
  | 'password'
  | 'gstin'
  | 'cin'
  | 'address1'
  | 'address2'
  | 'city'
  | 'postalCode'
  | 'state'
  | 'lat'
  | 'lng'
  | 'status'
  | 'ratings';

export interface AuthScreenProps {
  onSignIn?: (token: string) => void;
  mode?: 'login' | 'signup';
  titleKey?: string;
  subtitleKey?: string;
}

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function isValidPhone(value: string) {
  return value.replace(/\D/g, '').length === 10;
}

function isValidCoordinate(value: string, min: number, max: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max;
}

function getResponseMessage(response: any, fallback: string) {
  return response?.message ?? response?.error?.message ?? response?.data?.message ?? fallback;
}

function hasResponseError(response: any) {
  if (!response) {
    return true;
  }

  if (response?.error || response?.success === false || response?.ok === false) {
    return true;
  }

  if (typeof response?.status === 'number' && response.status >= 400) {
    return true;
  }

  if (typeof response?.statusCode === 'number' && response.statusCode >= 400) {
    return true;
  }

  return false;
}

export function AuthScreen({
  onSignIn,
  titleKey = 'signInTitle',
}: AuthScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.statusBarStyle === 'light-content';
  const palette = {
    screenBackground: isDark ? '#08111F' : '#ECFEFF',
    surface: isDark ? '#102235' : '#FFFFFF',
    surfaceBorder: isDark ? 'rgba(94, 234, 212, 0.18)' : '#BEE3F8',
    heading: isDark ? '#F0FDFA' : '#0F172A',
    subtleText: isDark ? '#94A3B8' : '#475569',
    accent: isDark ? '#2DD4BF' : '#0F766E',
    accentStrong: isDark ? '#14B8A6' : '#115E59',
    accentSoft: isDark ? 'rgba(45, 212, 191, 0.14)' : '#CCFBF1',
    accentSoftBorder: isDark ? 'rgba(94, 234, 212, 0.3)' : '#99F6E4',
    accentTextOnFill: '#F8FAFC',
    decorTop: isDark ? 'rgba(45, 212, 191, 0.16)' : 'rgba(34, 197, 94, 0.12)',
    decorBottom: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 165, 233, 0.12)',
    shadow: isDark ? '#020617' : '#0F172A',
    error: isDark ? '#FCA5A5' : '#DC2626',
  };

  const loginHeaderProgress = useRef(new Animated.Value(0)).current;
  const loginCardProgress = useRef(new Animated.Value(0)).current;
  const registerHeaderProgress = useRef(new Animated.Value(0)).current;
  const registerCardProgress = useRef(new Animated.Value(0)).current;
  const forgotHeaderProgress = useRef(new Animated.Value(0)).current;
  const forgotCardProgress = useRef(new Animated.Value(0)).current;

  const [loginMethod, setLoginMethod] = useState<SupplierLoginMethod>('password');
  const [loginPhone, setLoginPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [showSupplierRegistration, setShowSupplierRegistration] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('');
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [forgotPasswordOtpRequested, setForgotPasswordOtpRequested] = useState(false);
  const [supplierCountry, setSupplierCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPassword, setSupplierPassword] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierCin, setSupplierCin] = useState('');
  const [supplierAddressLine1, setSupplierAddressLine1] = useState('');
  const [supplierAddressLine2, setSupplierAddressLine2] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierPostalCode, setSupplierPostalCode] = useState('');
  const [supplierState, setSupplierState] = useState('');
  const [supplierLat, setSupplierLat] = useState('');
  const [supplierLng, setSupplierLng] = useState('');
  const [supplierStatus, setSupplierStatus] = useState('pending');
  const [supplierRatings, setSupplierRatings] = useState('0');
  const [loginTouched, setLoginTouched] = useState<Partial<Record<LoginField, boolean>>>({});
  const [forgotPasswordTouched, setForgotPasswordTouched] = useState<
    Partial<Record<ForgotPasswordField, boolean>>
  >({});
  const [registerTouched, setRegisterTouched] = useState<
    Partial<Record<RegisterField, boolean>>
  >({});
  const [didAttemptLogin, setDidAttemptLogin] = useState(false);
  const [didAttemptForgotPassword, setDidAttemptForgotPassword] = useState(false);
  const [didAttemptRegister, setDidAttemptRegister] = useState(false);

  const normalizedLoginPhone = loginPhone.replace(/\D/g, '');
  const normalizedForgotPasswordPhone = forgotPasswordPhone.replace(/\D/g, '');
  const normalizedSupplierPhone = supplierPhone.replace(/\D/g, '');
  const normalizedGstin = supplierGstin.trim().toUpperCase();
  const normalizedCin = supplierCin.trim().toUpperCase();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(loginHeaderProgress, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(110),
        Animated.spring(loginCardProgress, {
          toValue: 1,
          tension: 48,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [loginCardProgress, loginHeaderProgress]);

  useEffect(() => {
    if (!showSupplierRegistration) {
      registerHeaderProgress.setValue(0);
      registerCardProgress.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(registerHeaderProgress, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(70),
        Animated.spring(registerCardProgress, {
          toValue: 1,
          tension: 54,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [registerCardProgress, registerHeaderProgress, showSupplierRegistration]);

  useEffect(() => {
    if (!showForgotPassword) {
      forgotHeaderProgress.setValue(0);
      forgotCardProgress.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(forgotHeaderProgress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(60),
        Animated.spring(forgotCardProgress, {
          toValue: 1,
          tension: 56,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [forgotCardProgress, forgotHeaderProgress, showForgotPassword]);

  const loginErrors = useMemo(
    () => ({
      phone:
        !normalizedLoginPhone
          ? 'Phone number is required.'
          : !isValidPhone(normalizedLoginPhone)
            ? 'Enter a valid 10-digit phone number.'
            : '',
      password:
        loginMethod === 'password'
          ? !password.trim()
            ? 'Password is required.'
            : password.trim().length < 6
              ? 'Password must be at least 6 characters.'
              : ''
          : '',
      otp:
        loginMethod === 'otp'
          ? !otp.trim()
            ? 'OTP is required.'
            : otp.trim().length < 4
              ? 'Enter a valid OTP.'
              : ''
          : '',
    }),
    [loginMethod, normalizedLoginPhone, otp, password],
  );

  const registerErrors = useMemo(
    () => ({
      name:
        !supplierName.trim()
          ? 'Supplier name is required.'
          : supplierName.trim().length < 2
            ? 'Enter at least 2 characters.'
            : '',
      phone:
        !normalizedSupplierPhone
          ? 'Business mobile number is required.'
          : !isValidPhone(normalizedSupplierPhone)
            ? 'Enter a valid 10-digit phone number.'
            : '',
      email:
        !supplierEmail.trim()
          ? 'Business email is required.'
          : !isEmail(supplierEmail)
            ? 'Enter a valid email address.'
            : '',
      password:
        !supplierPassword.trim()
          ? 'Password is required.'
          : supplierPassword.trim().length < 6
            ? 'Password must be at least 6 characters.'
            : '',
      gstin:
        !normalizedGstin
          ? 'GSTIN is required.'
          : !/^[0-9A-Z]{15}$/.test(normalizedGstin)
            ? 'Enter a valid 15-character GSTIN.'
            : '',
      cin:
        normalizedCin && !/^[A-Z0-9]{21}$/.test(normalizedCin)
          ? 'Enter a valid 21-character CIN.'
          : '',
      address1:
        !supplierAddressLine1.trim()
          ? 'Address line 1 is required.'
          : supplierAddressLine1.trim().length < 5
            ? 'Enter a more complete address.'
            : '',
      address2:
        supplierAddressLine2.trim() && supplierAddressLine2.trim().length < 3
          ? 'Address line 2 looks too short.'
          : '',
      city:
        !supplierCity.trim()
          ? 'City is required.'
          : supplierCity.trim().length < 2
            ? 'Enter a valid city.'
            : '',
      postalCode:
        !supplierPostalCode.trim()
          ? 'Postal code is required.'
          : !/^\d{6}$/.test(supplierPostalCode.trim())
            ? 'Enter a valid 6-digit postal code.'
            : '',
      state:
        !supplierState.trim()
          ? 'State is required.'
          : supplierState.trim().length < 2
            ? 'Enter a valid state.'
            : '',
      lat:
        supplierLat.trim() && !isValidCoordinate(supplierLat.trim(), -90, 90)
          ? 'Latitude must be between -90 and 90.'
          : '',
      lng:
        supplierLng.trim() && !isValidCoordinate(supplierLng.trim(), -180, 180)
          ? 'Longitude must be between -180 and 180.'
          : '',
      status:
        supplierStatus.trim() && supplierStatus.trim().length < 3
          ? 'Enter a valid status.'
          : '',
      ratings:
        supplierRatings.trim() &&
        (!Number.isFinite(Number(supplierRatings.trim())) ||
          Number(supplierRatings.trim()) < 0 ||
          Number(supplierRatings.trim()) > 5)
          ? 'Ratings must be between 0 and 5.'
          : '',
    }),
    [
      normalizedCin,
      normalizedGstin,
      normalizedSupplierPhone,
      supplierAddressLine1,
      supplierAddressLine2,
      supplierCity,
      supplierEmail,
      supplierLat,
      supplierLng,
      supplierName,
      supplierPassword,
      supplierPostalCode,
      supplierRatings,
      supplierState,
      supplierStatus,
    ],
  );

  const forgotPasswordErrors = useMemo(
    () => ({
      phone:
        !normalizedForgotPasswordPhone
          ? 'Phone number is required.'
          : !isValidPhone(normalizedForgotPasswordPhone)
            ? 'Enter a valid 10-digit phone number.'
            : '',
      otp:
        forgotPasswordOtpRequested
          ? !forgotPasswordOtp.trim()
            ? 'OTP is required.'
            : forgotPasswordOtp.trim().length < 4
              ? 'Enter a valid OTP.'
              : ''
          : '',
    }),
    [forgotPasswordOtp, forgotPasswordOtpRequested, normalizedForgotPasswordPhone],
  );

  const isPasswordLoginDisabled =
    Boolean(loginErrors.phone) || Boolean(loginErrors.password);
  const isOtpRequestDisabled = Boolean(loginErrors.phone);
  const isOtpLoginDisabled = Boolean(loginErrors.phone) || Boolean(loginErrors.otp);
  const isForgotPasswordRequestDisabled = Boolean(forgotPasswordErrors.phone);
  const isForgotPasswordVerifyDisabled =
    Boolean(forgotPasswordErrors.phone) || Boolean(forgotPasswordErrors.otp);
  const isRegisterDisabled = Object.values(registerErrors).some(Boolean);

  const loginHeaderAnimatedStyle = {
    opacity: loginHeaderProgress,
    transform: [
      {
        translateY: loginHeaderProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [22, 0],
        }),
      },
      {
        scale: loginHeaderProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const loginCardAnimatedStyle = {
    opacity: loginCardProgress,
    transform: [
      {
        translateY: loginCardProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [34, 0],
        }),
      },
      {
        scale: loginCardProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const registerHeaderAnimatedStyle = {
    opacity: registerHeaderProgress,
    transform: [
      {
        translateY: registerHeaderProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const registerCardAnimatedStyle = {
    opacity: registerCardProgress,
    transform: [
      {
        translateY: registerCardProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
      {
        scale: registerCardProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };

  const forgotHeaderAnimatedStyle = {
    opacity: forgotHeaderProgress,
    transform: [
      {
        translateY: forgotHeaderProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const forgotCardAnimatedStyle = {
    opacity: forgotCardProgress,
    transform: [
      {
        translateY: forgotCardProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
      {
        scale: forgotCardProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };

  const markLoginTouched = (field: LoginField) => {
    setLoginTouched(current => ({ ...current, [field]: true }));
  };

  const markForgotPasswordTouched = (field: ForgotPasswordField) => {
    setForgotPasswordTouched(current => ({ ...current, [field]: true }));
  };

  const markRegisterTouched = (field: RegisterField) => {
    setRegisterTouched(current => ({ ...current, [field]: true }));
  };

  const shouldShowLoginError = (field: LoginField) =>
    Boolean(didAttemptLogin || loginTouched[field]);

  const shouldShowForgotPasswordError = (field: ForgotPasswordField) =>
    Boolean(didAttemptForgotPassword || forgotPasswordTouched[field]);

  const shouldShowRegisterError = (field: RegisterField) =>
    Boolean(didAttemptRegister || registerTouched[field]);

  const resetSupplierForm = () => {
    setSupplierCountry(DEFAULT_COUNTRY);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierPassword('');
    setSupplierGstin('');
    setSupplierCin('');
    setSupplierAddressLine1('');
    setSupplierAddressLine2('');
    setSupplierCity('');
    setSupplierPostalCode('');
    setSupplierState('');
    setSupplierLat('');
    setSupplierLng('');
    setSupplierStatus('pending');
    setSupplierRatings('0');
    setRegisterTouched({});
    setDidAttemptRegister(false);
  };

  const openSupplierRegistration = () => {
    setShowSupplierRegistration(true);
  };

  const resetForgotPasswordForm = () => {
    setForgotPasswordPhone('');
    setForgotPasswordOtp('');
    setForgotPasswordOtpRequested(false);
    setForgotPasswordTouched({});
    setDidAttemptForgotPassword(false);
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    resetForgotPasswordForm();
  };

  const closeSupplierRegistration = () => {
    setShowSupplierRegistration(false);
    resetSupplierForm();
  };

  const completeLogin = (response: any) => {
    console.log('Login response', response);

    const token = response?.token ?? response?.data?.token;
    const supplier = response?.supplier ?? response?.data?.supplier ?? response?.user;
    const isVerified = supplier?.verified ?? response?.verified ?? response?.data?.verified;

    if (token && isVerified === false) {
      Alert.alert(
        'Application under review',
        'Your supplier application is under review. We will let you know once verified.',
      );
      return true;
    }

    if (!token) {
      return false;
    }

    getStorage().set('authToken', token);
    onSignIn?.(token);
    return true;
  };

  const handlePasswordLogin = async () => {
    
    setDidAttemptLogin(true);
    if (isPasswordLoginDisabled) {
      return;
    }

    const response = await SupplierApi.loginSupplier({
      phone: normalizedLoginPhone,
      password: password.trim(),
    });
    console.log('handlePasswordLogin', response);
    if (completeLogin(response)) {
      return;
    }

    Alert.alert(
      'Login failed',
      getResponseMessage(response, 'Invalid login credentials.'),
    );
  };

  const handleRequestOtp = async () => {
    setDidAttemptLogin(true);
    if (isOtpRequestDisabled) {
      return;
    }

    const response = await SupplierApi.requestOtp({
      phone: normalizedLoginPhone,
    });

    console.log('handleRequestOtp', response);
    if (hasResponseError(response)) {
      Alert.alert(
        'OTP request failed',
        getResponseMessage(response, 'Unable to send OTP. Please try again.'),
      );
      return;
    }

    setOtpRequested(true);
    Alert.alert(
      'OTP sent',
      getResponseMessage(response, 'Enter the OTP sent to your phone to continue.'),
    );
  };

  const handleOtpLogin = async () => {
    setDidAttemptLogin(true);
    if (isOtpLoginDisabled) {
      return;
    }

    const response = await SupplierApi.loginWithOtp({
      phone: normalizedLoginPhone,
      otp: otp.trim(),
    });

    console.log('handleOtpLogin', response);
    if (completeLogin(response)) {
      return;
    }

    Alert.alert(
      'OTP verification failed',
      getResponseMessage(response, 'Invalid OTP. Please try again.'),
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoginMethodChange = (nextMethod: SupplierLoginMethod) => {
    setLoginMethod(nextMethod);
    setPassword('');
    setOtp('');
    setOtpRequested(false);
    setLoginTouched({});
    setDidAttemptLogin(false);
  };

  const handleRegisterSupplier = async () => {
    setDidAttemptRegister(true);
    if (isRegisterDisabled) {
      return;
    }

    const response = await SupplierApi.registerSupplier({
      name: supplierName.trim(),
      phone: normalizedSupplierPhone,
      email: supplierEmail.trim().toLowerCase(),
      password: supplierPassword,
      gstin: normalizedGstin,
      cin: normalizedCin || undefined,
      address_line_1: supplierAddressLine1.trim(),
      address_line_2: supplierAddressLine2.trim() || undefined,
      city: supplierCity.trim(),
      postal_code: supplierPostalCode.trim(),
      state: supplierState.trim(),
      country: supplierCountry.name,
      lat: supplierLat.trim() || undefined,
      lng: supplierLng.trim() || undefined,
      status: supplierStatus.trim() || 'pending',
      online: false,
      ratings: supplierRatings.trim() || '0',
      verified: false,
    });

    console.log('handleRegisterSupplier', response);
    if (hasResponseError(response)) {
      Alert.alert(
        'Registration failed',
        getResponseMessage(response, 'Unable to submit supplier registration.'),
      );
      return;
    }

    setShowSupplierRegistration(false);
    resetSupplierForm();
    Alert.alert(
      'Application submitted',
      getResponseMessage(
        response,
        'Your application is under review and we will let you know once verified.',
      ),
    );
  };

  const handleForgotPasswordRequestOtp = async () => {
    setDidAttemptForgotPassword(true);
    if (isForgotPasswordRequestDisabled) {
      return;
    }

    const response = await SupplierApi.requestOtp({
      phone: normalizedForgotPasswordPhone,
    });

    console.log('handleForgotPasswordRequestOtp', response);
    if (hasResponseError(response)) {
      Alert.alert(
        'OTP request failed',
        getResponseMessage(response, 'Unable to send OTP. Please try again.'),
      );
      return;
    }

    setForgotPasswordOtpRequested(true);
    Alert.alert(
      'OTP sent',
      getResponseMessage(response, 'Enter the OTP sent to your phone to continue.'),
    );
  };

  const handleForgotPasswordVerify = async () => {
    setDidAttemptForgotPassword(true);
    if (isForgotPasswordVerifyDisabled) {
      return;
    }

    const response = await SupplierApi.loginWithOtp({
      phone: normalizedForgotPasswordPhone,
      otp: forgotPasswordOtp.trim(),
    });

    console.log('handleForgotPasswordVerify', response);
    if (completeLogin(response)) {
      closeForgotPassword();
      return;
    }

    Alert.alert(
      'OTP verification failed',
      getResponseMessage(response, 'Invalid OTP. Please try again.'),
    );
  };

  const renderValidationMessage = (visible: boolean, message: string) => {
    if (!visible || !message) {
      return null;
    }

    return (
      <AppText style={[styles.validationText, { color: palette.error }]}>
        {message}
      </AppText>
    );
  };

  return (
    <>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: palette.screenBackground, paddingTop: insets.top },
        ]}
      >
        <StatusBar barStyle={theme.statusBarStyle} />
        <View pointerEvents="none" style={styles.backgroundDecor}>
          <View
            style={[
              styles.decorBubble,
              styles.decorTop,
              { backgroundColor: palette.decorTop },
            ]}
          />
          <View
            style={[
              styles.decorBubble,
              styles.decorBottom,
              { backgroundColor: palette.decorBottom },
            ]}
          />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { backgroundColor: palette.screenBackground },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.headerSection, loginHeaderAnimatedStyle]}>
              <Image source={APP_LOGO} style={styles.loginLogo} resizeMode="contain" />
              <AppText i18nKey={titleKey} style={[styles.title, { color: palette.heading }]} />
              <AppText style={[styles.subtitle, { color: palette.subtleText }]}>
                {t(
                  loginMethod === 'password'
                    ? 'signInWithPhonePasswordSubtitle'
                    : 'signInWithOtpSubtitle',
                )}
              </AppText>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                loginCardAnimatedStyle,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.surfaceBorder,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <AppInput
                placeholder={t('loginPhonePlaceholder')}
                value={loginPhone}
                onChangeText={value => setLoginPhone(value.replace(/\D/g, ''))}
                onBlur={() => markLoginTouched('phone')}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="next"
                maxLength={10}
                style={styles.input}
                hasError={shouldShowLoginError('phone') && Boolean(loginErrors.phone)}
              />
              {renderValidationMessage(
                shouldShowLoginError('phone'),
                loginErrors.phone,
              )}

              {loginMethod === 'password' ? (
                <>
                  <AppInput
                    placeholderKey="passwordPlaceholder"
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => markLoginTouched('password')}
                    secureTextEntry
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="done"
                    style={styles.input}
                    hasError={
                      shouldShowLoginError('password') && Boolean(loginErrors.password)
                    }
                  />
                  {renderValidationMessage(
                    shouldShowLoginError('password'),
                    loginErrors.password,
                  )}
                  <AppButton
                    title={t('forgotPasswordLink')}
                    onPress={openForgotPassword}
                    variant="ghost"
                    style={styles.inlineActionButton}
                    textStyle={{ color: palette.accentStrong }}
                  />
                  <AppButton
                    title={t('loginButton')}
                    onPress={handlePasswordLogin}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: palette.accent,
                        borderColor: palette.accent,
                      },
                    ]}
                    textStyle={{ color: palette.accentTextOnFill }}
                  />
                </>
              ) : (
                <>
                  <AppButton
                    title={t(otpRequested ? 'resendOtpButton' : 'requestOtpButton')}
                    onPress={handleRequestOtp}
                    style={[
                      styles.secondaryButton,
                      {
                        backgroundColor: palette.accentSoft,
                        borderColor: palette.accentSoftBorder,
                      },
                    ]}
                    textStyle={{ color: palette.accentStrong }}
                  />
                  <AppInput
                    placeholder={t('otpPlaceholder')}
                    value={otp}
                    onChangeText={value => setOtp(value.replace(/\D/g, ''))}
                    onBlur={() => markLoginTouched('otp')}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={6}
                    style={styles.input}
                    hasError={shouldShowLoginError('otp') && Boolean(loginErrors.otp)}
                  />
                  {renderValidationMessage(
                    shouldShowLoginError('otp'),
                    loginErrors.otp,
                  )}
                  {otpRequested ? (
                    <AppText style={[styles.helperText, { color: palette.subtleText }]}>
                      {t('otpSentHelperText')}
                    </AppText>
                  ) : null}
                  <AppButton
                    title={t('verifyOtpButton')}
                    onPress={handleOtpLogin}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: palette.accent,
                        borderColor: palette.accent,
                      },
                    ]}
                    textStyle={{ color: palette.accentTextOnFill }}
                  />
                </>
              )}

              <AppButton
                title={t('becomeSupplierButton')}
                onPress={openSupplierRegistration}
                style={[
                  styles.ctaButton,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
                textStyle={{ color: palette.accentStrong }}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showSupplierRegistration} animationType="slide" transparent>
        <SafeAreaView
          style={[
            styles.safeArea,
            {
              backgroundColor: palette.screenBackground,
              paddingTop: insets.top,
            },
          ]}
        >
          <StatusBar barStyle={theme.statusBarStyle} />
          <ScrollView
            contentContainerStyle={[
              styles.registrationContainer,
              { backgroundColor: palette.screenBackground },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[styles.registrationHeaderRow, registerHeaderAnimatedStyle]}
            >
              <Image source={APP_LOGO} style={styles.registrationLogo} resizeMode="contain" />
              <View style={styles.registrationHeaderCopy}>
                <AppText
                  i18nKey="supplierRegistrationTitle"
                  style={[styles.registrationTitle, { color: palette.heading }]}
                />
                <AppText
                  style={[styles.registrationSubtitle, { color: palette.subtleText }]}
                >
                  {t('supplierRegistrationShortSubtitle')}
                </AppText>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                registerCardAnimatedStyle,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.surfaceBorder,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <AppInput
                placeholder={t('businessNamePlaceholder')}
                value={supplierName}
                onChangeText={setSupplierName}
                onBlur={() => markRegisterTouched('name')}
                autoCapitalize="words"
                keyboardType="default"
                returnKeyType="next"
                style={styles.input}
                hasError={shouldShowRegisterError('name') && Boolean(registerErrors.name)}
              />
              {renderValidationMessage(
                shouldShowRegisterError('name'),
                registerErrors.name,
              )}

              <View style={styles.phoneInputContainer}>
                <AppCountryPicker
                  selectedCountry={supplierCountry}
                  onCountrySelect={setSupplierCountry}
                />
                <View style={styles.inputWrapper}>
                  <AppText style={[styles.dialCode, { color: palette.accentStrong }]}>
                    {supplierCountry.dialCode}
                  </AppText>
                  <AppInput
                    placeholder={t('businessMobilePlaceholder')}
                    value={supplierPhone}
                    onChangeText={value => setSupplierPhone(value.replace(/\D/g, ''))}
                    onBlur={() => markRegisterTouched('phone')}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    returnKeyType="next"
                    maxLength={10}
                    style={styles.phoneInput}
                    hasError={
                      shouldShowRegisterError('phone') && Boolean(registerErrors.phone)
                    }
                  />
                </View>
              </View>
              {renderValidationMessage(
                shouldShowRegisterError('phone'),
                registerErrors.phone,
              )}

              <AppInput
                placeholder={t('businessEmailPlaceholder')}
                value={supplierEmail}
                onChangeText={setSupplierEmail}
                onBlur={() => markRegisterTouched('email')}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                returnKeyType="next"
                style={styles.input}
                hasError={shouldShowRegisterError('email') && Boolean(registerErrors.email)}
              />
              {renderValidationMessage(
                shouldShowRegisterError('email'),
                registerErrors.email,
              )}

              <AppInput
                placeholderKey="passwordPlaceholder"
                value={supplierPassword}
                onChangeText={setSupplierPassword}
                onBlur={() => markRegisterTouched('password')}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="next"
                style={styles.input}
                hasError={
                  shouldShowRegisterError('password') && Boolean(registerErrors.password)
                }
              />
              {renderValidationMessage(
                shouldShowRegisterError('password'),
                registerErrors.password,
              )}

              <AppInput
                placeholder={t('businessGstPlaceholder')}
                value={supplierGstin}
                onChangeText={value => setSupplierGstin(value.toUpperCase())}
                onBlur={() => markRegisterTouched('gstin')}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="next"
                maxLength={15}
                style={styles.input}
                hasError={shouldShowRegisterError('gstin') && Boolean(registerErrors.gstin)}
              />
              {renderValidationMessage(
                shouldShowRegisterError('gstin'),
                registerErrors.gstin,
              )}

              <AppInput
                placeholder={t('cinPlaceholder')}
                value={supplierCin}
                onChangeText={value => setSupplierCin(value.toUpperCase())}
                onBlur={() => markRegisterTouched('cin')}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="next"
                maxLength={21}
                style={styles.input}
                hasError={shouldShowRegisterError('cin') && Boolean(registerErrors.cin)}
              />
              {renderValidationMessage(
                shouldShowRegisterError('cin'),
                registerErrors.cin,
              )}

              <AppInput
                placeholder={t('addressLine1Placeholder')}
                value={supplierAddressLine1}
                onChangeText={setSupplierAddressLine1}
                onBlur={() => markRegisterTouched('address1')}
                autoCapitalize="words"
                returnKeyType="next"
                style={styles.input}
                hasError={
                  shouldShowRegisterError('address1') && Boolean(registerErrors.address1)
                }
              />
              {renderValidationMessage(
                shouldShowRegisterError('address1'),
                registerErrors.address1,
              )}

              <AppInput
                placeholder={t('addressLine2Placeholder')}
                value={supplierAddressLine2}
                onChangeText={setSupplierAddressLine2}
                onBlur={() => markRegisterTouched('address2')}
                autoCapitalize="words"
                returnKeyType="next"
                style={styles.input}
                hasError={
                  shouldShowRegisterError('address2') && Boolean(registerErrors.address2)
                }
              />
              {renderValidationMessage(
                shouldShowRegisterError('address2'),
                registerErrors.address2,
              )}

              <View style={styles.doubleFieldRow}>
                <View style={styles.doubleFieldCell}>
                  <AppInput
                    placeholder={t('cityPlaceholder')}
                    value={supplierCity}
                    onChangeText={setSupplierCity}
                    onBlur={() => markRegisterTouched('city')}
                    autoCapitalize="words"
                    returnKeyType="next"
                    style={styles.compactInput}
                    hasError={shouldShowRegisterError('city') && Boolean(registerErrors.city)}
                  />
                  {renderValidationMessage(
                    shouldShowRegisterError('city'),
                    registerErrors.city,
                  )}
                </View>
                <View style={styles.doubleFieldCell}>
                  <AppInput
                    placeholder={t('postalCodePlaceholder')}
                    value={supplierPostalCode}
                    onChangeText={value => setSupplierPostalCode(value.replace(/\D/g, ''))}
                    onBlur={() => markRegisterTouched('postalCode')}
                    keyboardType="number-pad"
                    returnKeyType="next"
                    maxLength={6}
                    style={styles.compactInput}
                    hasError={
                      shouldShowRegisterError('postalCode') &&
                      Boolean(registerErrors.postalCode)
                    }
                  />
                  {renderValidationMessage(
                    shouldShowRegisterError('postalCode'),
                    registerErrors.postalCode,
                  )}
                </View>
              </View>

              <AppInput
                placeholder={t('statePlaceholder')}
                value={supplierState}
                onChangeText={setSupplierState}
                onBlur={() => markRegisterTouched('state')}
                autoCapitalize="words"
                returnKeyType="next"
                style={styles.input}
                hasError={shouldShowRegisterError('state') && Boolean(registerErrors.state)}
              />
              {renderValidationMessage(
                shouldShowRegisterError('state'),
                registerErrors.state,
              )}

              {/* <View style={styles.doubleFieldRow}>
                <View style={styles.doubleFieldCell}>
                  <AppInput
                    placeholder={t('latitudePlaceholder')}
                    value={supplierLat}
                    onChangeText={setSupplierLat}
                    onBlur={() => markRegisterTouched('lat')}
                    keyboardType={decimalKeyboardType}
                    returnKeyType="next"
                    style={styles.compactInput}
                  />
                  {renderValidationMessage(
                    shouldShowRegisterError('lat'),
                    registerErrors.lat,
                  )}
                </View>
                <View style={styles.doubleFieldCell}>
                  <AppInput
                    placeholder={t('longitudePlaceholder')}
                    value={supplierLng}
                    onChangeText={setSupplierLng}
                    onBlur={() => markRegisterTouched('lng')}
                    keyboardType={decimalKeyboardType}
                    returnKeyType="next"
                    style={styles.compactInput}
                  />
                  {renderValidationMessage(
                    shouldShowRegisterError('lng'),
                    registerErrors.lng,
                  )}
                </View>
              </View> */}

              {/* <View style={styles.doubleFieldRow}>
                <View style={styles.doubleFieldCell}>
                  <AppInput
                    placeholder={t('supplierStatusPlaceholder')}
                    value={supplierStatus}
                    onChangeText={setSupplierStatus}
                    onBlur={() => markRegisterTouched('status')}
                    autoCapitalize="none"
                    returnKeyType="next"
                    style={styles.compactInput}
                  />
                  {renderValidationMessage(
                    shouldShowRegisterError('status'),
                    registerErrors.status,
                  )}
                </View>
                <View style={styles.doubleFieldCell}>
                  <AppInput
                    placeholder={t('supplierRatingsPlaceholder')}
                    value={supplierRatings}
                    onChangeText={setSupplierRatings}
                    onBlur={() => markRegisterTouched('ratings')}
                    keyboardType={decimalKeyboardType}
                    returnKeyType="done"
                    style={styles.compactInput}
                  />
                  {renderValidationMessage(
                    shouldShowRegisterError('ratings'),
                    registerErrors.ratings,
                  )}
                </View>
              </View> */}

              <AppButton
                title={t('submitApplicationButton')}
                onPress={handleRegisterSupplier}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: palette.accent,
                    borderColor: palette.accent,
                  },
                ]}
                textStyle={{ color: palette.accentTextOnFill }}
              />
              <AppButton
                title={t('backToLogin')}
                onPress={closeSupplierRegistration}
                style={[
                  styles.modalSecondaryButton,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
                textStyle={{ color: palette.accentStrong }}
              />
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <SafeAreaView
          style={[
            styles.safeArea,
            {
              backgroundColor: palette.screenBackground,
              paddingTop: insets.top,
            },
          ]}
        >
          <StatusBar barStyle={theme.statusBarStyle} />
          <ScrollView
            contentContainerStyle={[
              styles.registrationContainer,
              styles.forgotPasswordContainer,
              { backgroundColor: palette.screenBackground },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[styles.registrationHeaderRow, forgotHeaderAnimatedStyle]}
            >
              <Image source={APP_LOGO} style={styles.registrationLogo} resizeMode="contain" />
              <View style={styles.registrationHeaderCopy}>
                <AppText
                  i18nKey="forgotPasswordTitle"
                  style={[styles.registrationTitle, { color: palette.heading }]}
                />
                <AppText
                  style={[styles.registrationSubtitle, { color: palette.subtleText }]}
                >
                  {t('forgotPasswordSubtitle')}
                </AppText>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                forgotCardAnimatedStyle,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.surfaceBorder,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <AppText style={[styles.helperCopy, { color: palette.subtleText }]}>
                {t('forgotPasswordRecoveryNote')}
              </AppText>

              <AppInput
                placeholder={t('loginPhonePlaceholder')}
                value={forgotPasswordPhone}
                onChangeText={value => setForgotPasswordPhone(value.replace(/\D/g, ''))}
                onBlur={() => markForgotPasswordTouched('phone')}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="next"
                maxLength={10}
                style={styles.input}
                hasError={
                  shouldShowForgotPasswordError('phone') &&
                  Boolean(forgotPasswordErrors.phone)
                }
              />
              {renderValidationMessage(
                shouldShowForgotPasswordError('phone'),
                forgotPasswordErrors.phone,
              )}

              <AppButton
                title={t(forgotPasswordOtpRequested ? 'resendOtpButton' : 'sendOtpButton')}
                onPress={handleForgotPasswordRequestOtp}
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
                textStyle={{ color: palette.accentStrong }}
              />

              {forgotPasswordOtpRequested ? (
                <>
                  <AppInput
                    placeholder={t('otpPlaceholder')}
                    value={forgotPasswordOtp}
                    onChangeText={value => setForgotPasswordOtp(value.replace(/\D/g, ''))}
                    onBlur={() => markForgotPasswordTouched('otp')}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={6}
                    style={styles.input}
                    hasError={
                      shouldShowForgotPasswordError('otp') &&
                      Boolean(forgotPasswordErrors.otp)
                    }
                  />
                  {renderValidationMessage(
                    shouldShowForgotPasswordError('otp'),
                    forgotPasswordErrors.otp,
                  )}
                  <AppText style={[styles.helperText, { color: palette.subtleText }]}>
                    {t('forgotPasswordOtpHelper')}
                  </AppText>
                  <AppButton
                    title={t('verifyOtpButton')}
                    onPress={handleForgotPasswordVerify}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: palette.accent,
                        borderColor: palette.accent,
                      },
                    ]}
                    textStyle={{ color: palette.accentTextOnFill }}
                  />
                </>
              ) : null}

              <AppButton
                title={t('backToLogin')}
                onPress={closeForgotPassword}
                style={[
                  styles.modalSecondaryButton,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
                textStyle={{ color: palette.accentStrong }}
              />
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  registrationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexGrow: 1,
  },
  backgroundDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  decorBubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorTop: {
    width: 240,
    height: 240,
    top: -72,
    right: -88,
  },
  decorBottom: {
    width: 180,
    height: 180,
    bottom: 140,
    left: -72,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLogo: {
    width: 88,
    height: 88,
    marginBottom: 14,
  },
  registrationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
  },
  registrationLogo: {
    width: 60,
    height: 60,
  },
  registrationHeaderCopy: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  registrationTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  registrationSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },
  input: {
    marginBottom: 10,
  },
  compactInput: {
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    marginLeft: 0,
  },
  doubleFieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  doubleFieldCell: {
    flex: 1,
  },
  validationText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
    marginBottom: 8,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    marginTop: 6,
  },
  ctaButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  modalSecondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -2,
    marginBottom: 10,
  },
  helperCopy: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  inlineActionButton: {
    minHeight: 0,
    alignSelf: 'flex-end',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: -2,
    marginBottom: 10,
  },
  forgotPasswordContainer: {
    justifyContent: 'center',
  },
});
