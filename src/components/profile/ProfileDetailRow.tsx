import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { useAppPalette } from '../../hooks/useAppPalette';

interface ProfileDetailRowProps {
  icon: string;
  label: string;
  value: string;
}

export function ProfileDetailRow({
  icon,
  label,
  value,
}: ProfileDetailRowProps) {
  const palette = useAppPalette();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.accentSoftBorder,
          },
        ]}
      >
        <AppIcon name={icon} size={16} color={palette.accentStrong} />
      </View>
      <View style={styles.copy}>
        <AppText style={[styles.label, { color: palette.muted }]}>
          {label}
        </AppText>
        <AppText style={[styles.value, { color: palette.text }]}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
});
