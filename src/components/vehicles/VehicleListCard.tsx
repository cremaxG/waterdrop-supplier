import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '../index';
import { useAppPalette } from '../../hooks/useAppPalette';

interface VehicleListCardProps {
  name: string;
  status: string;
  statusTone?: 'success' | 'warning' | 'pending';
  driverLabel: string;
  driverValue: string;
  capacityLabel: string;
  capacityValue: string;
  routeLabel: string;
  routeValue: string;
  locationLabel: string;
  locationValue: string;
  accentColor: string;
  onPress: () => void;
}

export function VehicleListCard({
  name,
  status,
  statusTone = 'success',
  driverLabel,
  driverValue,
  capacityLabel,
  capacityValue,
  routeLabel,
  routeValue,
  locationLabel,
  locationValue,
  accentColor,
  onPress,
}: VehicleListCardProps) {
  const palette = useAppPalette();
  const statusBackground =
    statusTone === 'pending'
      ? '#FEF3C7'
      : statusTone === 'warning'
        ? '#FEE2E2'
        : '#DCFCE7';
  const statusBorder =
    statusTone === 'pending'
      ? '#FCD34D'
      : statusTone === 'warning'
        ? '#FCA5A5'
        : '#86EFAC';

  return (
    <Pressable
      onPress={onPress}
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
        <View style={styles.copy}>
          <AppText style={[styles.title, { color: palette.text }]}>
            {name}
          </AppText>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: statusBackground,
                borderColor: statusBorder,
              },
            ]}
          >
            <AppText style={[styles.status, { color: accentColor }]}>
              {status}
            </AppText>
          </View>
        </View>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppIcon name="vehicles" size={18} color={accentColor} />
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <AppText style={[styles.metaLabel, { color: palette.muted }]}>
            {driverLabel}
          </AppText>
          <AppText style={[styles.metaValue, { color: palette.text }]}>
            {driverValue}
          </AppText>
        </View>
        <View style={styles.metaBlock}>
          <AppText style={[styles.metaLabel, { color: palette.muted }]}>
            {capacityLabel}
          </AppText>
          <AppText style={[styles.metaValue, { color: palette.text }]}>
            {capacityValue}
          </AppText>
        </View>
      </View>

      <View style={styles.routeRow}>
        <AppText style={[styles.metaLabel, { color: palette.muted }]}>
          {routeLabel}
        </AppText>
        <AppText style={[styles.routeValue, { color: palette.text }]}>
          {routeValue}
        </AppText>
      </View>

      <View
        style={[
          styles.locationRow,
          {
            backgroundColor: palette.surfaceSoft,
            borderColor: palette.border,
          },
        ]}
      >
        <AppIcon name="map" size={16} color={palette.accentStrong} />
        <View style={styles.locationCopy}>
          <AppText style={[styles.locationLabel, { color: palette.muted }]}>
            {locationLabel}
          </AppText>
          <AppText style={[styles.locationValue, { color: palette.text }]}>
            {locationValue}
          </AppText>
        </View>
        <AppIcon name="chevron" size={18} color={palette.accentStrong} />
      </View>
    </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  copy: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  status: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  routeRow: {
    marginBottom: 14,
  },
  routeValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationCopy: {
    flex: 1,
    marginHorizontal: 10,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 3,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
