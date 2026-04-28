import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '../index';
import { useAppPalette } from '../../hooks/useAppPalette';

interface VehicleProductRowProps {
  name: string;
  quantity: string;
  trend: string;
}

export function VehicleProductRow({
  name,
  quantity,
  trend,
}: VehicleProductRowProps) {
  const palette = useAppPalette();

  return (
    <View
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
            backgroundColor: palette.accentSoft,
            borderColor: palette.accentSoftBorder,
          },
        ]}
      >
        <AppIcon name="package" size={16} color={palette.accentStrong} />
      </View>
      <View style={styles.copy}>
        <AppText style={[styles.name, { color: palette.text }]}>{name}</AppText>
        <AppText style={[styles.meta, { color: palette.muted }]}>
          {quantity}
        </AppText>
      </View>
      <AppText style={[styles.trend, { color: palette.accentStrong }]}>
        {trend}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    marginHorizontal: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
  },
  trend: {
    fontSize: 13,
    fontWeight: '700',
  },
});
