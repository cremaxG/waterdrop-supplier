import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppButton, AppIcon, AppText } from '../../components';
import {
  VehicleProductRow,
  VehicleSectionCard,
} from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';

export interface VehicleProductItem {
  name: string;
  quantity: string;
  trend: string;
}

export interface VehicleHistoryItem {
  id: string;
  route: string;
  orderNumber?: string;
  confirmationLocation?: string;
  deliveryLocation?: string;
  time: string;
  orders: string;
  earnings: string;
  customerName: string;
  stopAddress: string;
  paymentMode: string;
  orderValue: string;
  deliveredUnits: string;
  completionStatus: string;
  startReading: string;
  endReading: string;
  notes: string;
}

export interface VehicleRecord {
  id: string;
  name: string;
  route: string;
  capacity: string;
  currentLocation: string;
  driverName: string;
  driverPhone: string;
  driverEmail?: string;
  driverLicenseNumber?: string;
  driverRating: string;
  shiftWindow: string;
  earningsToday: string;
  deliveredStops: string;
  pendingStops: string;
  cashCollected: string;
  fuelLevel: string;
  lastUpdated: string;
  nextService: string;
  etaToHub: string;
  isOnline: boolean;
  reviewStatus: 'approved' | 'pending';
  products: VehicleProductItem[];
  history: VehicleHistoryItem[];
}

interface VehicleDetailsScreenProps {
  vehicle: VehicleRecord;
  onBack: () => void;
  onToggleAvailability: () => void;
  onOpenHistory: () => void;
}

export function VehicleDetailsScreen({
  vehicle,
  onBack,
  onToggleAvailability,
  onOpenHistory,
}: VehicleDetailsScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const isPendingReview = vehicle.reviewStatus === 'pending';
  const statusColor = isPendingReview
    ? '#D97706'
    : vehicle.isOnline
      ? '#059669'
      : '#DC2626';
  const statusBackground = isPendingReview
    ? '#FEF3C7'
    : vehicle.isOnline
      ? '#DCFCE7'
      : '#FEE2E2';
  const statusBorder = isPendingReview
    ? '#FCD34D'
    : vehicle.isOnline
      ? '#86EFAC'
      : '#FCA5A5';
  const statusLabel = isPendingReview
    ? t('vehiclePendingReviewStatus')
    : vehicle.isOnline
      ? t('vehicleStatusOnline')
      : t('vehicleStatusOffline');

  const handleCallDriver = () => {
    const phoneNumber = vehicle.driverPhone.replace(/\s+/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} style={styles.backRow}>
        <AppIcon name="back" size={18} color={palette.accentStrong} />
        <AppText style={[styles.backText, { color: palette.accentStrong }]}>
          {t('vehicleBackButton')}
        </AppText>
      </Pressable>

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
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <AppText style={[styles.heroTitle, { color: palette.text }]}>
              {vehicle.name}
            </AppText>
            <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
              {vehicle.route}
            </AppText>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusBackground,
                borderColor: statusBorder,
              },
            ]}
          >
            <AppText style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </AppText>
          </View>
        </View>

        {isPendingReview ? (
          <View
            style={[
              styles.reviewBanner,
              styles.reviewBannerPending,
            ]}
          >
            <AppText style={[styles.reviewBannerText, styles.reviewBannerPendingText]}>
              {t('vehiclePendingReviewBanner')}
            </AppText>
          </View>
        ) : null}

        <View style={styles.metricRow}>
          {[
            {
              label: t('vehicleMetricEarnings'),
              value: vehicle.earningsToday,
            },
            {
              label: t('vehicleMetricDeliveredStops'),
              value: vehicle.deliveredStops,
            },
            {
              label: t('vehicleMetricPendingStops'),
              value: vehicle.pendingStops,
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

        <View
          style={[
            styles.locationCard,
            {
              backgroundColor: palette.surfaceSoft,
              borderColor: palette.border,
            },
          ]}
        >
          <AppIcon name="map" size={18} color={palette.accentStrong} />
          <View style={styles.locationCopy}>
            <AppText style={[styles.locationLabel, { color: palette.muted }]}>
              {t('vehicleCurrentLocation')}
            </AppText>
            <AppText style={[styles.locationValue, { color: palette.text }]}>
              {vehicle.currentLocation}
            </AppText>
          </View>
        </View>
      </View>

      <VehicleSectionCard
        title={t('vehicleDriverSectionTitle')}
        subtitle={t('vehicleDriverSectionSubtitle')}
      >
        <View style={styles.infoStack}>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleDriverNameLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.driverName}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleDriverPhoneLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.driverPhone}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Driver email
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.driverEmail || '—'}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              Driver licence number
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.driverLicenseNumber || '—'}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleDriverRatingLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.driverRating}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleDriverShiftLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.shiftWindow}
            </AppText>
          </View>
          <AppButton
            title={t('vehicleCallDriverButton')}
            onPress={handleCallDriver}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
            textStyle={[styles.secondaryButtonText, { color: palette.accentStrong }]}
          />
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleOperationsTitle')}
        subtitle={t('vehicleOperationsSubtitle')}
      >
        <View style={styles.infoStack}>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleCardCapacity')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.capacity}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleFuelLevelLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.fuelLevel}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleCashCollectedLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.cashCollected}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleLastUpdatedLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.lastUpdated}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleEtaToHubLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.etaToHub}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: palette.muted }]}>
              {t('vehicleNextServiceLabel')}
            </AppText>
            <AppText style={[styles.detailValue, { color: palette.text }]}>
              {vehicle.nextService}
            </AppText>
          </View>
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleProductSectionTitle')}
        subtitle={t('vehicleProductSectionSubtitle')}
      >
        <View style={styles.infoStack}>
          {vehicle.products.map(product => (
            <VehicleProductRow
              key={`${vehicle.id}-${product.name}`}
              name={product.name}
              quantity={product.quantity}
              trend={product.trend}
            />
          ))}
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleActionsTitle')}
        subtitle={t('vehicleActionsSubtitle')}
      >
        <View style={styles.infoStack}>
          <AppButton
            title={
              isPendingReview
                ? t('vehiclePendingReviewActionLabel')
                : vehicle.isOnline
                ? t('vehicleGoOfflineButton')
                : t('vehicleGoOnlineButton')
            }
            onPress={onToggleAvailability}
            disabled={isPendingReview}
            style={vehicle.isOnline ? styles.offlineButton : styles.onlineButton}
            textStyle={styles.primaryButtonText}
          />
          <AppButton
            title={t('vehicleViewHistoryButton')}
            onPress={onOpenHistory}
            disabled={vehicle.history.length === 0}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
            textStyle={[styles.secondaryButtonText, { color: palette.accentStrong }]}
          />
        </View>
      </VehicleSectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 32,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
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
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  reviewBanner: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  reviewBannerPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  reviewBannerText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  reviewBannerPendingText: {
    color: '#D97706',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 17,
  },
  locationCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationCopy: {
    flex: 1,
    marginLeft: 10,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 3,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoStack: {
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
  onlineButton: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
    borderRadius: 18,
  },
  offlineButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
    borderRadius: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 18,
  },
  secondaryButtonText: {
    fontWeight: '800',
  },
});
