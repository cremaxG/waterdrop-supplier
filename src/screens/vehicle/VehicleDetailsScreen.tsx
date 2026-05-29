import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppBackButton, AppButton, AppIcon, AppText } from '../../components';
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

export interface VehicleCurrentOrder {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  value?: string;
}

export interface VehicleRecord {
  id: string;
  name: string;
  vehicleNumber?: string;
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
  todayOrdersCount?: number;
  currentOrder?: VehicleCurrentOrder | null;
  products: VehicleProductItem[];
  history: VehicleHistoryItem[];
}

interface VehicleDetailsScreenProps {
  vehicle: VehicleRecord;
  onBack: () => void;
  onEdit?: () => void;
  onOpenActionMenu?: () => void;
  onToggleAvailability: () => void;
  onOpenHistory: () => void;
}

export function VehicleDetailsScreen({
  vehicle,
  onBack,
  onEdit,
  onOpenActionMenu,
  onToggleAvailability,
  onOpenHistory,
}: VehicleDetailsScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const isPendingReview = vehicle.reviewStatus === 'pending';
  const statusColor = isPendingReview
    ? '#D97706'
    : vehicle.isOnline
      ? '#0284C7'
      : '#DC2626';
  const statusBackground = isPendingReview
    ? '#FEF3C7'
    : vehicle.isOnline
      ? '#E0F2FE'
      : '#FEE2E2';
  const statusBorder = isPendingReview
    ? '#FCD34D'
    : vehicle.isOnline
      ? '#7DD3FC'
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
      <View style={styles.headerBar}>
        <AppBackButton onPress={onBack} label={t('vehicleBackButton')} />
        {onOpenActionMenu ? (
          <Pressable
            onPress={onOpenActionMenu}
            style={[
              styles.moreButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <AppIcon name="more" size={20} color={palette.accentStrong} />
          </Pressable>
        ) : null}
      </View>

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
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
          >
            <AppIcon name="vehicles" size={22} color={statusColor} />
          </View>

          <View style={styles.heroCopy}>
            <AppText style={[styles.heroTitle, { color: palette.text }]}>
              {vehicle.name}
            </AppText>
            <View style={styles.heroMetaRow}>
              <AppText style={[styles.heroNumber, { color: palette.muted }]}>
                {vehicle.vehicleNumber || vehicle.route}
              </AppText>
              <AppText style={[styles.heroCapacity, { color: palette.text }]}>
                {vehicle.capacity}
              </AppText>
            </View>
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
          <View style={[styles.reviewBanner, styles.reviewBannerPending]}>
            <AppText style={[styles.reviewBannerText, styles.reviewBannerPendingText]}>
              {t('vehiclePendingReviewBanner')}
            </AppText>
          </View>
        ) : null}

        <View style={styles.metricRow}>
          {[
            {
              label: t('dashboardMetricOrders'),
              value: String(vehicle.todayOrdersCount ?? 0),
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
        title="Today's orders"
        subtitle="Current dispatch snapshot and order activity for this vehicle."
      >
        <View style={styles.infoStack}>
          <View
            style={[
              styles.currentOrderCard,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
          >
            <AppText style={[styles.currentOrderTitle, { color: palette.text }]}>
              {vehicle.currentOrder?.title || 'No active order assigned'}
            </AppText>
            <AppText style={[styles.currentOrderSubtitle, { color: palette.muted }]}>
              {vehicle.currentOrder?.subtitle ||
                'The latest available vehicle order will appear here once assigned.'}
            </AppText>
            <View style={styles.currentOrderMetaRow}>
              <AppText style={[styles.currentOrderMeta, { color: palette.accentStrong }]}>
                {vehicle.currentOrder?.status || 'Awaiting assignment'}
              </AppText>
              {vehicle.currentOrder?.value ? (
                <AppText style={[styles.currentOrderMeta, { color: palette.text }]}>
                  {vehicle.currentOrder.value}
                </AppText>
              ) : null}
            </View>
          </View>
          <View style={styles.inlineDetailsRow}>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                Earnings today
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.earningsToday}
              </AppText>
            </View>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                Cash collected
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.cashCollected}
              </AppText>
            </View>
          </View>
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleDriverSectionTitle')}
        subtitle={t('vehicleDriverSectionSubtitle')}
      >
        <View style={styles.infoStack}>
          {[
            { label: t('vehicleDriverNameLabel'), value: vehicle.driverName },
            { label: t('vehicleDriverPhoneLabel'), value: vehicle.driverPhone || '—' },
            { label: 'Driver email', value: vehicle.driverEmail || '—' },
            {
              label: 'Driver licence number',
              value: vehicle.driverLicenseNumber || '—',
            },
            { label: t('vehicleDriverRatingLabel'), value: vehicle.driverRating || '—' },
            { label: t('vehicleDriverShiftLabel'), value: vehicle.shiftWindow || '—' },
          ].map(item => (
            <View
              key={item.label}
              style={[
                styles.detailBlock,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <AppText style={[styles.detailLabel, { color: palette.muted }]}>
                {item.label}
              </AppText>
              <AppText style={[styles.detailValue, { color: palette.text }]}>
                {item.value}
              </AppText>
            </View>
          ))}
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
          <View style={styles.inlineDetailsRow}>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                {t('vehicleCardRoute')}
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.route}
              </AppText>
            </View>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                {t('vehicleFuelLevelLabel')}
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.fuelLevel}
              </AppText>
            </View>
          </View>
          <View style={styles.inlineDetailsRow}>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                {t('vehicleLastUpdatedLabel')}
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.lastUpdated}
              </AppText>
            </View>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                {t('vehicleEtaToHubLabel')}
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.etaToHub || '—'}
              </AppText>
            </View>
          </View>
          <View style={styles.inlineDetailsRow}>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                {t('vehicleNextServiceLabel')}
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.nextService || '—'}
              </AppText>
            </View>
            <View style={styles.inlineDetailCell}>
              <AppText style={[styles.inlineDetailLabel, { color: palette.muted }]}>
                Vehicle number
              </AppText>
              <AppText style={[styles.inlineDetailValue, { color: palette.text }]}>
                {vehicle.vehicleNumber || '—'}
              </AppText>
            </View>
          </View>
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleProductSectionTitle')}
        subtitle={t('vehicleProductSectionSubtitle')}
      >
        <View style={styles.infoStack}>
          {vehicle.products.length ? (
            vehicle.products.map(product => (
              <VehicleProductRow
                key={`${vehicle.id}-${product.name}`}
                name={product.name}
                quantity={product.quantity}
                trend={product.trend}
              />
            ))
          ) : (
            <AppText style={[styles.emptyText, { color: palette.muted }]}>
              No products are assigned to this vehicle yet.
            </AppText>
          )}
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleActionsTitle')}
        subtitle={t('vehicleActionsSubtitle')}
      >
        <View style={styles.infoStack}>
          {onEdit ? (
            <AppButton
              title="Edit vehicle"
              onPress={onEdit}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.accentSoftBorder,
                },
              ]}
              textStyle={[styles.secondaryButtonText, { color: palette.accentStrong }]}
            />
          ) : null}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
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
    gap: 12,
    marginBottom: 16,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroNumber: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  heroCapacity: {
    fontSize: 14,
    fontWeight: '800',
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
  currentOrderCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  currentOrderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  currentOrderSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  currentOrderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  currentOrderMeta: {
    fontSize: 12,
    fontWeight: '800',
  },
  inlineDetailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineDetailCell: {
    flex: 1,
  },
  inlineDetailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  inlineDetailValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  detailBlock: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
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
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
