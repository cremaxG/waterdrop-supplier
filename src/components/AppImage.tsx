import React from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme, useTranslation } from '../providers/AppProviders';

export interface AppImageProps extends ImageProps {
  altTextKey?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showBorder?: boolean;
}

export function AppImage({
  altTextKey,
  style,
  containerStyle,
  showBorder = true,
  accessibilityLabel,
  ...rest
}: AppImageProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const label = accessibilityLabel ?? (altTextKey ? t(altTextKey) : undefined);

  return (
    <View
      style={[
        styles.container,
        showBorder && {
          borderColor: theme.border,
          backgroundColor: theme.card,
        },
        containerStyle,
      ]}
    >
      <Image
        accessibilityLabel={label}
        style={[styles.image, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
});
