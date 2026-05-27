import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppBackButton, AppText } from '../../components';
import { VehicleSectionCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';
import { VehicleHistoryItem, VehicleRecord } from './VehicleDetailsScreen';

interface VehicleHistoryOrderScreenProps {
  vehicle: VehicleRecord;
  historyItem: VehicleHistoryItem;
  onBack: () => void;
}

export function VehicleHistoryOrderScreen({
  vehicle,
  historyItem,
  onBack,
}: VehicleHistoryOrderScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <AppBackButton onPress={onBack} label={t('vehicleHistoryOrderBackButton')} />

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <AppText style={[styles.orderId, { color: palette.accentStrong }]}>
          {historyItem.orderNumber ?? historyItem.id}
        </AppText>
        <AppText style={[styles.heroTitle, { color: palette.text }]}>
          {vehicle.name} • {vehicle.route}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {historyItem.time}
        </AppText>

        <View style={styles.metricRow}>
          {[
            {
              label: t('vehicleHistoryOrderMetricValue'),
              value: historyItem.orderValue,
            },
            {
              label: t('vehicleHistoryOrderMetricEarnings'),
              value: historyItem.earnings,
            },
            {
              label: t('vehicleHistoryOrderMetricUnits'),
              value: historyItem.deliveredUnits,
            },
          ].map(metric => (
            <View
              key={metric.label}
              style={[
                styles.metricCard,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <AppText style={[styles.metricValue, { color: palette.text }]}>
                {metric.value}
              </AppText>
              <AppText style={[styles.metricLabel, { color: palette.muted }]}>
                {metric.label}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <VehicleSectionCard
        title="Order confirmation"
        subtitle="Pickup and assignment details for this order."
      >
        <View style={styles.stack}>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Order number
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.orderNumber ?? historyItem.id}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Confirmation location
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.confirmationLocation ?? historyItem.route}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Assigned vehicle
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.name} • {vehicle.route}
            </AppText>
          </View>
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title="Delivery details"
        subtitle="Delivery destination, status, and fulfilment details."
      >
        <View style={styles.stack}>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Delivery location
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.deliveryLocation ?? historyItem.stopAddress}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Order status
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.completionStatus}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Delivered units
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.deliveredUnits}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Customer
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.customerName}
            </AppText>
          </View>
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title="Payment details"
        subtitle="Payment amount and collection mode for this order."
      >
        <View style={styles.stack}>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Payment amount
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.orderValue}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Payment mode
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.paymentMode}
            </AppText>
            </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Vehicle earnings
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.earnings}
            </AppText>
          </View>
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title="Ratings"
        subtitle="Ratings and operational notes attached to this order."
      >
        <View style={styles.stack}>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Driver rating
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.driverRating || '—'}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Dispatch notes
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {historyItem.notes || '—'}
            </AppText>
          </View>
        </View>
      </VehicleSectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 5,
  },
  orderId: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 17,
  },
  stack: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
});
