import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { useAppPalette } from '../../hooks/useAppPalette';

interface ProfilePreferenceCardProps {
  icon: string;
  title: string;
  currentLabel: string;
  currentValue: string;
  onPress: () => void;
}

export function ProfilePreferenceCard({
  icon,
  title,
  currentLabel,
  currentValue,
  onPress,
}: ProfilePreferenceCardProps) {
  const palette = useAppPalette();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppIcon name={icon} size={18} color={palette.accentStrong} />
        </View>
        <View style={styles.copy}>
          <AppText style={[styles.title, { color: palette.text }]}>
            {title}
          </AppText>
          <AppText style={[styles.current, { color: palette.muted }]}>
            {currentLabel}: {currentValue}
          </AppText>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        style={[
          styles.action,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.accentSoftBorder,
          },
        ]}
      >
        <AppText style={[styles.actionText, { color: palette.accentStrong }]}>
          {currentValue}
        </AppText>
        <AppIcon name="chevron" size={18} color={palette.accentStrong} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  current: {
    fontSize: 14,
  },
  action: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
