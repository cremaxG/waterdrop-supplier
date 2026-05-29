import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon, AppText } from '../index';
import { useAppPalette } from '../../hooks/useAppPalette';

interface VehicleListCardProps {
  name: string;
  vehicleNumber: string;
  status: string;
  statusTone?: 'success' | 'warning' | 'pending';
  driverName: string;
  driverDetails: string;
  capacityValue: string;
  routeValue: string;
  locationValue: string;
  todayOrdersLabel: string;
  todayOrdersValue: string;
  currentOrderTitle?: string;
  currentOrderSubtitle?: string;
  currentOrderMeta?: string;
  accentColor: string;
  onPress: () => void;
  onTrack: () => void;
  onCall: () => void;
  onEdit: () => void;
  onView: () => void;
  onHistory: () => void;
}

interface ActionButtonProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

function ActionButton({ icon, label, color, onPress }: ActionButtonProps) {
  const palette = useAppPalette();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: pressed ? palette.accentSoft : palette.surfaceSoft,
          borderColor: palette.border,
        },
      ]}
    >
      <AppIcon name={icon} size={16} color={color} />
      <AppText style={[styles.actionLabel, { color }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function VehicleListCard({
  name,
  vehicleNumber,
  status,
  statusTone = 'success',
  driverName,
  driverDetails,
  capacityValue,
  routeValue,
  locationValue,
  todayOrdersLabel,
  todayOrdersValue,
  currentOrderTitle,
  currentOrderSubtitle,
  currentOrderMeta,
  accentColor,
  onPress,
  onTrack,
  onCall,
  onEdit,
  onView,
  onHistory,
}: VehicleListCardProps) {
  const palette = useAppPalette();
  const statusBackground =
    statusTone === 'pending'
      ? '#FEF3C7'
      : statusTone === 'warning'
        ? '#FEE2E2'
        : '#E0F2FE';
  const statusBorder =
    statusTone === 'pending'
      ? '#FCD34D'
      : statusTone === 'warning'
        ? '#FCA5A5'
        : '#7DD3FC';

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
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppIcon name="vehicles" size={20} color={accentColor} />
        </View>

        <View style={styles.copy}>
          <AppText style={[styles.title, { color: palette.text }]}>
            {name}
          </AppText>
          <View style={styles.metaHeaderRow}>
            <AppText style={[styles.vehicleNumber, { color: palette.muted }]}>
              {vehicleNumber}
            </AppText>
            <AppText style={[styles.capacity, { color: palette.text }]}>
              {capacityValue}
            </AppText>
          </View>
        </View>

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
          styles.driverCard,
          {
            backgroundColor: palette.surfaceSoft,
            borderColor: palette.border,
          },
        ]}
      >
        <AppText style={[styles.driverName, { color: palette.text }]}>
          {driverName}
        </AppText>
        <AppText style={[styles.driverDetails, { color: palette.muted }]}>
          {driverDetails}
        </AppText>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <AppText style={[styles.infoLabel, { color: palette.muted }]}>
            Route
          </AppText>
          <AppText style={[styles.infoValue, { color: palette.text }]}>
            {routeValue}
          </AppText>
        </View>
        <View style={styles.infoCell}>
          <AppText style={[styles.infoLabel, { color: palette.muted }]}>
            Location
          </AppText>
          <AppText numberOfLines={2} style={[styles.infoValue, { color: palette.text }]}>
            {locationValue}
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.ordersCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.accentSoftBorder,
          },
        ]}
      >
        <View style={styles.ordersHeader}>
          <AppText style={[styles.ordersLabel, { color: palette.accentStrong }]}>
            {todayOrdersLabel}
          </AppText>
          <AppText style={[styles.ordersValue, { color: palette.text }]}>
            {todayOrdersValue}
          </AppText>
        </View>
        <AppText style={[styles.currentOrderTitle, { color: palette.text }]}>
          {currentOrderTitle || 'No current order assigned'}
        </AppText>
        <AppText style={[styles.currentOrderSubtitle, { color: palette.muted }]}>
          {currentOrderSubtitle || 'The next active order will appear here.'}
        </AppText>
        {currentOrderMeta ? (
          <AppText style={[styles.currentOrderMeta, { color: palette.accentStrong }]}>
            {currentOrderMeta}
          </AppText>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <ActionButton icon="track" label="Track" color={accentColor} onPress={onTrack} />
        <ActionButton icon="phone" label="Call" color={accentColor} onPress={onCall} />
        <ActionButton icon="edit" label="Edit" color={accentColor} onPress={onEdit} />
        <ActionButton icon="view" label="View" color={accentColor} onPress={onView} />
        <ActionButton
          icon="history"
          label="History"
          color={accentColor}
          onPress={onHistory}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
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
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  vehicleNumber: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  capacity: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  status: {
    fontSize: 12,
    fontWeight: '800',
  },
  driverCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoCell: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  ordersCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  ordersLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  ordersValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  currentOrderTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  currentOrderSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  currentOrderMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
});
