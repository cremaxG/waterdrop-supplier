import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon, AppText } from '../../components';
import { VehicleHistoryRow, VehicleSectionCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';
import { VehicleRecord } from './VehicleDetailsScreen';

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

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} style={styles.backRow}>
        <AppIcon name="back" size={18} color={palette.accentStrong} />
        <AppText style={[styles.backText, { color: palette.accentStrong }]}>
          {t('vehicleHistoryBackButton')}
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
        <View style={styles.historyList}>
          {vehicle.history.length > 0 ? (
            vehicle.history.map(item => (
              <VehicleHistoryRow
                key={`${vehicle.id}-${item.route}-${item.time}`}
                route={item.route}
                time={item.time}
                orders={item.orders}
                earnings={item.earnings}
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
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
