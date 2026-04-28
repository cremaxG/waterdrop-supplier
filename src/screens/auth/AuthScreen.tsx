import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useTranslation } from '../../providers/AppProviders';
import {
  AppButton,
  AppCheckbox,
  AppCountryPicker,
  AppIcon,
  AppInput,
  AppText,
} from '../../components';
import { Country, DEFAULT_COUNTRY } from '../../constants/countries';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30;
const createEmptyOtp = () => Array.from({ length: OTP_LENGTH }, () => '');

export interface AuthScreenProps {
  onSignIn?: (phoneNumber: string, country: Country) => void;
  mode?: 'login' | 'signup';
  titleKey?: string;
  subtitleKey?: string;
}

export function AuthScreen({
  onSignIn,
  mode: _mode = 'login',
  titleKey = 'signInTitle',
  subtitleKey = 'signInSubtitle',
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
    inputBackground: isDark ? '#0F172A' : '#F8FAFC',
    inputBorder: isDark ? '#1E3A4A' : '#C7D2FE',
    heroBadge: isDark ? 'rgba(45, 212, 191, 0.16)' : '#CCFBF1',
    decorTop: isDark ? 'rgba(45, 212, 191, 0.16)' : 'rgba(34, 197, 94, 0.12)',
    decorBottom: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 165, 233, 0.12)',
    shadow: isDark ? '#020617' : '#0F172A',
  };

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [signInStep, setSignInStep] = useState<'entry' | 'password' | 'otp'>(
    'entry',
  );
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // Forgot password fields
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCountry, setForgotCountry] = useState<Country>(DEFAULT_COUNTRY);
  const normalizedPhone = phone.replace(/\D/g, '');
  const normalizedForgotPhone = forgotPhone.replace(/\D/g, '');
  const isValidPhone = normalizedPhone.length === 10;
  const isValidForgotPhone = normalizedForgotPhone.length === 10;
  const isPhoneLocked = signInStep !== 'entry';
  const isPasswordFlow = signInStep === 'password';
  const isOtpFlow = signInStep === 'otp';
  const isLoginDisabled = !isValidPhone || !password.trim();
  const isOtpComplete = otpDigits.every(digit => digit.length === 1);
  const resendLabel =
    resendSeconds > 0
      ? `Resend OTP in 00:${String(resendSeconds).padStart(2, '0')}`
      : 'Resend OTP';

  useEffect(() => {
    if (!isOtpFlow || resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds(current => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOtpFlow, resendSeconds]);

  const handleLogin = () => {
    if (isValidPhone && password.trim()) {
      onSignIn?.(normalizedPhone, country);
    }
  };

  const handleStartPassword = () => {
    if (!isValidPhone) {
      return;
    }

    setSignInStep('password');
    setOtpDigits(createEmptyOtp());
    setResendSeconds(0);
  };

  const handleSendCode = () => {
    if (!isValidPhone) {
      return;
    }

    console.log(`Sending OTP to ${country.dialCode}${normalizedPhone}`);
    setSignInStep('otp');
    setPassword('');
    setOtpDigits(createEmptyOtp());
    setResendSeconds(RESEND_TIMEOUT);
  };

  const handleChangeNumber = () => {
    setSignInStep('entry');
    setPassword('');
    setOtpDigits(createEmptyOtp());
    setResendSeconds(0);
  };

  const handleOtpChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '');

    if (!digits) {
      setOtpDigits(current => {
        const next = [...current];
        next[index] = '';
        return next;
      });
      return;
    }

    setOtpDigits(current => {
      const next = [...current];

      digits.slice(0, OTP_LENGTH - index).split('').forEach((digit, offset) => {
        next[index + offset] = digit;
      });

      return next;
    });

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (isValidPhone && isOtpComplete) {
      console.log(`Verifying OTP for ${country.dialCode}${normalizedPhone}`);
      onSignIn?.(normalizedPhone, country);
    }
  };

  const handleResendOtp = () => {
    if (resendSeconds > 0 || !isValidPhone) {
      return;
    }

    console.log(`Resending OTP to ${country.dialCode}${normalizedPhone}`);
    setOtpDigits(createEmptyOtp());
    setResendSeconds(RESEND_TIMEOUT);
    otpInputRefs.current[0]?.focus();
  };

  const handleForgotPassword = () => {
    if (isValidForgotPhone) {
      console.log(
        `Reset password for ${forgotCountry.dialCode}${normalizedForgotPhone}`,
      );
      setShowForgotPassword(false);
      setForgotPhone('');
    }
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
            <View style={styles.headerSection}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: palette.heroBadge,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <AppIcon
                  name="water"
                  size={54}
                  color={palette.accentStrong}
                  style={styles.icon}
                />
              </View>
              <AppText
                i18nKey={titleKey}
                style={[styles.title, { color: palette.heading }]}
              />
              <AppText
                i18nKey={subtitleKey}
                style={[styles.subtitle, { color: palette.subtleText }]}
              />
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.surfaceBorder,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <View style={styles.phoneInputContainer}>
                <AppCountryPicker
                  selectedCountry={country}
                  onCountrySelect={setCountry}
                  disabled={isPhoneLocked}
                />
                <View style={styles.inputWrapper}>
                  <AppText
                    style={[styles.dialCode, { color: palette.accentStrong }]}
                  >
                    {country.dialCode}
                  </AppText>
                  <AppInput
                    placeholderKey="mobileNumberPlaceholder"
                    value={phone}
                    onChangeText={value => setPhone(value.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    editable={!isPhoneLocked}
                    maxLength={10}
                    style={[
                      styles.phoneInput,
                      {
                        backgroundColor: palette.inputBackground,
                        borderColor: palette.inputBorder,
                        color: palette.heading,
                      },
                      isPhoneLocked && styles.lockedPhoneInput,
                    ]}
                  />
                </View>
                {isPhoneLocked && (
                  <Pressable
                    onPress={handleChangeNumber}
                    style={[
                      styles.changeButton,
                      {
                        backgroundColor: palette.accentSoft,
                        borderColor: palette.accentSoftBorder,
                      },
                    ]}
                  >
                    <AppIcon
                      name="edit"
                      size={18}
                      color={palette.accentStrong}
                    />
                  </Pressable>
                )}
              </View>

              {isPasswordFlow && (
                <AppInput
                  placeholderKey="passwordPlaceholder"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.inputBackground,
                      borderColor: palette.inputBorder,
                      color: palette.heading,
                    },
                  ]}
                />
              )}

              {isPasswordFlow && (
                <View style={styles.rememberContainer}>
                  <AppCheckbox
                    label={t('rememberMe')}
                    checked={rememberMe}
                    onChange={setRememberMe}
                  />
                </View>
              )}

              {isOtpFlow && (
                <View style={styles.otpSection}>
                  <AppText
                    style={[styles.otpTitle, { color: palette.heading }]}
                  >
                    Enter the 6-digit OTP
                  </AppText>
                  <AppText
                    style={[styles.otpSubtitle, { color: palette.subtleText }]}
                  >
                    Sent to {country.dialCode}
                    {normalizedPhone}
                  </AppText>
                  <View style={styles.otpInputRow}>
                    {otpDigits.map((digit, index) => (
                      <TextInput
                        key={`otp-${index}`}
                        ref={input => {
                          otpInputRefs.current[index] = input;
                        }}
                        value={digit}
                        onChangeText={value => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) =>
                          handleOtpKeyPress(nativeEvent.key, index)
                        }
                        keyboardType="number-pad"
                        maxLength={index === 0 ? OTP_LENGTH : 1}
                        style={[
                          styles.otpInput,
                          {
                            backgroundColor: palette.inputBackground,
                            borderColor: palette.inputBorder,
                            color: palette.heading,
                          },
                        ]}
                        textAlign="center"
                        selectTextOnFocus
                      />
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.buttonGroup}>
                {signInStep === 'entry' ? (
                  <>
                    <AppButton
                      i18nKey="sendCodeButton"
                      onPress={handleSendCode}
                      disabled={!isValidPhone}
                      style={[
                        styles.button,
                        {
                          backgroundColor: palette.accent,
                          borderColor: palette.accent,
                          shadowColor: palette.accentStrong,
                        },
                      ]}
                      textStyle={{ color: palette.accentTextOnFill }}
                    />
                    <AppButton
                      i18nKey="usePasswordButton"
                      onPress={handleStartPassword}
                      disabled={!isValidPhone}
                      style={[
                        styles.button,
                        styles.secondaryButton,
                        {
                          backgroundColor: palette.accentSoft,
                          borderColor: palette.accentSoftBorder,
                        },
                      ]}
                      textStyle={{ color: palette.accentStrong }}
                    />
                  </>
                ) : isPasswordFlow ? (
                  <AppButton
                    title="Login"
                    onPress={handleLogin}
                    disabled={isLoginDisabled}
                    style={[
                      styles.button,
                      styles.fullWidthButton,
                      {
                        backgroundColor: palette.accent,
                        borderColor: palette.accent,
                        shadowColor: palette.accentStrong,
                      },
                    ]}
                    textStyle={{ color: palette.accentTextOnFill }}
                  />
                ) : (
                  <AppButton
                    title="Verify"
                    onPress={handleVerifyOtp}
                    disabled={!isOtpComplete}
                    style={[
                      styles.button,
                      styles.fullWidthButton,
                      {
                        backgroundColor: palette.accent,
                        borderColor: palette.accent,
                        shadowColor: palette.accentStrong,
                      },
                    ]}
                    textStyle={{ color: palette.accentTextOnFill }}
                  />
                )}
              </View>

              {isOtpFlow ? (
                <View style={styles.resendButtonContainer}>
                  <AppButton
                    title={resendLabel}
                    onPress={handleResendOtp}
                    disabled={resendSeconds > 0}
                    style={[
                      styles.resendButton,
                      {
                        backgroundColor: palette.accentSoft,
                        borderColor: palette.accentSoftBorder,
                      },
                    ]}
                    textStyle={{ color: palette.accentStrong }}
                  />
                </View>
              ) : isPasswordFlow ? (
                <View style={styles.forgotPasswordContainer}>
                  <Pressable onPress={() => setShowForgotPassword(true)}>
                    <AppText
                      i18nKey="forgotPasswordLink"
                      style={[
                        styles.forgotPasswordLink,
                        { color: palette.accentStrong },
                      ]}
                    />
                  </Pressable>
                </View>
              ) : null}

              <AppText
                style={[styles.termsText, { color: palette.subtleText }]}
                i18nKey="termsAndConditions"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: palette.screenBackground, paddingTop: insets.top },
          ]}
        >
          <StatusBar barStyle={theme.statusBarStyle} />
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { backgroundColor: palette.screenBackground },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerSection}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: palette.heroBadge,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <AppIcon
                  name="water"
                  size={54}
                  color={palette.accentStrong}
                  style={styles.icon}
                />
              </View>
              <AppText
                i18nKey="forgotPasswordTitle"
                style={[styles.title, { color: palette.heading }]}
              />
              <AppText
                i18nKey="forgotPasswordSubtitle"
                style={[styles.subtitle, { color: palette.subtleText }]}
              />
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.surfaceBorder,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <View style={styles.phoneInputContainer}>
                <AppCountryPicker
                  selectedCountry={forgotCountry}
                  onCountrySelect={setForgotCountry}
                />
                <View style={styles.inputWrapper}>
                  <AppText
                    style={[styles.dialCode, { color: palette.accentStrong }]}
                  >
                    {forgotCountry.dialCode}
                  </AppText>
                  <AppInput
                    placeholderKey="mobileNumberPlaceholder"
                    value={forgotPhone}
                    onChangeText={value =>
                      setForgotPhone(value.replace(/\D/g, ''))
                    }
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={[
                      styles.phoneInput,
                      {
                        backgroundColor: palette.inputBackground,
                        borderColor: palette.inputBorder,
                        color: palette.heading,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <AppButton
                  i18nKey="sendOtpButton"
                  onPress={handleForgotPassword}
                  disabled={!isValidForgotPhone}
                  style={[
                    styles.button,
                    {
                      backgroundColor: palette.accent,
                      borderColor: palette.accent,
                      shadowColor: palette.accentStrong,
                    },
                  ]}
                  textStyle={{ color: palette.accentTextOnFill }}
                />
                <AppButton
                  i18nKey="backToLogin"
                  onPress={() => setShowForgotPassword(false)}
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    {
                      backgroundColor: palette.accentSoft,
                      borderColor: palette.accentSoftBorder,
                    },
                  ]}
                  textStyle={{ color: palette.accentStrong }}
                />
              </View>
            </View>
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
    paddingVertical: 28,
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: 28,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  icon: {
    marginBottom: 0,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },
  input: {
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  lockedPhoneInput: {
    opacity: 0.7,
  },
  changeButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  rememberContainer: {
    marginBottom: 16,
  },
  otpSection: {
    marginBottom: 18,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  otpSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 0,
  },
  forgotPasswordLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    minHeight: 54,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  fullWidthButton: {
    width: '100%',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  resendButtonContainer: {
    marginBottom: 16,
  },
  resendButton: {
    width: '100%',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
