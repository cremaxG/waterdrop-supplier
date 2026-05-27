import { useTheme } from '../providers/AppProviders';

export function useAppPalette() {
  const { theme } = useTheme();
  const isDark = theme.statusBarStyle === 'light-content';

  return {
    theme,
    isDark,
    background: isDark ? '#07111F' : '#EEF8FF',
    surface: isDark ? '#0F1C2D' : '#FFFFFF',
    surfaceSoft: isDark ? '#13253A' : '#F8FBFF',
    border: isDark ? 'rgba(96, 165, 250, 0.16)' : '#D6E6F5',
    text: isDark ? '#F8FAFC' : '#0F172A',
    muted: isDark ? '#93A8C1' : '#5B6B80',
    accent: isDark ? '#38BDF8' : '#0284C7',
    accentStrong: isDark ? '#22D3EE' : '#0369A1',
    accentSoft: isDark ? 'rgba(34, 211, 238, 0.14)' : '#DFF6FF',
    accentSoftBorder: isDark ? 'rgba(56, 189, 248, 0.26)' : '#B8E6FB',
    error: isDark ? '#FCA5A5' : '#DC2626',
    success: isDark ? '#34D399' : '#059669',
    warning: isDark ? '#FBBF24' : '#D97706',
    heroTop: isDark ? 'rgba(34, 211, 238, 0.18)' : 'rgba(14, 165, 233, 0.16)',
    heroBottom:
      isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(2, 132, 199, 0.12)',
    shadow: isDark ? '#020617' : '#0F172A',
  };
}
