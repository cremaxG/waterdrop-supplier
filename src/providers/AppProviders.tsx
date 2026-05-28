import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {
  availableLanguages,
  LanguageCode,
  translate,
} from '../i18n';
import {
  ThemeName,
  ThemePreference,
  themeNameFromScheme,
  themes,
} from '../theme';
import {
  getStoredLanguage,
  getStoredThemePreference,
  setStoredLanguage,
  setStoredThemePreference,
} from '../storage/preferences';

interface ThemeContextValue {
  themeName: ThemeName;
  themePreference: ThemePreference;
  theme: (typeof themes)[ThemeName];
  setThemePreference: (value: ThemePreference) => void;
  toggleTheme: () => void;
}

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (value: LanguageCode) => void;
  t: (key: string) => string;
  availableLanguages: Record<LanguageCode, string>;
}

interface AppAlertOptions {
  title: string;
  message: string;
  buttonLabel?: string;
}

interface AlertContextValue {
  dismissAlert: () => void;
  showAlert: (
    titleOrOptions: string | AppAlertOptions,
    message?: string,
    buttonLabel?: string,
  ) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const LanguageContext = createContext<LanguageContextValue | null>(null);
const AlertContext = createContext<AlertContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    getStoredThemePreference(),
  );
  const [language, setLanguageState] = useState<LanguageCode>(() =>
    getStoredLanguage(),
  );
  const [activeAlert, setActiveAlert] = useState<AppAlertOptions | null>(null);

  const themeName =
    themePreference === 'system'
      ? themeNameFromScheme(colorScheme)
      : themePreference;

  const theme = useMemo(() => themes[themeName], [themeName]);

  const setThemePreference = (value: ThemePreference) => {
    setThemePreferenceState(value);
    setStoredThemePreference(value);
  };

  const setLanguage = (value: LanguageCode) => {
    setLanguageState(value);
    setStoredLanguage(value);
  };

  const themeContextValue = useMemo(
    () => ({
      themeName,
      themePreference,
      theme,
      setThemePreference,
      toggleTheme: () =>
        setThemePreference(
          themeName === 'dark' ? 'light' : 'dark',
        ),
    }),
    [themeName, themePreference, theme],
  );

  const languageContextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => translate(language, key),
      availableLanguages,
    }),
    [language],
  );

  const showAlert: AlertContextValue['showAlert'] = (
    titleOrOptions,
    message,
    buttonLabel,
  ) => {
    if (typeof titleOrOptions === 'string') {
      setActiveAlert({
        title: titleOrOptions,
        message: message ?? '',
        buttonLabel,
      });
      return;
    }

    setActiveAlert(titleOrOptions);
  };

  const alertContextValue = useMemo(
    () => ({
      dismissAlert: () => setActiveAlert(null),
      showAlert,
    }),
    [],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <LanguageContext.Provider value={languageContextValue}>
        <AlertContext.Provider value={alertContextValue}>
          {children}
          <AppAlertHost
            alert={activeAlert}
            okLabel={translate(language, 'alertOkButton')}
            onClose={() => setActiveAlert(null)}
            theme={theme}
          />
        </AlertContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within AppProviders');
  }
  return context;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within AppProviders');
  }
  return context;
}

export function useAppAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within AppProviders');
  }
  return context;
}

interface AppAlertHostProps {
  alert: AppAlertOptions | null;
  okLabel: string;
  onClose: () => void;
  theme: ThemeContextValue['theme'];
}

function AppAlertHost({
  alert,
  okLabel,
  onClose,
  theme,
}: AppAlertHostProps) {
  const isDark = theme.statusBarStyle === 'light-content';
  const palette = {
    overlay: isDark ? 'rgba(2, 6, 23, 0.64)' : 'rgba(15, 23, 42, 0.28)',
    surface: isDark ? '#102235' : '#FFFFFF',
    border: isDark ? 'rgba(56, 189, 248, 0.2)' : '#C7E6F8',
    title: isDark ? '#F3FBFF' : '#0B1F33',
    message: isDark ? '#9CB8CC' : '#5E7B8E',
    accent: isDark ? '#38BDF8' : '#0EA5E9',
    accentStrong: isDark ? '#67E8F9' : '#0369A1',
    accentSoft: isDark ? 'rgba(56, 189, 248, 0.16)' : '#DFF6FF',
    accentSoftBorder: isDark ? 'rgba(103, 232, 249, 0.28)' : '#B7E6FA',
    shadow: isDark ? '#020617' : '#0F172A',
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={Boolean(alert)}
    >
      <View style={[styles.alertOverlay, { backgroundColor: palette.overlay }]}>
        <Pressable style={styles.alertBackdrop} onPress={onClose} />
        <View
          style={[
            styles.alertCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View
            style={[
              styles.alertBadge,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
          >
            <View
              style={[
                styles.alertBadgeDot,
                {
                  backgroundColor: palette.accent,
                },
              ]}
            />
          </View>
          <Text style={[styles.alertTitle, { color: palette.title }]}>
            {alert?.title ?? ''}
          </Text>
          <Text style={[styles.alertMessage, { color: palette.message }]}>
            {alert?.message ?? ''}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.alertButton,
              {
                backgroundColor: palette.accent,
                borderColor: palette.accent,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={styles.alertButtonText}>
              {alert?.buttonLabel ?? okLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alertBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 10,
  },
  alertBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertBadgeDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  alertButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
