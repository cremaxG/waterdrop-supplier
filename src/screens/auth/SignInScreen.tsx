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
} from '../../components';
import { Country, DEFAULT_COUNTRY } from '../../constants/countries';

export interface SignInScreenProps {
  onSignIn?: (phoneNumber: string, country: Country) => void;
}

export function SignInScreen({ onSignIn }: SignInScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.background },
          ]}
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
              />
              <AppButton
                i18nKey="usePasswordButton"
                onPress={handleUsePassword}
                style={[styles.button, styles.secondaryButton]}
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
