import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { useAppPalette } from '../../hooks/useAppPalette';

interface ProfileActionRowProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}

export function ProfileActionRow({
  icon,
  title,
  description,
  onPress,
  tone = 'default',
}: ProfileActionRowProps) {
  const palette = useAppPalette();
  const isDanger = tone === 'danger';
  const accentColor = isDanger ? '#DC2626' : palette.accentStrong;
  const backgroundColor = isDanger ? '#FEE2E2' : palette.accentSoft;
  const borderColor = isDanger ? '#FECACA' : palette.accentSoftBorder;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: palette.surfaceSoft,
          borderColor: palette.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <AppIcon name={icon} size={16} color={accentColor} />
      </View>
      <View style={styles.copy}>
        <AppText style={[styles.title, { color: isDanger ? accentColor : palette.text }]}>
          {title}
        </AppText>
        <AppText style={[styles.description, { color: palette.muted }]}>
          {description}
        </AppText>
      </View>
      <AppIcon name="chevron" size={18} color={accentColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
