import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppCountryPicker, AppIcon, AppInput, AppText } from '../../components';
import { Country, DEFAULT_COUNTRY } from '../../constants/countries';
import { useTheme, useTranslation } from '../../providers/AppProviders';
import BaseApi from '../../service/baseApi';
import { getStorage } from '../../utils/Storage';

export interface AuthScreenProps {
  onSignIn?: (identifier: string) => void;
  mode?: 'login' | 'signup';
  titleKey?: string;
  subtitleKey?: string;
}

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
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
  };

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showSupplierRegistration, setShowSupplierRegistration] = useState(false);
  const [supplierCountry, setSupplierCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [supplierName, setSupplierName] = useState('');
  const [supplierLocation, setSupplierLocation] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierPassword, setSupplierPassword] = useState('');

  const normalizedLoginPhone = loginIdentifier.replace(/\D/g, '');
  const loginUsesEmail = isEmail(loginIdentifier);
  const isLoginDisabled = !loginIdentifier.trim() || !password.trim();
  const normalizedSupplierPhone = supplierPhone.replace(/\D/g, '');
  const isRegisterDisabled = useMemo(
    () =>
      !supplierName.trim() ||
      !supplierLocation.trim() ||
      normalizedSupplierPhone.length < 10 ||
      !isEmail(supplierEmail) ||
      !supplierGstin.trim() ||
      !supplierPassword.trim(),
    [
      normalizedSupplierPhone.length,
      supplierEmail,
      supplierGstin,
      supplierLocation,
      supplierName,
      supplierPassword,
    ],
  );

  const resetSupplierForm = () => {
    setSupplierCountry(DEFAULT_COUNTRY);
    setSupplierName('');
    setSupplierLocation('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierGstin('');
    setSupplierPassword('');
  };

  const handleLogin = async () => {
    if (isLoginDisabled) {
      return;
    }

    try {
      const payload = loginUsesEmail
        ? {
            email: loginIdentifier.trim().toLowerCase(),
            password: password.trim(),
          }
        : {
            phone: normalizedLoginPhone || loginIdentifier.trim(),
            password: password.trim(),
          };

      const response = await BaseApi.post(
        '/auth/suppliers/login',
        payload,
        {},
        {},
        '',
      );

      const supplier = response?.supplier ?? response?.data?.supplier ?? response?.user;
      const isVerified = supplier?.verified ?? response?.verified;

      if (response?.token && isVerified === false) {
        Alert.alert(
          'Application under review',
          'Your supplier application is under review. We will let you know once verified.',
        );
        return;
      }

      if (response?.token) {
        getStorage().set('authToken', response.token);
        onSignIn?.(loginIdentifier.trim());
        return;
      }

      Alert.alert('Login failed', response?.message || 'Invalid login credentials.');
    } catch (error: any) {
      Alert.alert('Login failed', error?.message || 'Unable to login. Please try again.');
    }
  };

  const handleRegisterSupplier = async () => {
    if (isRegisterDisabled) {
      return;
    }

    try {
      await BaseApi.post(
        '/auth/suppliers/register',
        {
          name: supplierName.trim(),
          phone: normalizedSupplierPhone,
          email: supplierEmail.trim().toLowerCase(),
          password: supplierPassword,
          gstin: supplierGstin.trim(),
          address_line_1: supplierLocation.trim(),
          country: supplierCountry.name,
          status: 'pending',
          online: false,
          ratings: '0',
          verified: false,
        },
        {},
        {},
        '',
      );

      setShowSupplierRegistration(false);
      resetSupplierForm();
      Alert.alert(
        'Application submitted',
        'Your application is under review and we will let you know once verified.',
      );
    } catch (error: any) {
      Alert.alert(
        'Registration failed',
        error?.message || 'Unable to submit supplier registration.',
      );
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
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <AppIcon name="water" size={54} color={palette.accentStrong} />
              </View>
              <AppText i18nKey={titleKey} style={[styles.title, { color: palette.heading }]} />
              <AppText style={[styles.subtitle, { color: palette.subtleText }]}>
                {t('signInWithMobileOrEmailSubtitle')}
              </AppText>
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
              <AppInput
                placeholder={t('loginIdentifierPlaceholder')}
                value={loginIdentifier}
                onChangeText={setLoginIdentifier}
                autoCapitalize="none"
                keyboardType={loginUsesEmail ? 'email-address' : 'default'}
                style={styles.input}
              />
              <AppInput
                placeholderKey="passwordPlaceholder"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
              <AppButton
                title={t('loginButton')}
                onPress={handleLogin}
                disabled={isLoginDisabled}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: palette.accent,
                    borderColor: palette.accent,
                  },
                ]}
                textStyle={{ color: palette.accentTextOnFill }}
              />
              <Pressable onPress={() => setShowSupplierRegistration(true)} style={styles.linkWrap}>
                <AppText style={[styles.linkText, { color: palette.accentStrong }]}>
                  {t('becomeSupplierButton')}
                </AppText>
              </Pressable>
            </View>
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
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <AppIcon name="building" size={46} color={palette.accentStrong} />
              </View>
              <AppText
                i18nKey="supplierRegistrationTitle"
                style={[styles.title, { color: palette.heading }]}
              />
              <AppText style={[styles.subtitle, { color: palette.subtleText }]}>
                {t('supplierRegistrationShortSubtitle')}
              </AppText>
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
              <AppInput
                placeholder={t('businessNamePlaceholder')}
                value={supplierName}
                onChangeText={setSupplierName}
                style={styles.input}
              />
              <AppInput
                placeholder={t('businessLocationPlaceholder')}
                value={supplierLocation}
                onChangeText={setSupplierLocation}
                style={styles.input}
              />
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
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.phoneInput}
                  />
                </View>
              </View>
              <AppInput
                placeholder={t('businessEmailPlaceholder')}
                value={supplierEmail}
                onChangeText={setSupplierEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <AppInput
                placeholder={t('businessGstPlaceholder')}
                value={supplierGstin}
                onChangeText={setSupplierGstin}
                autoCapitalize="characters"
                style={styles.input}
              />
              <AppInput
                placeholderKey="passwordPlaceholder"
                value={supplierPassword}
                onChangeText={setSupplierPassword}
                secureTextEntry
                style={styles.input}
              />
              <AppButton
                title={t('submitApplicationButton')}
                onPress={handleRegisterSupplier}
                disabled={isRegisterDisabled}
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
                onPress={() => {
                  setShowSupplierRegistration(false);
                  resetSupplierForm();
                }}
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
                textStyle={{ color: palette.accentStrong }}
              />
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
    maxWidth: 300,
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
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    marginTop: 4,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
