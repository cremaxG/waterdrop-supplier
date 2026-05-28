import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppBackButton,
  AppButton,
  AppCountryPicker,
  AppInput,
  AppText,
} from '../../components';
import { Country, DEFAULT_COUNTRY } from '../../constants/countries';
import { useAppAlert, useTheme, useTranslation } from '../../providers/AppProviders';
import SupplierApi, { extractOtpFromResponse } from '../../service/supplierApi';
import { getStorage } from '../../utils/Storage';

const APP_LOGO = require('../../../assets/splash/appIcon.png');

type SupplierLoginMethod = 'password' | 'otp';
type LoginField = 'phone' | 'password' | 'otp';
type ForgotPasswordField = 'phone' | 'otp' | 'password' | 'confirmPassword';
type RegisterField =
  | 'name'
  | 'phone'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'gstin'
  | 'cin'
  | 'address1'
  | 'address2'
  | 'city'
  | 'postalCode'
  | 'state';
type SubmitAction =
  | 'password-login'
  | 'login-request-otp'
  | 'login-otp'
  | 'supplier-register'
  | 'forgot-request-otp'
  | 'forgot-reset'
  | null;

const OTP_RESEND_COOLDOWN_SECONDS = 45;

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

function getResponseMessage(response: any, fallback: string) {
  return response?.message ?? response?.error?.message ?? response?.data?.message ?? fallback;
}

function getThrownMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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

function formatPhoneWithCountry(phone: string, countryDialCode: string) {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  return `${countryDialCode}${digits}`;
}

function maskPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) {
    return value;
  }

  const tail = digits.slice(-4);
  const maskedPrefix = digits
    .slice(0, -4)
    .replace(/\d/g, '•')
    .replace(/(.{3})/g, '$1 ')
    .trim();

  return `${maskedPrefix} ${tail}`.trim();
}

