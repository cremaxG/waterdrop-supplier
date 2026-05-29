import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/AppProviders';
import {
  AppButton,
  AppCountryPicker,
  AppIcon,
  AppInput,
  AppText,
  AuthWaterBackdrop,
} from '../../components';
import { Country, DEFAULT_COUNTRY } from '../../constants/countries';

export interface SignInScreenProps {
  onSignIn?: (phoneNumber: string, country: Country) => void;
}

export function SignInScreen({ onSignIn }: SignInScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.statusBarStyle === 'light-content';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] =
    useState<Country>(DEFAULT_COUNTRY);

  const handleSendCode = () => {
    if (phoneNumber.trim()) {
      onSignIn?.(phoneNumber, selectedCountry);
    }
  };

  const handleUsePassword = () => {
    // Navigate to password sign-in
    console.log('Use password sign-in');
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar barStyle={theme.statusBarStyle} />
      <AuthWaterBackdrop
        screenColor={theme.background}
        glowTop={isDark ? 'rgba(34, 211, 238, 0.18)' : 'rgba(14, 165, 233, 0.18)'}
        glowBottom={isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(2, 132, 199, 0.14)'}
        frostTint={isDark ? 'rgba(10, 37, 64, 0.18)' : 'rgba(255, 255, 255, 0.32)'}
        mistTint={isDark ? 'rgba(125, 211, 252, 0.18)' : 'rgba(186, 230, 253, 0.28)'}
        dropletFill={isDark ? 'rgba(186, 230, 253, 0.22)' : 'rgba(255, 255, 255, 0.72)'}
        dropletEdge={isDark ? 'rgba(125, 211, 252, 0.42)' : 'rgba(56, 189, 248, 0.56)'}
        dropletHighlight={isDark ? 'rgba(240, 249, 255, 0.42)' : 'rgba(255, 255, 255, 0.92)'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <AppIcon name="water" size={64} style={styles.icon} />
            <AppText i18nKey="signInTitle" style={styles.title} />
            <AppText i18nKey="signInSubtitle" style={styles.subtitle} />
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.phoneInputContainer}>
              <AppCountryPicker
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
              <View style={styles.inputWrapper}>
                <AppText style={styles.dialCode}>
                  {selectedCountry.dialCode}
                </AppText>
                <AppInput
                  placeholderKey="mobileNumberPlaceholder"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  containerStyle={styles.phoneInputContainerWrap}
                  style={styles.phoneInput}
                />
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <AppButton
                i18nKey="sendCodeButton"
                onPress={handleSendCode}
                style={[
                  styles.button,
                  {
                    backgroundColor: phoneNumber ? theme.border : theme.card,
                  },
                ]}
                leftIconName="check"
              />
              <AppButton
                i18nKey="usePasswordButton"
                onPress={handleUsePassword}
                style={[styles.button, styles.secondaryButton]}
                leftIconName="eye"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInputContainerWrap: {
    flex: 1,
    minWidth: 0,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    width: '100%',
    marginLeft: 0,
    minHeight: 64,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
  secondaryButton: {
    borderWidth: 1,
  },
});
