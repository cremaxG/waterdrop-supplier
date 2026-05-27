import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppBackButton, AppText } from '../../components';
import { VehicleHistoryRow, VehicleSectionCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';
import { VehicleRecord } from './VehicleDetailsScreen';

type HistoryFilterKey =
  | 'all'
  | 'delivered'
  | 'cancelled'
  | 'confirmed'
  | 'out_for_delivery';

interface VehicleHistoryScreenProps {
  vehicle: VehicleRecord;
  onBack: () => void;
  onOpenHistoryItem: (historyItemId: string) => void;
}

export function VehicleHistoryScreen({
  vehicle,
  onBack,
  onOpenHistoryItem,
}: VehicleHistoryScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [selectedFilter, setSelectedFilter] = React.useState<HistoryFilterKey>('all');

  const historySummary = useMemo(() => {
    const tripCount = vehicle.history.length;
    const earnings = vehicle.history.reduce((total, item) => {
      const numeric = Number(item.earnings.replace(/[^\d.]/g, ''));
      return total + numeric;
    }, 0);
    const average = tripCount > 0 ? Math.round(earnings / tripCount) : 0;
    const bestRoute = vehicle.history.reduce((currentBest, item) => {
      const currentValue = Number(currentBest.earnings.replace(/[^\d.]/g, ''));
      const itemValue = Number(item.earnings.replace(/[^\d.]/g, ''));
      return itemValue > currentValue ? item : currentBest;
    }, vehicle.history[0]);

    return {
      tripCount,
      averageEarnings: `₹${average.toLocaleString('en-IN')}`,
      bestRoute: bestRoute?.route ?? '-',
    };
  }, [vehicle.history]);

  const filteredHistory = useMemo(() => {
    if (selectedFilter === 'all') {
      return vehicle.history;
    }

    return vehicle.history.filter(item => {
      const normalizedStatus = item.completionStatus.trim().toLowerCase();

      if (selectedFilter === 'out_for_delivery') {
        return normalizedStatus === 'out for delivery';
      }

      return normalizedStatus === selectedFilter;
    });
  }, [selectedFilter, vehicle.history]);

  const filterOptions: Array<{ key: HistoryFilterKey; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'out_for_delivery', label: 'Out for delivery' },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <AppBackButton onPress={onBack} label={t('vehicleHistoryBackButton')} />

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
        <AppText style={[styles.heroTitle, { color: palette.text }]}>
          {vehicle.name}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {t('vehicleHistoryScreenSubtitle')}
        </AppText>

        <View style={styles.metricRow}>
          {[
            {
              label: t('vehicleHistoryMetricTrips'),
              value: String(historySummary.tripCount),
            },
            {
              label: t('vehicleHistoryMetricAvgEarnings'),
              value: historySummary.averageEarnings,
            },
            {
              label: t('vehicleHistoryMetricBestRoute'),
              value: historySummary.bestRoute,
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
              <AppText
                numberOfLines={2}
                style={[styles.metricValue, { color: palette.text }]}
              >
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
        title={t('vehicleHistoryTimelineTitle')}
        subtitle={t('vehicleHistoryTimelineSubtitle')}
      >
        <View style={styles.filterRow}>
          {filterOptions.map(option => (
            <Pressable
              key={option.key}
              onPress={() => setSelectedFilter(option.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedFilter === option.key
                      ? palette.accentSoft
                      : palette.surfaceSoft,
                  borderColor:
                    selectedFilter === option.key
                      ? palette.accentSoftBorder
                      : palette.border,
                },
              ]}
            >
              <AppText
                style={[
                  styles.filterText,
                  {
                    color:
                      selectedFilter === option.key
                        ? palette.accentStrong
                        : palette.muted,
                  },
                ]}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        <View style={styles.historyList}>
          {filteredHistory.length > 0 ? (
            filteredHistory.map(item => (
              <VehicleHistoryRow
                key={`${vehicle.id}-${item.id}-${item.time}`}
                orderNumber={item.orderNumber ?? item.id}
                confirmationLocation={item.confirmationLocation ?? item.route}
                deliveryLocation={item.deliveryLocation ?? item.stopAddress}
                status={item.completionStatus}
                time={item.time}
                paymentAmount={item.orderValue}
                onPress={() => onOpenHistoryItem(item.id)}
              />
            ))
          ) : (
            <AppText style={[styles.emptyText, { color: palette.muted }]}>
              {t('vehicleHistoryEmptyState')}
            </AppText>
          )}
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
  historyList: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