interface OtpPinInputProps {
  value: string;
  onChangeText: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

function OtpPinInput({ value, onChangeText, error, disabled }: OtpPinInputProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setFocused] = useState(false);
  const paddedValue = value.padEnd(6, ' ');
  const digits = paddedValue.split('');

  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          inputRef.current?.focus();
        }
      }}
      style={styles.otpPinContainer}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={nextValue => {
          const sanitized = String(nextValue).replace(/\D/g, '').slice(0, 6);
          onChangeText(sanitized);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.otpHiddenInput}
      />
      <View style={styles.otpPinRow}>
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.otpPinCell,
              isFocused && styles.otpPinCellFocused,
              error && styles.otpPinCellError,
            ]}
          >
            <AppText style={styles.otpPinText}>
              {digit !== ' ' ? digit : ''}
            </AppText>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export function AuthScreen({
  onSignIn,
  titleKey = 'signInTitle',
}: AuthScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { showAlert } = useAppAlert();
  const insets = useSafeAreaInsets();
  const isDark = theme.statusBarStyle === 'light-content';
  const modalTopInset = insets.top + 18;
  const palette = {
    screenBackground: isDark ? '#071827' : '#F0FBFF',
    surface: isDark ? '#102235' : '#FFFFFF',
    surfaceBorder: isDark ? 'rgba(56, 189, 248, 0.2)' : '#C7E6F8',
    heading: isDark ? '#F3FBFF' : '#0B1F33',
    subtleText: isDark ? '#9CB8CC' : '#5E7B8E',
    accent: isDark ? '#38BDF8' : '#0EA5E9',
    accentStrong: isDark ? '#67E8F9' : '#0369A1',
    accentSoft: isDark ? 'rgba(56, 189, 248, 0.16)' : '#DFF6FF',
    accentSoftBorder: isDark ? 'rgba(103, 232, 249, 0.28)' : '#B7E6FA',
    accentTextOnFill: '#F8FAFC',
    decorTop: isDark ? 'rgba(34, 211, 238, 0.18)' : 'rgba(14, 165, 233, 0.18)',
    decorBottom: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(2, 132, 199, 0.14)',
    shadow: isDark ? '#020617' : '#0F172A',
    error: isDark ? '#FCA5A5' : '#DC2626',
  };

  const loginHeaderProgress = useRef(new Animated.Value(0)).current;
  const loginCardProgress = useRef(new Animated.Value(0)).current;
  const registerHeaderProgress = useRef(new Animated.Value(0)).current;
  const registerCardProgress = useRef(new Animated.Value(0)).current;
  const forgotHeaderProgress = useRef(new Animated.Value(0)).current;
  const forgotCardProgress = useRef(new Animated.Value(0)).current;
  const loginModeContentProgress = useRef(new Animated.Value(1)).current;
  const lastLoginOtpRef = useRef<Record<string, string>>({});
  const lastForgotPasswordOtpRef = useRef<Record<string, string>>({});
  const pendingAutoLoginOtpRef = useRef<{ phone: string; otp: string } | null>(null);
  const pendingAutoForgotOtpRef = useRef<{ phone: string; otp: string } | null>(null);
  const handleOtpLoginRef = useRef<() => void>(() => {});
  const handleForgotPasswordVerifyRef = useRef<() => void>(() => {});

  const [loginMethod, setLoginMethod] = useState<SupplierLoginMethod>('password');
  const [loginCountry, setLoginCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [forgotPasswordCountry, setForgotPasswordCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [loginPhone, setLoginPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loginOtpCooldownSeconds, setLoginOtpCooldownSeconds] = useState(0);
  const [showSupplierRegistration, setShowSupplierRegistration] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('');
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [forgotPasswordPassword, setForgotPasswordPassword] = useState('');
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState('');
  const [forgotPasswordOtpRequested, setForgotPasswordOtpRequested] = useState(false);
  const [forgotOtpCooldownSeconds, setForgotOtpCooldownSeconds] = useState(0);
  const [supplierCountry, setSupplierCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPassword, setSupplierPassword] = useState('');
  const [supplierConfirmPassword, setSupplierConfirmPassword] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierCin, setSupplierCin] = useState('');
  const [supplierAddressLine1, setSupplierAddressLine1] = useState('');
  const [supplierAddressLine2, setSupplierAddressLine2] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierPostalCode, setSupplierPostalCode] = useState('');
  const [supplierState, setSupplierState] = useState('');
  const [submitAction, setSubmitAction] = useState<SubmitAction>(null);
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
  const formattedLoginPhone = formatPhoneWithCountry(normalizedLoginPhone, loginCountry.dialCode);
  const formattedForgotPasswordPhone = formatPhoneWithCountry(normalizedForgotPasswordPhone, forgotPasswordCountry.dialCode);
  const maskedLoginPhone = maskPhoneNumber(formattedLoginPhone);
  const maskedForgotPasswordPhone = maskPhoneNumber(formattedForgotPasswordPhone);
  const surfacedLoginOtp = otp || lastLoginOtpRef.current[formattedLoginPhone] || '';
  const surfacedForgotPasswordOtp =
    forgotPasswordOtp || lastForgotPasswordOtpRef.current[formattedForgotPasswordPhone] || '';
  const normalizedGstin = supplierGstin.trim().toUpperCase();
  const normalizedCin = supplierCin.trim().toUpperCase();

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

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

  useEffect(() => {
    const cachedOtp = lastLoginOtpRef.current[formattedLoginPhone];
    if (otpRequested && !otp && cachedOtp) {
      setOtp(cachedOtp);
    }
  }, [formattedLoginPhone, otp, otpRequested]);

  useEffect(() => {
    const cachedOtp = lastForgotPasswordOtpRef.current[formattedForgotPasswordPhone];
    if (
      forgotPasswordOtpRequested &&
      !forgotPasswordOtp &&
      cachedOtp
    ) {
      setForgotPasswordOtp(cachedOtp);
    }
  }, [
    forgotPasswordOtp,
    forgotPasswordOtpRequested,
    formattedForgotPasswordPhone,
  ]);

  useEffect(() => {
    if (loginOtpCooldownSeconds <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setLoginOtpCooldownSeconds(current => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loginOtpCooldownSeconds]);

  useEffect(() => {
    if (forgotOtpCooldownSeconds <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setForgotOtpCooldownSeconds(current => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [forgotOtpCooldownSeconds]);

  useEffect(() => {
    const pendingOtp = pendingAutoLoginOtpRef.current;
    if (!pendingOtp) {
      return;
    }

    if (
      loginMethod !== 'otp' ||
      !otpRequested ||
      isBusy ||
      formattedLoginPhone !== pendingOtp.phone ||
      otp !== pendingOtp.otp ||
      pendingOtp.otp.length < 6
    ) {
      return;
    }

    pendingAutoLoginOtpRef.current = null;
    requestAnimationFrame(() => {
      handleOtpLoginRef.current();
    });
  }, [formattedLoginPhone, isBusy, loginMethod, otp, otpRequested]);

  useEffect(() => {
    const pendingOtp = pendingAutoForgotOtpRef.current;
    if (!pendingOtp) {
      return;
    }

    if (
      !forgotPasswordOtpRequested ||
      showResetPassword ||
      isBusy ||
      formattedForgotPasswordPhone !== pendingOtp.phone ||
      forgotPasswordOtp !== pendingOtp.otp ||
      pendingOtp.otp.length < 6
    ) {
      return;
    }

    pendingAutoForgotOtpRef.current = null;
    requestAnimationFrame(() => {
      handleForgotPasswordVerifyRef.current();
    });
  }, [
    forgotPasswordOtp,
    forgotPasswordOtpRequested,
    formattedForgotPasswordPhone,
    isBusy,
    showResetPassword,
  ]);

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
            : otp.trim().length < 6
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
      confirmPassword:
        !supplierConfirmPassword.trim()
          ? 'Please confirm your password.'
          : supplierConfirmPassword.trim() !== supplierPassword.trim()
            ? 'Passwords do not match.'
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
    }),
    [
      normalizedCin,
      normalizedGstin,
      normalizedSupplierPhone,
      supplierAddressLine1,
      supplierAddressLine2,
      supplierCity,
      supplierConfirmPassword,
      supplierEmail,
      supplierName,
      supplierPassword,
      supplierPostalCode,
      supplierState,
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
            : forgotPasswordOtp.trim().length < 6
              ? 'Enter a valid OTP.'
              : ''
          : '',
      password:
        showResetPassword
          ? !forgotPasswordPassword.trim()
            ? 'Password is required.'
            : forgotPasswordPassword.trim().length < 6
              ? 'Password must be at least 6 characters.'
              : ''
          : '',
      confirmPassword:
        showResetPassword
          ? !forgotPasswordConfirmPassword.trim()
            ? 'Please confirm your password.'
            : forgotPasswordConfirmPassword.trim() !== forgotPasswordPassword.trim()
              ? 'Passwords do not match.'
              : ''
          : '',
    }),
    [
      forgotPasswordConfirmPassword,
      forgotPasswordOtp,
      forgotPasswordOtpRequested,
      forgotPasswordPassword,
      normalizedForgotPasswordPhone,
      showResetPassword,
    ],
  );

  const isPasswordLoginDisabled =
    Boolean(loginErrors.phone) || Boolean(loginErrors.password);
  const isOtpRequestDisabled = Boolean(loginErrors.phone);
  const isOtpLoginDisabled = Boolean(loginErrors.phone) || Boolean(loginErrors.otp);
  const isForgotPasswordRequestDisabled = Boolean(forgotPasswordErrors.phone);
  const isForgotPasswordVerifyDisabled =
    Boolean(forgotPasswordErrors.phone) ||
    Boolean(forgotPasswordErrors.otp);
  const isForgotPasswordResetDisabled =
    Boolean(forgotPasswordErrors.phone) ||
    Boolean(forgotPasswordErrors.otp) ||
    Boolean(forgotPasswordErrors.password) ||
    Boolean(forgotPasswordErrors.confirmPassword);
  const isRegisterDisabled = Object.values(registerErrors).some(Boolean);
  const isBusy = submitAction !== null;
  const isLoginOtpResendCoolingDown = otpRequested && loginOtpCooldownSeconds > 0;
  const isForgotOtpResendCoolingDown =
    forgotPasswordOtpRequested && forgotOtpCooldownSeconds > 0;

  const formatOtpCooldownLabel = (baseLabel: string, seconds: number) =>
    `${baseLabel} (${seconds}s)`;

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

  const loginModeContentAnimatedStyle = {
    opacity: loginModeContentProgress,
    transform: [
      {
        translateY: loginModeContentProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
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
    setSupplierConfirmPassword('');
    setSupplierGstin('');
    setSupplierCin('');
    setSupplierAddressLine1('');
    setSupplierAddressLine2('');
    setSupplierCity('');
    setSupplierPostalCode('');
    setSupplierState('');
    setRegisterTouched({});
    setDidAttemptRegister(false);
  };

  const openSupplierRegistration = () => {
    setShowSupplierRegistration(true);
  };

  const resetForgotPasswordForm = () => {
    setForgotPasswordPhone('');
    setForgotPasswordOtp('');
    setForgotPasswordPassword('');
    setForgotPasswordConfirmPassword('');
    setForgotPasswordOtpRequested(false);
    setForgotOtpCooldownSeconds(0);
    setShowResetPassword(false);
    setForgotPasswordTouched({});
    setDidAttemptForgotPassword(false);
    pendingAutoForgotOtpRef.current = null;
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
      showAlert(
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

  const autofillOtpFromResponse = (
    response: unknown,
    target: 'login' | 'forgot',
    phone: string,
  ) => {
    const extractedOtp = extractOtpFromResponse(response);
    if (extractedOtp) {
      if (target === 'login') {
        lastLoginOtpRef.current[phone] = extractedOtp;
        pendingAutoLoginOtpRef.current = { phone, otp: extractedOtp };
        setOtp(extractedOtp);
      }

      if (target === 'forgot') {
        lastForgotPasswordOtpRef.current[phone] = extractedOtp;
        pendingAutoForgotOtpRef.current = { phone, otp: extractedOtp };
        setForgotPasswordOtp(extractedOtp);
      }
    }

    return extractedOtp;
  };

  const handleLoginPhoneChange = (value: string) => {
    const nextPhone = value.replace(/\D/g, '');
    if (nextPhone !== loginPhone) {
      setOtp('');
      setOtpRequested(false);
      setLoginOtpCooldownSeconds(0);
      pendingAutoLoginOtpRef.current = null;
    }

    setLoginPhone(nextPhone);
  };

  const handleForgotPasswordPhoneChange = (value: string) => {
    const nextPhone = value.replace(/\D/g, '');
    if (nextPhone !== forgotPasswordPhone) {
      setForgotPasswordOtp('');
      setForgotPasswordOtpRequested(false);
      setForgotOtpCooldownSeconds(0);
      setShowResetPassword(false);
      pendingAutoForgotOtpRef.current = null;
    }

    setForgotPasswordPhone(nextPhone);
  };

  const handlePasswordLogin = async () => {
    setDidAttemptLogin(true);
    if (isPasswordLoginDisabled || isBusy) {
      return;
    }

    setSubmitAction('password-login');
    try {
      const response = await SupplierApi.loginSupplier({
        phone: formattedLoginPhone,
        password: password.trim(),
      });
      console.log('handlePasswordLogin', response);
      if (completeLogin(response)) {
        return;
      }

      showAlert(
        'Login failed',
        getResponseMessage(response, 'Invalid login credentials.'),
      );
    } catch (error) {
      showAlert(
        'Login failed',
        getThrownMessage(error, 'Unable to sign in right now. Please try again.'),
      );
    } finally {
      setSubmitAction(null);
    }
  };

  const handleRequestOtp = async () => {
    setDidAttemptLogin(true);
    if (isOtpRequestDisabled || isBusy) {
      return;
    }

    setSubmitAction('login-request-otp');
    try {
      delete lastLoginOtpRef.current[formattedLoginPhone];
      pendingAutoLoginOtpRef.current = null;
      setOtp('');

      const response = await SupplierApi.requestOtp({
        phone: formattedLoginPhone,
      });

      console.log('handleRequestOtp', response);
      autofillOtpFromResponse(response, 'login', formattedLoginPhone);

      if (hasResponseError(response)) {
        showAlert(
          'OTP request failed',
          getResponseMessage(response, 'Unable to send OTP. Please try again.'),
        );
        return;
      }

      setOtpRequested(true);
      setLoginOtpCooldownSeconds(OTP_RESEND_COOLDOWN_SECONDS);

      showAlert(
        'OTP sent',
        getResponseMessage(response, 'Enter the OTP sent to your phone to continue.'),
      );
    } catch (error) {
      showAlert(
        'OTP request failed',
        getThrownMessage(error, 'Unable to send OTP right now. Please try again.'),
      );
    } finally {
      setSubmitAction(null);
    }
  };

  const handleOtpLogin = async () => {
    setDidAttemptLogin(true);
    if (isOtpLoginDisabled || isBusy) {
      return;
    }

    setSubmitAction('login-otp');
    try {
      const response = await SupplierApi.loginWithOtp({
        phone: formattedLoginPhone,
        otp: otp.trim(),
      });

      console.log('handleOtpLogin', response);
      autofillOtpFromResponse(response, 'login', formattedLoginPhone);
      if (completeLogin(response)) {
        return;
      }

      showAlert(
        'OTP verification failed',
        getResponseMessage(response, 'Invalid OTP. Please try again.'),
      );
    } catch (error) {
      showAlert(
        'OTP verification failed',
        getThrownMessage(error, 'Unable to verify OTP right now. Please try again.'),
      );
    } finally {
      setSubmitAction(null);
    }
  };
  handleOtpLoginRef.current = handleOtpLogin;

  const handleLoginMethodChange = (nextMethod: SupplierLoginMethod) => {
    if (nextMethod === loginMethod || isBusy) {
      return;
    }

    loginModeContentProgress.stopAnimation();

    LayoutAnimation.configureNext({
      duration: 280,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        springDamping: 0.82,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    setLoginMethod(nextMethod);
    setPassword('');
    setLoginTouched({});
    setDidAttemptLogin(false);

    loginModeContentProgress.setValue(0.78);
    requestAnimationFrame(() => {
      Animated.timing(loginModeContentProgress, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRegisterSupplier = async () => {
    setDidAttemptRegister(true);
    if (isRegisterDisabled || isBusy) {
      return;
    }

    setSubmitAction('supplier-register');
    try {
      const response = await SupplierApi.registerSupplier({
        name: supplierName.trim(),
        phone: normalizedSupplierPhone,
        email: supplierEmail.trim().toLowerCase(),
        password: supplierPassword.trim(),
        gstin: normalizedGstin,
        cin: normalizedCin || undefined,
        address_line_1: supplierAddressLine1.trim(),
        address_line_2: supplierAddressLine2.trim() || undefined,
        city: supplierCity.trim(),
        postal_code: supplierPostalCode.trim(),
        state: supplierState.trim(),
        country: supplierCountry.name,
        status: 'pending',
        online: false,
        ratings: '0',
        verified: false,
      });

      console.log('handleRegisterSupplier', response);
      if (hasResponseError(response)) {
        showAlert(
          'Registration failed',
          getResponseMessage(response, 'Unable to submit supplier registration.'),
        );
        return;
      }

      setShowSupplierRegistration(false);
      resetSupplierForm();
      showAlert(
        'Application submitted',
        getResponseMessage(
          response,
          'Your application is under review and we will let you know once verified.',
        ),
      );
    } catch (error) {
      showAlert(
        'Registration failed',
        getThrownMessage(
          error,
          'Unable to submit your application right now. Please try again.',
        ),
      );
    } finally {
      setSubmitAction(null);
    }
  };

  const handleForgotPasswordRequestOtp = async () => {
    setDidAttemptForgotPassword(true);
    if (isForgotPasswordRequestDisabled || isBusy) {
      return;
    }

    setSubmitAction('forgot-request-otp');
    try {
      delete lastForgotPasswordOtpRef.current[formattedForgotPasswordPhone];
      pendingAutoForgotOtpRef.current = null;
      setForgotPasswordOtp('');

      const response = await SupplierApi.requestOtp({
        phone: formattedForgotPasswordPhone,
      });

      console.log('handleForgotPasswordRequestOtp', response);
      autofillOtpFromResponse(response, 'forgot', formattedForgotPasswordPhone);

      if (hasResponseError(response)) {
        showAlert(
          'OTP request failed',
          getResponseMessage(response, 'Unable to send OTP. Please try again.'),
        );
        return;
      }

      setShowResetPassword(false);
      setForgotPasswordOtpRequested(true);
      setForgotOtpCooldownSeconds(OTP_RESEND_COOLDOWN_SECONDS);
      setForgotPasswordConfirmPassword('');

      showAlert(
        'OTP sent',
        getResponseMessage(response, 'Enter the OTP sent to your phone to continue.'),
      );
    } catch (error) {
      showAlert(
        'OTP request failed',
        getThrownMessage(error, 'Unable to send OTP right now. Please try again.'),
      );
    } finally {
      setSubmitAction(null);
    }
  };

  const handleForgotPasswordVerify = () => {
    setDidAttemptForgotPassword(true);
    if (isForgotPasswordVerifyDisabled) {
      return;
    }

    setShowResetPassword(true);
  };
  handleForgotPasswordVerifyRef.current = handleForgotPasswordVerify;

  const handleForgotPasswordReset = async () => {
    setDidAttemptForgotPassword(true);
    if (isForgotPasswordResetDisabled || isBusy) {
      return;
    }

    setSubmitAction('forgot-reset');
    try {
      const response = await SupplierApi.resetPassword({
        phone: formattedForgotPasswordPhone,
        otp: forgotPasswordOtp.trim(),
        password: forgotPasswordPassword.trim(),
      });

      console.log('handleForgotPasswordReset', response);
      autofillOtpFromResponse(response, 'forgot', formattedForgotPasswordPhone);
      if (hasResponseError(response)) {
        showAlert(
          'Password reset failed',
          getResponseMessage(response, 'Unable to reset password. Please try again.'),
        );
        return;
      }

      showAlert(
        'Password reset successful',
        getResponseMessage(response, 'Your password has been updated successfully.'),
      );

      closeForgotPassword();
    } catch (error) {
      showAlert(
        'Password reset failed',
        getThrownMessage(error, 'Unable to reset your password right now. Please try again.'),
      );
    } finally {
      setSubmitAction(null);
    }
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

  // const renderSectionTitle = (
  //   title: string,
  //   infoTitle?: string,
  //   infoMessage?: string,
  // ) => (
  //   <View style={styles.sectionTitleRow}>
  //     <AppText style={[styles.formSectionTitle, { color: palette.heading }]}>
  //       {title}
  //     </AppText>
  //     {infoTitle && infoMessage ? renderInfoButton(infoTitle, infoMessage) : null}
  //   </View>
  // );

  const renderFieldLabel = (label: string, helper?: string) => (
    <View style={styles.fieldHeader}>
      <AppText style={[styles.fieldLabel, { color: palette.heading }]}>{label}</AppText>
      {helper ? (
        <AppText style={[styles.fieldHelperInline, { color: palette.subtleText }]}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );

  const renderStep = (label: string, active: boolean, complete: boolean = false) => {
    const stepContainerStyle = {
      backgroundColor: active ? palette.accentSoft : palette.surface,
      borderColor: active || complete ? palette.accentSoftBorder : palette.surfaceBorder,
    };
    const stepDotStyle = {
      backgroundColor: complete || active ? palette.accentStrong : 'transparent',
      borderColor: complete || active ? palette.accentStrong : palette.surfaceBorder,
    };
    const stepLabelStyle = {
      color: active || complete ? palette.accentStrong : palette.subtleText,
    };

    return (
      <View key={label} style={[styles.stepChip, stepContainerStyle]}>
        <View style={[styles.stepDot, stepDotStyle]} />
        <AppText style={[styles.stepLabel, stepLabelStyle]}>{label}</AppText>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView
        edges={['top']}
        style={[styles.safeArea, { backgroundColor: palette.screenBackground }]}
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
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.headerSection, loginHeaderAnimatedStyle]}>
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <AppText style={[styles.heroBadgeText, { color: palette.accentStrong }]}>
                  SUPPLIER PORTAL
                </AppText>
              </View>
              <Image source={APP_LOGO} style={styles.loginLogo} resizeMode="contain" />
              <AppText i18nKey={titleKey} style={[styles.title, { color: palette.heading }]} />
              {/* <AppText style={[styles.subtitle, { color: palette.subtleText }]}>
                {t(
                  loginMethod === 'password'
                    ? 'signInWithPhonePasswordSubtitle'
                    : 'signInWithOtpSubtitle',
                )}
              </AppText> */}
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
              {/* <View
                style={[
                  styles.cardBanner,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <View style={styles.cardBannerHeader}>
                  <AppText style={[styles.cardBannerTitle, { color: palette.heading }]}>
                    Choose how you want to sign in
                  </AppText>
                  {renderInfoButton(
                    'Sign in options',
                    'Use password for the fastest access. Use OTP if you need a quick verification-based sign in.',
                  )}
                </View>
              </View> */}

              <View
                style={[
                  styles.segmentedControl,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                {([
                  ['password', t('passwordLoginTab')],
                  ['otp', t('otpLoginTab')],
                ] as const).map(([method, label]) => {
                  const selected = loginMethod === method;
                  return (
                    <Pressable
                      key={method}
                      onPress={() => handleLoginMethodChange(method)}
                      style={[
                        styles.segmentedOption,
                        selected && {
                          backgroundColor: palette.surface,
                          borderColor: palette.surfaceBorder,
                        },
                      ]}
                    >
                      <AppText
                        style={[
                          styles.segmentedOptionText,
                          { color: selected ? palette.heading : palette.subtleText },
                        ]}
                      >
                        {label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.formSectionBlock}>
                {/* {renderFieldLabel('Supplier mobile number', 'Used for login, OTP, and recovery')} */}
                <View style={styles.phoneInputContainer}>
                  <AppCountryPicker
                    selectedCountry={loginCountry}
                    onCountrySelect={setLoginCountry}
                    disabled={isBusy}
                  />
                  <View style={styles.inputWrapper}>
                    <AppText style={[styles.dialCode, { color: palette.accentStrong }]}>
                      {loginCountry.dialCode}
                    </AppText>
                    <AppInput
                      placeholder={t('loginPhonePlaceholder')}
                      value={loginPhone}
                      onChangeText={handleLoginPhoneChange}
                      onBlur={() => markLoginTouched('phone')}
                      keyboardType="phone-pad"
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      returnKeyType="next"
                      maxLength={10}
                      editable={!isBusy}
                      style={styles.phoneInput}
                      hasError={shouldShowLoginError('phone') && Boolean(loginErrors.phone)}
                    />
                  </View>
                </View>
                {renderValidationMessage(
                  shouldShowLoginError('phone'),
                  loginErrors.phone,
                )}
              </View>

              <Animated.View style={loginModeContentAnimatedStyle}>
                {loginMethod === 'password' ? (
                  <>
                    <View style={styles.formSectionBlock}>
                      {/* {renderFieldLabel('Password', 'Use the password created for your supplier account')} */}
                      <AppInput
                        placeholderKey="passwordPlaceholder"
                        value={password}
                        onChangeText={setPassword}
                        onBlur={() => markLoginTouched('password')}
                        secureTextEntry
                        textContentType="password"
                        autoComplete="password"
                        returnKeyType="done"
                        editable={!isBusy}
                        style={styles.input}
                        hasError={
                          shouldShowLoginError('password') && Boolean(loginErrors.password)
                        }
                      />
                      {renderValidationMessage(
                        shouldShowLoginError('password'),
                        loginErrors.password,
                      )}
                    </View>
                    <AppButton
                      title={t('forgotPasswordLink')}
                      onPress={openForgotPassword}
                      variant="ghost"
                      disabled={isBusy}
                      style={styles.inlineActionButton}
                      textStyle={{ color: palette.accentStrong }}
                    />
                    <AppButton
                      title="Sign in securely"
                      onPress={handlePasswordLogin}
                      disabled={isPasswordLoginDisabled || isBusy}
                      loading={submitAction === 'password-login'}
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
                      title={
                        otpRequested && loginOtpCooldownSeconds > 0
                          ? formatOtpCooldownLabel(
                              t('resendOtpButton'),
                              loginOtpCooldownSeconds,
                            )
                          : t(otpRequested ? 'resendOtpButton' : 'requestOtpButton')
                      }
                      onPress={handleRequestOtp}
                      disabled={
                        isOtpRequestDisabled || isBusy || isLoginOtpResendCoolingDown
                      }
                      loading={submitAction === 'login-request-otp'}
                      style={[
                        styles.secondaryButton,
                        {
                          backgroundColor: palette.accentSoft,
                          borderColor: palette.accentSoftBorder,
                        },
                      ]}
                      textStyle={{ color: palette.accentStrong }}
                    />
                    {otpRequested ? (
                      <View
                        style={[
                          styles.statusPanelCompact,
                          {
                            backgroundColor: palette.accentSoft,
                            borderColor: palette.accentSoftBorder,
                          },
                        ]}
                      >
                        <AppText style={[styles.statusPanelTitle, { color: palette.heading }]}>
                          Code sent to {maskedLoginPhone}
                        </AppText>
                      </View>
                    ) : null}
                    {otpRequested ? (
                      <>
                        {surfacedLoginOtp ? (
                          <View
                            style={[
                              styles.temporaryOtpPanel,
                              {
                                backgroundColor: palette.accentSoft,
                                borderColor: palette.accentSoftBorder,
                              },
                            ]}
                          >
                            <AppText
                              style={[styles.temporaryOtpLabel, { color: palette.subtleText }]}
                            >
                              Temporary OTP for testing
                            </AppText>
                            <AppText
                              style={[styles.temporaryOtpValue, { color: palette.accentStrong }]}
                            >
                              {surfacedLoginOtp}
                            </AppText>
                          </View>
                        ) : null}
                        {renderFieldLabel('Verification code', 'Enter the latest 6-digit OTP')}
                        <OtpPinInput
                          value={otp}
                          onChangeText={setOtp}
                          error={shouldShowLoginError('otp') && Boolean(loginErrors.otp)}
                          disabled={!otpRequested}
                        />
                        {renderValidationMessage(
                          shouldShowLoginError('otp'),
                          loginErrors.otp,
                        )}
                        <AppText style={[styles.helperText, { color: palette.subtleText }]}>
                          {t('otpSentHelperText')}
                        </AppText>
                        <AppButton
                          title={
                            loginOtpCooldownSeconds > 0
                              ? formatOtpCooldownLabel(
                                  t('resendOtpButton'),
                                  loginOtpCooldownSeconds,
                                )
                              : t('resendOtpButton')
                          }
                          variant="ghost"
                          onPress={handleRequestOtp}
                          disabled={isBusy || isLoginOtpResendCoolingDown}
                          style={styles.linkButton}
                          textStyle={{ color: palette.accentStrong }}
                        />
                        <AppButton
                          title="Verify and continue"
                          onPress={handleOtpLogin}
                          disabled={isOtpLoginDisabled || isBusy}
                          loading={submitAction === 'login-otp'}
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
                  </>
                )}
              </Animated.View>

              <View style={[styles.sectionDivider, { backgroundColor: palette.surfaceBorder }]} />
              <View
                style={[
                  styles.ctaPanel,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                {/* <View style={styles.ctaPanelHeader}>
                  <AppText style={[styles.ctaPanelTitle, { color: palette.heading }]}>
                    New supplier onboarding
                  </AppText>
                  {renderInfoButton(
                    'Supplier onboarding',
                    'Share your business, compliance, and address details once. The account stays under review until verification is complete.',
                  )}
                </View> */}
                <AppButton
                  title={t('becomeSupplierButton')}
                  onPress={openSupplierRegistration}
                  disabled={isBusy}
                  style={[
                    styles.ctaButton,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceBorder,
                    },
                  ]}
                  textStyle={{ color: palette.accentStrong }}
                />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={showSupplierRegistration}
        animationType="slide"
        onRequestClose={closeSupplierRegistration}
        transparent
      >
        <SafeAreaView
          edges={['left', 'right', 'bottom']}
          style={[styles.safeArea, { backgroundColor: palette.screenBackground }]}
        >
          <StatusBar barStyle={theme.statusBarStyle} />
          <ScrollView
            contentContainerStyle={[
              styles.registrationContainer,
              { paddingTop: modalTopInset },
              { backgroundColor: palette.screenBackground },
            ]}
            contentInsetAdjustmentBehavior="never"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppBackButton
              onPress={closeSupplierRegistration}
              label={t('backToLogin')}
            />
            <Animated.View
              style={[styles.registrationHeaderRow, registerHeaderAnimatedStyle]}
            >
              <Image source={APP_LOGO} style={styles.registrationLogo} resizeMode="contain" />
              <View style={styles.registrationHeaderCopy}>
                <View
                  style={[
                    styles.modalBadge,
                    {
                      backgroundColor: palette.accentSoft,
                      borderColor: palette.accentSoftBorder,
                    },
                  ]}
                >
                  <AppText style={[styles.modalBadgeText, { color: palette.accentStrong }]}>
                    APPLICATION
                  </AppText>
                </View>
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

            <View style={styles.stepRow}>
              {renderStep('Account', true, true)}
              {renderStep('Business', true, true)}
              {renderStep('Address', true, true)}
            </View>

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
              <View style={styles.formSectionBlock}>
                <AppText style={[styles.formSectionEyebrow, { color: palette.accentStrong }]}>
                  ACCOUNT ACCESS
                </AppText>
                {/* {renderSectionTitle(
                  'Contact and sign-in details',
                  'Account access',
                  'These details help your team sign in and help us verify who owns the supplier account.',
                )} */}

                {renderFieldLabel('Business name')}
                <AppInput
                  placeholder={t('businessNamePlaceholder')}
                  value={supplierName}
                  onChangeText={setSupplierName}
                  onBlur={() => markRegisterTouched('name')}
                  autoCapitalize="words"
                  keyboardType="default"
                  returnKeyType="next"
                  editable={!isBusy}
                  style={styles.input}
                  hasError={shouldShowRegisterError('name') && Boolean(registerErrors.name)}
                />
                {renderValidationMessage(
                  shouldShowRegisterError('name'),
                  registerErrors.name,
                )}

                {renderFieldLabel('Business mobile number')}
                <View style={styles.phoneInputContainer}>
                  <AppCountryPicker
                    selectedCountry={supplierCountry}
                    onCountrySelect={setSupplierCountry}
                    disabled={isBusy}
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
                      editable={!isBusy}
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

                {renderFieldLabel('Business email')}
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
                  editable={!isBusy}
                  style={styles.input}
                  hasError={shouldShowRegisterError('email') && Boolean(registerErrors.email)}
                />
                {renderValidationMessage(
                  shouldShowRegisterError('email'),
                  registerErrors.email,
                )}

                {renderFieldLabel('Password', 'Minimum 6 characters')}
                <AppInput
                  placeholderKey="passwordPlaceholder"
                  value={supplierPassword}
                  onChangeText={setSupplierPassword}
                  onBlur={() => markRegisterTouched('password')}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="password-new"
                  returnKeyType="next"
                  editable={!isBusy}
                  style={styles.input}
                  hasError={
                    shouldShowRegisterError('password') && Boolean(registerErrors.password)
                  }
                />
                {renderValidationMessage(
                  shouldShowRegisterError('password'),
                  registerErrors.password,
                )}

                {renderFieldLabel('Confirm password')}
                <AppInput
                  placeholderKey="confirmPasswordPlaceholder"
                  value={supplierConfirmPassword}
                  onChangeText={setSupplierConfirmPassword}
                  onBlur={() => markRegisterTouched('confirmPassword')}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="password-new"
                  returnKeyType="next"
                  editable={!isBusy}
                  style={styles.input}
                  hasError={
                    shouldShowRegisterError('confirmPassword') &&
                    Boolean(registerErrors.confirmPassword)
                  }
                />
                {renderValidationMessage(
                  shouldShowRegisterError('confirmPassword'),
                  registerErrors.confirmPassword,
                )}
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: palette.surfaceBorder }]} />

              <View style={styles.formSectionBlock}>
                <AppText style={[styles.formSectionEyebrow, { color: palette.accentStrong }]}>
                  BUSINESS IDENTITY
                </AppText>
                {/* {renderSectionTitle(
                  'Compliance details',
                  'Compliance details',
                  'GSTIN is required for review. CIN is optional when applicable to your business registration.',
                )} */}

                {renderFieldLabel('GSTIN')}
                <AppInput
                  placeholder={t('businessGstPlaceholder')}
                  value={supplierGstin}
                  onChangeText={value => setSupplierGstin(value.toUpperCase())}
                  onBlur={() => markRegisterTouched('gstin')}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="next"
                  maxLength={15}
                  editable={!isBusy}
                  style={styles.input}
                  hasError={shouldShowRegisterError('gstin') && Boolean(registerErrors.gstin)}
                />
                {renderValidationMessage(
                  shouldShowRegisterError('gstin'),
                  registerErrors.gstin,
                )}

                {renderFieldLabel('CIN', 'Optional if not applicable')}
                <AppInput
                  placeholder={t('cinPlaceholder')}
                  value={supplierCin}
                  onChangeText={value => setSupplierCin(value.toUpperCase())}
                  onBlur={() => markRegisterTouched('cin')}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="next"
                  maxLength={21}
                  editable={!isBusy}
                  style={styles.input}
                  hasError={shouldShowRegisterError('cin') && Boolean(registerErrors.cin)}
                />
                {renderValidationMessage(
                  shouldShowRegisterError('cin'),
                  registerErrors.cin,
                )}
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: palette.surfaceBorder }]} />

              <View style={styles.formSectionBlock}>
                <AppText style={[styles.formSectionEyebrow, { color: palette.accentStrong }]}>
                  ADDRESS DETAILS
                </AppText>
                {/* {renderSectionTitle(
                  'Business location',
                  'Business address',
                  'A complete and accurate address helps speed up supplier approval and operations setup later.',
                )} */}

                {renderFieldLabel('Address line 1')}
                <AppInput
                  placeholder={t('addressLine1Placeholder')}
                  value={supplierAddressLine1}
                  onChangeText={setSupplierAddressLine1}
                  onBlur={() => markRegisterTouched('address1')}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isBusy}
                  style={styles.input}
                  hasError={
                    shouldShowRegisterError('address1') && Boolean(registerErrors.address1)
                  }
                />
                {renderValidationMessage(
                  shouldShowRegisterError('address1'),
                  registerErrors.address1,
                )}

                {renderFieldLabel('Address line 2', 'Optional')}
                <AppInput
                  placeholder={t('addressLine2Placeholder')}
                  value={supplierAddressLine2}
                  onChangeText={setSupplierAddressLine2}
                  onBlur={() => markRegisterTouched('address2')}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isBusy}
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
                    {renderFieldLabel('City')}
                    <AppInput
                      placeholder={t('cityPlaceholder')}
                      value={supplierCity}
                      onChangeText={setSupplierCity}
                      onBlur={() => markRegisterTouched('city')}
                      autoCapitalize="words"
                      returnKeyType="next"
                      editable={!isBusy}
                      style={styles.compactInput}
                      hasError={shouldShowRegisterError('city') && Boolean(registerErrors.city)}
                    />
                    {renderValidationMessage(
                      shouldShowRegisterError('city'),
                      registerErrors.city,
                    )}
                  </View>
                  <View style={styles.doubleFieldCell}>
                    {renderFieldLabel('Postal code')}
                    <AppInput
                      placeholder={t('postalCodePlaceholder')}
                      value={supplierPostalCode}
                      onChangeText={value => setSupplierPostalCode(value.replace(/\D/g, ''))}
                      onBlur={() => markRegisterTouched('postalCode')}
                      keyboardType="number-pad"
                      returnKeyType="next"
                      maxLength={6}
                      editable={!isBusy}
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

                {renderFieldLabel('State')}
                <AppInput
                  placeholder={t('statePlaceholder')}
                  value={supplierState}
                  onChangeText={setSupplierState}
                  onBlur={() => markRegisterTouched('state')}
                  autoCapitalize="words"
                  returnKeyType="done"
                  editable={!isBusy}
                  style={styles.input}
                  hasError={shouldShowRegisterError('state') && Boolean(registerErrors.state)}
                />
                {renderValidationMessage(
                  shouldShowRegisterError('state'),
                  registerErrors.state,
                )}
              </View>

              <AppButton
                title="Submit application"
                onPress={handleRegisterSupplier}
                disabled={isRegisterDisabled || isBusy}
                loading={submitAction === 'supplier-register'}
                style={[
                  styles.primaryButton,
                  styles.modalPrimaryButton,
                  {
                    backgroundColor: palette.accent,
                    borderColor: palette.accent,
                  },
                ]}
                textStyle={{ color: palette.accentTextOnFill }}
              />
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showForgotPassword}
        animationType="slide"
        onRequestClose={closeForgotPassword}
        transparent
      >
        <SafeAreaView
          edges={['left', 'right', 'bottom']}
          style={[styles.safeArea, { backgroundColor: palette.screenBackground }]}
        >
          <StatusBar barStyle={theme.statusBarStyle} />
          <ScrollView
            contentContainerStyle={[
              styles.registrationContainer,
              styles.forgotPasswordContainer,
              { paddingTop: modalTopInset },
              { backgroundColor: palette.screenBackground },
            ]}
            contentInsetAdjustmentBehavior="never"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppBackButton
              onPress={closeForgotPassword}
              label={t('backToLogin')}
            />
            <Animated.View
              style={[styles.registrationHeaderRow, forgotHeaderAnimatedStyle]}
            >
              <Image source={APP_LOGO} style={styles.registrationLogo} resizeMode="contain" />
              <View style={styles.registrationHeaderCopy}>
                <View
                  style={[
                    styles.modalBadge,
                    {
                      backgroundColor: palette.accentSoft,
                      borderColor: palette.accentSoftBorder,
                    },
                  ]}
                >
                  <AppText style={[styles.modalBadgeText, { color: palette.accentStrong }]}>
                    RECOVERY
                  </AppText>
                </View>
                <AppText
                  i18nKey={showResetPassword ? 'resetPasswordTitle' : 'forgotPasswordTitle'}
                  style={[styles.registrationTitle, { color: palette.heading }]}
                />
                <AppText
                  style={[styles.registrationSubtitle, { color: palette.subtleText }]}
                >
                  {showResetPassword ? t('resetPasswordSubtitle') : t('forgotPasswordSubtitle')}
                </AppText>
              </View>
            </Animated.View>

            <View style={styles.stepRow}>
              {renderStep('Verify', !showResetPassword, forgotPasswordOtpRequested)}
              {renderStep('Reset', showResetPassword)}
            </View>

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
              {/* <View
                style={[
                  styles.statusPanel,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <AppText style={[styles.statusPanelTitle, { color: palette.heading }]}>
                  Recover access in two quick steps
                </AppText>
                <AppText style={[styles.statusPanelBody, { color: palette.subtleText }]}>
                  {t('forgotPasswordRecoveryNote')}
                </AppText>
              </View> */}

              {!showResetPassword ? (
                <>
                  {/* {renderFieldLabel('Registered mobile number', 'We will send a one-time code here')} */}
                  <View style={styles.phoneInputContainer}>
                    <AppCountryPicker
                      selectedCountry={forgotPasswordCountry}
                      onCountrySelect={setForgotPasswordCountry}
                      disabled={isBusy}
                    />
                    <View style={styles.inputWrapper}>
                      <AppText style={[styles.dialCode, { color: palette.accentStrong }]}>
                        {forgotPasswordCountry.dialCode}
                      </AppText>
                      <AppInput
                        placeholder={t('loginPhonePlaceholder')}
                        value={forgotPasswordPhone}
                        onChangeText={handleForgotPasswordPhoneChange}
                        onBlur={() => markForgotPasswordTouched('phone')}
                        keyboardType="phone-pad"
                        textContentType="telephoneNumber"
                        autoComplete="tel"
                        returnKeyType="next"
                        maxLength={10}
                        editable={!isBusy}
                        style={styles.phoneInput}
                        hasError={
                          shouldShowForgotPasswordError('phone') &&
                          Boolean(forgotPasswordErrors.phone)
                        }
                      />
                    </View>
                  </View>
                  {renderValidationMessage(
                    shouldShowForgotPasswordError('phone'),
                    forgotPasswordErrors.phone,
                  )}

                  <AppButton
                    title={
                      forgotPasswordOtpRequested && forgotOtpCooldownSeconds > 0
                        ? formatOtpCooldownLabel('Resend code', forgotOtpCooldownSeconds)
                        : forgotPasswordOtpRequested
                          ? 'Resend code'
                          : 'Send recovery code'
                    }
                    onPress={handleForgotPasswordRequestOtp}
                    disabled={
                      isForgotPasswordRequestDisabled ||
                      isBusy ||
                      isForgotOtpResendCoolingDown
                    }
                    loading={submitAction === 'forgot-request-otp'}
                    style={[
                      styles.secondaryButton,
                      {
                        backgroundColor: palette.accentSoft,
                        borderColor: palette.accentSoftBorder,
                      },
                    ]}
                    textStyle={{ color: palette.accentStrong }}
                  />
                </>
              ) : null}

              {forgotPasswordOtpRequested && !showResetPassword ? (
                <>
                  <View
                    style={[
                      styles.statusPanel,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.surfaceBorder,
                      },
                    ]}
                  >
                    <AppText style={[styles.statusPanelTitle, { color: palette.heading }]}>
                      Verification code sent to {maskedForgotPasswordPhone}
                    </AppText>
                    <AppText style={[styles.statusPanelBody, { color: palette.subtleText }]}>
                      Enter the latest OTP below to continue with your password reset.
                    </AppText>
                  </View>
                  {surfacedForgotPasswordOtp ? (
                    <View
                      style={[
                        styles.temporaryOtpPanel,
                        {
                          backgroundColor: palette.accentSoft,
                          borderColor: palette.accentSoftBorder,
                        },
                      ]}
                    >
                      <AppText
                        style={[styles.temporaryOtpLabel, { color: palette.subtleText }]}
                      >
                        Temporary OTP for testing
                      </AppText>
                      <AppText
                        style={[styles.temporaryOtpValue, { color: palette.accentStrong }]}
                      >
                        {surfacedForgotPasswordOtp}
                      </AppText>
                    </View>
                  ) : null}
                  {renderFieldLabel('Verification code')}
                  <OtpPinInput
                    value={forgotPasswordOtp}
                    onChangeText={setForgotPasswordOtp}
                    error={
                      shouldShowForgotPasswordError('otp') &&
                      Boolean(forgotPasswordErrors.otp)
                    }
                    disabled={!forgotPasswordOtpRequested}
                  />
                  {renderValidationMessage(
                    shouldShowForgotPasswordError('otp'),
                    forgotPasswordErrors.otp,
                  )}
                  <AppText style={[styles.helperText, { color: palette.subtleText }]}> 
                    {t('forgotPasswordOtpHelper')}
                  </AppText>
                  <AppButton
                    title="Continue to reset"
                    onPress={handleForgotPasswordVerify}
                    disabled={isForgotPasswordVerifyDisabled || isBusy}
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

              {showResetPassword ? (
                <>
                  <AppText style={[styles.helperCopy, { color: palette.subtleText }]}> 
                    Create a fresh password for your supplier account and confirm it once before submitting.
                  </AppText>
                  {renderFieldLabel('New password', 'Use at least 6 characters')}
                  <AppInput
                    placeholder={t('passwordPlaceholder')}
                    value={forgotPasswordPassword}
                    onChangeText={setForgotPasswordPassword}
                    onBlur={() => markForgotPasswordTouched('password')}
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="next"
                    editable={!isBusy}
                    style={styles.input}
                    hasError={
                      shouldShowForgotPasswordError('password') &&
                      Boolean(forgotPasswordErrors.password)
                    }
                  />
                  {renderValidationMessage(
                    shouldShowForgotPasswordError('password'),
                    forgotPasswordErrors.password,
                  )}
                  {renderFieldLabel('Confirm password')}
                  <AppInput
                    placeholderKey="confirmPasswordPlaceholder"
                    value={forgotPasswordConfirmPassword}
                    onChangeText={setForgotPasswordConfirmPassword}
                    onBlur={() => markForgotPasswordTouched('confirmPassword')}
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="done"
                    editable={!isBusy}
                    style={styles.input}
                    hasError={
                      shouldShowForgotPasswordError('confirmPassword') &&
                      Boolean(forgotPasswordErrors.confirmPassword)
                    }
                  />
                  {renderValidationMessage(
                    shouldShowForgotPasswordError('confirmPassword'),
                    forgotPasswordErrors.confirmPassword,
                  )}
                  <AppButton
                    title="Update password"
                    onPress={handleForgotPasswordReset}
                    disabled={isForgotPasswordResetDisabled || isBusy}
                    loading={submitAction === 'forgot-reset'}
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
    paddingTop: 18,
    paddingBottom: 24,
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
    marginBottom: 22,
  },
  heroBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
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
  modalBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
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
  cardBanner: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },
  cardBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardBannerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    padding: 4,
    marginBottom: 18,
  },
  segmentedOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  formSectionBlock: {
    marginBottom: 10,
  },
  formSectionEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  fieldHeader: {
    marginBottom: 8,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  fieldHelperInline: {
    fontSize: 12,
    lineHeight: 18,
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
  otpPinContainer: {
    marginBottom: 8,
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpPinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpPinCell: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#C7E6F8',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  otpPinCellFocused: {
    borderColor: '#0EA5E9',
  },
  otpPinCellError: {
    borderColor: '#DC2626',
  },
  otpPinText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
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
    marginTop: 8,
  },
  modalPrimaryButton: {
    marginTop: 18,
  },
  ctaButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
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
  statusPanelCompact: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  statusPanel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  statusPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusPanelBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  temporaryOtpPanel: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  temporaryOtpLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  temporaryOtpValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
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
  linkButton: {
    borderWidth: 0,
    minHeight: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stepChip: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    marginVertical: 18,
  },
  ctaPanel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  ctaPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ctaPanelTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  infoButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  forgotPasswordContainer: {
    paddingTop: 18,
  },
});
