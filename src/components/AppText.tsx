import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { useTheme, useTranslation } from '../providers/AppProviders';

export interface AppTextProps extends Omit<TextProps, 'style'> {
  i18nKey?: string;
  style?: StyleProp<TextStyle>;
}

export function AppText({ i18nKey, children, style, ...rest }: AppTextProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const content = i18nKey ? t(i18nKey) : children;

  return (
    <Text style={[{ color: theme.text, fontSize: 16 }, style]} {...rest}>
      {content}
    </Text>
  );
}
