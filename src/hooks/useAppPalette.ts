import { useTheme } from '../providers/AppProviders';

export function useAppPalette() {
  const { theme } = useTheme();
  const isDark = theme.statusBarStyle === 'light-content';

  return {
    theme,
    isDark,
    background: isDark ? '#071827' : '#F0FBFF',
    surface: isDark ? '#102235' : '#FFFFFF',
    surfaceSoft: isDark ? '#13304A' : '#F7FCFF',
    border: isDark ? 'rgba(56, 189, 248, 0.18)' : '#D2E9F8',
    text: isDark ? '#F3FBFF' : '#0B1F33',
    muted: isDark ? '#9CB8CC' : '#5E7B8E',
    accent: isDark ? '#38BDF8' : '#0EA5E9',
    accentStrong: isDark ? '#67E8F9' : '#0369A1',
    accentSoft: isDark ? 'rgba(56, 189, 248, 0.16)' : '#DFF6FF',
    accentSoftBorder: isDark ? 'rgba(103, 232, 249, 0.28)' : '#B7E6FA',
    error: isDark ? '#FCA5A5' : '#DC2626',
    success: isDark ? '#38BDF8' : '#0284C7',
    warning: isDark ? '#FBBF24' : '#D97706',
    heroTop: isDark ? 'rgba(34, 211, 238, 0.18)' : 'rgba(14, 165, 233, 0.18)',
    heroBottom:
      isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(2, 132, 199, 0.14)',
    shadow: isDark ? '#020617' : '#0F172A',
  };
}
