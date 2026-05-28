import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppRefreshScrollView, AppText } from '../components';
import { useAppPalette } from '../hooks/useAppPalette';
import { useOperations } from '../providers/OperationsProvider';
import { useTranslation } from '../providers/AppProviders';

interface DashboardScreenProps {
  onOpenVehicles?: () => void;
  onOpenProducts?: () => void;
  onOpenProfile?: () => void;
}

const extractNumber = (value: string) => Number(value.replace(/[^\d.]/g, '')) || 0;

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const getProductVehicleUnits = (product: {
  totalStock: number;
  godownInventory: number;
  vehicleInventory: Array<{ quantity: number }>;
}) => {
  const explicitVehicleUnits = product.vehicleInventory.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  if (explicitVehicleUnits > 0) {
    return explicitVehicleUnits;
  }

  return Math.max(product.totalStock - product.godownInventory, 0);
};

export function DashboardScreen({
  onOpenVehicles = () => undefined,
  onOpenProducts = () => undefined,
  onOpenProfile = () => undefined,
}: DashboardScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const { vehicles, products, refreshProducts, refreshVehicles } = useOperations();

  const metrics = useMemo(() => {
    const onlineVehicles = vehicles.filter(
      vehicle => vehicle.reviewStatus === 'approved' && vehicle.isOnline,
    ).length;
    const offlineVehicles = vehicles.filter(
      vehicle => vehicle.reviewStatus === 'approved' && !vehicle.isOnline,
    ).length;
    const pendingReviewVehicles = vehicles.filter(
      vehicle => vehicle.reviewStatus === 'pending',
    ).length;
    const todayOrders = vehicles.reduce(
      (total, vehicle) => total + extractNumber(vehicle.deliveredStops),
      0,
    );
    const pendingStops = vehicles.reduce(
      (total, vehicle) => total + extractNumber(vehicle.pendingStops),
      0,
    );
    const todayRevenue = vehicles.reduce(
      (total, vehicle) => total + extractNumber(vehicle.earningsToday),
      0,
    );
    const todayCash = vehicles.reduce(
      (total, vehicle) => total + extractNumber(vehicle.cashCollected),
      0,
    );
    const totalGodownInventory = products.reduce(
      (total, product) => total + product.godownInventory,
      0,
    );
    const totalVehicleInventory = products.reduce(
      (total, product) => total + getProductVehicleUnits(product),
      0,
    );
    const lowStockProducts = products
      .filter(product => product.totalStock <= product.reorderLevel)
      .sort((left, right) => left.totalStock - right.totalStock);
    const topProducts = [...products]
      .sort((left, right) => extractNumber(right.demand) - extractNumber(left.demand))
      .slice(0, 3);
    const topVehicles = [...vehicles]
      .sort(
        (left, right) =>
          extractNumber(right.deliveredStops) - extractNumber(left.deliveredStops),
      )
      .slice(0, 3);
    const recentTrips = vehicles
      .flatMap(vehicle =>
        vehicle.history.slice(0, 1).map(historyItem => ({
          id: historyItem.id,
          vehicleName: vehicle.name,
          route: historyItem.route,
          earnings: historyItem.earnings,
          status: historyItem.completionStatus,
        })),
      )
      .slice(0, 3);

    return {
      onlineVehicles,
      offlineVehicles,
      pendingReviewVehicles,
      todayOrders,
      pendingStops,
      todayRevenue,
      todayCash,
      totalGodownInventory,
      totalVehicleInventory,
      lowStockProducts,
      topProducts,
      topVehicles,
      recentTrips,
      bestVehicle: topVehicles[0] ?? null,
    };
  }, [products, vehicles]);

  const dashboardMetrics = [
    { label: t('dashboardMetricOrders'), value: String(metrics.todayOrders) },
    { label: t('dashboardMetricVehicles'), value: String(vehicles.length) },
    { label: t('dashboardMetricProducts'), value: String(products.length) },
    {
      label: t('dashboardMetricRevenue'),
      value: formatCurrency(metrics.todayRevenue),
    },
  ];

  return (
    <AppRefreshScrollView
      onRefresh={() => Promise.all([refreshVehicles(), refreshProducts()]).then(() => undefined)}
    >
      
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
        <View pointerEvents="none" style={styles.heroDecor}>
          <View
            style={[
              styles.heroBubble,
              styles.heroBubbleTop,
              { backgroundColor: palette.heroTop },
            ]}
          />
          <View
            style={[
              styles.heroBubble,
              styles.heroBubbleBottom,
              { backgroundColor: palette.heroBottom },
            ]}
          />
        </View>
        <View style={styles.heroBadge}>
          <AppIcon name="water" size={24} color={palette.accentStrong} />
          <AppText style={[styles.heroTitle, { color: palette.accentStrong }]}>
          {t('COMING SOON')}
          </AppText>
        </View>
        {/* <AppText style={[styles.heroTitle, { color: palette.text }]}>
          {t('dashboardHeading')}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {t('dashboardSubtitle')}
        </AppText>

        <View style={styles.heroSummary}>
          <AppText style={[styles.heroSummaryText, { color: palette.text }]}> 
            {`${products.length} ${t('dashboardMetricProducts')} • ${vehicles.length} ${t('dashboardMetricVehicles')}`}
          </AppText>
          <AppText style={[styles.heroSummaryCaption, { color: palette.muted }]}> 
            {`${t('dashboardGodownLabel')}: ${metrics.totalGodownInventory} • ${t('dashboardVehicleLoadLabel')}: ${metrics.totalVehicleInventory}`}
          </AppText>
        </View>

        <View style={styles.metricGrid}>
          {dashboardMetrics.map(metric => (
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
        </View> */}
      </View>

      {/* <View style={styles.statusStrip}>
        {[
          {
            label: t('dashboardOnlineVehiclesLabel'),
            value: String(metrics.onlineVehicles),
            color: '#0284C7',
            background: '#E0F2FE',
            border: '#7DD3FC',
          },
          {
            label: t('dashboardOfflineVehiclesLabel'),
            value: String(metrics.offlineVehicles),
            color: '#DC2626',
            background: '#FEE2E2',
            border: '#FCA5A5',
          },
          {
            label: t('dashboardPendingReviewLabel'),
            value: String(metrics.pendingReviewVehicles),
            color: '#D97706',
            background: '#FEF3C7',
            border: '#FCD34D',
          },
        ].map(item => (
          <View
            key={item.label}
            style={[
              styles.statusChip,
              {
                backgroundColor: item.background,
                borderColor: item.border,
              },
            ]}
          >
            <AppText style={[styles.statusChipValue, { color: item.color }]}>
              {item.value}
            </AppText>
            <AppText style={[styles.statusChipLabel, { color: item.color }]}>
              {item.label}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        <Pressable
          onPress={onOpenVehicles}
          style={[
            styles.detailCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <AppIcon name="vehicles" size={18} color={palette.accentStrong} />
          <AppText style={[styles.cardTitle, { color: palette.text }]}>
            {t('dashboardFleetTitle')}
          </AppText>
          <AppText style={[styles.cardBody, { color: palette.muted }]}>
            {metrics.bestVehicle
              ? `${metrics.bestVehicle.name} • ${metrics.bestVehicle.route}`
              : t('dashboardNoFleetInsight')}
          </AppText>
          <AppText style={[styles.cardHighlight, { color: palette.text }]}>
            {t('dashboardPendingStopsLabel')}: {metrics.pendingStops}
          </AppText>
        </Pressable>

        <Pressable
          onPress={onOpenProducts}
          style={[
            styles.detailCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <AppIcon name="products" size={18} color={palette.accentStrong} />
          <AppText style={[styles.cardTitle, { color: palette.text }]}>
            {t('dashboardInventoryTitle')}
          </AppText>
          <AppText style={[styles.cardBody, { color: palette.muted }]}>
            {t('dashboardGodownLabel')}: {metrics.totalGodownInventory}
          </AppText>
          <AppText style={[styles.cardHighlight, { color: palette.text }]}>
            {t('dashboardVehicleLoadLabel')}: {metrics.totalVehicleInventory}
          </AppText>
        </Pressable>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <AppText style={[styles.sectionTitle, { color: palette.text }]}>
          {t('dashboardFinanceTitle')}
        </AppText>
        <View style={styles.financeRow}>
          <View style={styles.financeBlock}>
            <AppText style={[styles.financeLabel, { color: palette.muted }]}>
              {t('dashboardMetricRevenue')}
            </AppText>
            <AppText style={[styles.financeValue, { color: palette.text }]}>
              {formatCurrency(metrics.todayRevenue)}
            </AppText>
          </View>
          <View style={styles.financeBlock}>
            <AppText style={[styles.financeLabel, { color: palette.muted }]}>
              {t('dashboardCashCollectedLabel')}
            </AppText>
            <AppText style={[styles.financeValue, { color: palette.text }]}>
              {formatCurrency(metrics.todayCash)}
            </AppText>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <AppText style={[styles.sectionTitle, { color: palette.text }]}>
          {t('dashboardTopProductsTitle')}
        </AppText>
        <AppText style={[styles.sectionSubtitle, { color: palette.muted }]}>
          {t('dashboardTopProductsSubtitle')}
        </AppText>
        <View style={styles.stack}>
          {metrics.topProducts.map(product => (
            <Pressable
              key={product.id}
              onPress={onOpenProducts}
              style={[
                styles.rowCard,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.rowCopy}>
                <AppText style={[styles.rowTitle, { color: palette.text }]}>
                  {product.name}
                </AppText>
                <AppText style={[styles.rowMeta, { color: palette.muted }]}>
                  {t(product.trendKey)}
                </AppText>
              </View>
              <View style={styles.rowAside}>
                <AppText style={[styles.rowValue, { color: palette.text }]}>
                  {product.totalStock}
                </AppText>
                <AppText style={[styles.rowMeta, { color: palette.muted }]}>
                  {product.demand}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <AppText style={[styles.sectionTitle, { color: palette.text }]}>
          {t('dashboardLowStockTitle')}
        </AppText>
        <View style={styles.stack}>
          {metrics.lowStockProducts.length > 0 ? (
            metrics.lowStockProducts.map(product => (
              <Pressable
                key={product.id}
                onPress={onOpenProducts}
                style={[
                  styles.rowCard,
                  styles.lowStockRowCard,
                ]}
              >
                <View style={styles.rowCopy}>
                  <AppText style={[styles.rowTitle, { color: palette.text }]}>
                    {product.name}
                  </AppText>
                  <AppText style={[styles.rowMeta, styles.lowStockText]}>
                    {t('dashboardReorderAtLabel')}: {product.reorderLevel}
                  </AppText>
                </View>
                <AppText style={[styles.rowValue, styles.lowStockText]}>
                  {product.totalStock}
                </AppText>
              </Pressable>
            ))
          ) : (
            <AppText style={[styles.emptyText, { color: palette.muted }]}>
              {t('dashboardNoLowStock')}
            </AppText>
          )}
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <AppText style={[styles.sectionTitle, { color: palette.text }]}>
          {t('dashboardRecentTripsTitle')}
        </AppText>
        <View style={styles.stack}>
          {metrics.recentTrips.map(trip => (
            <Pressable
              key={trip.id}
              onPress={onOpenVehicles}
              style={[
                styles.rowCard,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.rowCopy}>
                <AppText style={[styles.rowTitle, { color: palette.text }]}>
                  {trip.route}
                </AppText>
                <AppText style={[styles.rowMeta, { color: palette.muted }]}>
                  {trip.vehicleName}
                </AppText>
              </View>
              <View style={styles.rowAside}>
                <AppText style={[styles.rowValue, { color: palette.text }]}>
                  {trip.earnings}
                </AppText>
                <AppText style={[styles.rowMeta, { color: palette.muted }]}>
                  {trip.status}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <AppText style={[styles.sectionTitle, { color: palette.text }]}>
          {t('dashboardQuickActionsTitle')}
        </AppText>
        <View style={styles.quickActions}>
          {[
            {
              label: t('dashboardQuickVehicles'),
              onPress: onOpenVehicles,
            },
            {
              label: t('dashboardQuickProducts'),
              onPress: onOpenProducts,
            },
            {
              label: t('dashboardQuickProfile'),
              onPress: onOpenProfile,
            },
          ].map(action => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              style={[
                styles.quickAction,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.accentSoftBorder,
                },
              ]}
            >
              <AppText style={[styles.quickActionText, { color: palette.accentStrong }]}>
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View> */}
    </AppRefreshScrollView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    marginBottom: 18,
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 8,
  },
  heroDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroBubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroBubbleTop: {
    width: 180,
    height: 180,
    top: -60,
    right: -30,
  },
  heroBubbleBottom: {
    width: 160,
    height: 160,
    bottom: -90,
    left: -30,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 18,
  },
  heroSummary: {
    marginBottom: 18,
  },
  heroSummaryText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroSummaryCaption: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  statusChipValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusChipLabel: {
    fontSize: 12,
    lineHeight: 17,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  detailCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  cardHighlight: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  financeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  financeBlock: {
    flex: 1,
  },
  financeLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  financeValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  stack: {
    gap: 12,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCopy: {
    flex: 1,
  },
  rowAside: {
    alignItems: 'flex-end',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  lowStockRowCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  lowStockText: {
    color: '#D97706',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
