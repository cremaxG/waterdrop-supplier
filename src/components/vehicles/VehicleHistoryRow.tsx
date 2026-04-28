import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '../index';
import { useAppPalette } from '../../hooks/useAppPalette';

interface VehicleHistoryRowProps {
  route: string;
  time: string;
  orders: string;
  earnings: string;
  onPress?: () => void;
}

export function VehicleHistoryRow({
  route,
  time,
  orders,
  earnings,
  onPress,
}: VehicleHistoryRowProps) {
  const palette = useAppPalette();

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
      <View style={styles.header}>
        <AppText style={[styles.route, { color: palette.text }]}>
          {route}
        </AppText>
        <AppText style={[styles.time, { color: palette.muted }]}>{time}</AppText>
      </View>
      <View style={styles.footerRow}>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <AppIcon name="dashboard" size={14} color={palette.accentStrong} />
            <AppText style={[styles.metaText, { color: palette.text }]}>
              {orders}
            </AppText>
          </View>
          <View style={styles.metaChip}>
            <AppIcon name="money" size={14} color={palette.success} />
            <AppText style={[styles.metaText, { color: palette.text }]}>
              {earnings}
            </AppText>
          </View>
        </View>
        {onPress ? (
          <AppIcon name="chevron" size={18} color={palette.accentStrong} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  route: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
