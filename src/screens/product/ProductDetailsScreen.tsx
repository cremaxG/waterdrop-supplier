import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppButton, AppIcon, AppInput, AppText } from '../../components';
import { VehicleSectionCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';

export interface ProductVehicleInventory {
  id: string;
  vehicleName: string;
  quantity: number;
}

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitLabel: string;
  totalStock: number;
  godownInventory: number;
  demand: string;
  trendKey: 'productTrendFast' | 'productTrendSteady' | 'productTrendLow';
  reorderLevel: number;
  description: string;
  vehicleInventory: ProductVehicleInventory[];
}

interface ProductDetailsScreenProps {
  product: ProductRecord;
  onBack: () => void;
  onUpdateGodownInventory: (nextQuantity: number) => void;
  onUpdateVehicleInventory: (vehicleId: string, nextQuantity: number) => void;
}

export function ProductDetailsScreen({
  product,
  onBack,
  onUpdateGodownInventory,
  onUpdateVehicleInventory,
}: ProductDetailsScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [godownInput, setGodownInput] = useState(String(product.godownInventory));
  const [vehicleInputs, setVehicleInputs] = useState<Record<string, string>>(
    Object.fromEntries(
      product.vehicleInventory.map(item => [item.id, String(item.quantity)]),
    ),
  );

  const explicitVehicleQuantity = product.vehicleInventory.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const totalVehicleQuantity =
    explicitVehicleQuantity > 0
      ? explicitVehicleQuantity
      : Math.max(product.totalStock - product.godownInventory, 0);

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} style={styles.backRow}>
        <AppIcon name="back" size={18} color={palette.accentStrong} />
        <AppText style={[styles.backText, { color: palette.accentStrong }]}>
          {t('productBackButton')}
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
          {product.name}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {product.description}
        </AppText>

        <View style={styles.metricRow}>
          {[
            {
              label: t('productStockLabel'),
              value: `${product.totalStock} ${product.unitLabel}`,
            },
            {
              label: t('productDemandLabel'),
              value: product.demand,
            },
            {
              label: t('productReorderLevelLabel'),
              value: `${product.reorderLevel} ${product.unitLabel}`,
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
        title={t('productBasicDetailsTitle')}
        subtitle={t('productBasicDetailsSubtitle')}
      >
        <View style={styles.detailStack}>
          {[
            { label: t('productSkuLabel'), value: product.sku },
            { label: t('productCategoryLabel'), value: product.category },
            { label: t('productUnitLabel'), value: product.unitLabel },
            { label: t('productTrendLabel'), value: t(product.trendKey) },
          ].map(item => (
            <View key={item.label} style={styles.detailRow}>
              <AppText style={[styles.detailLabel, { color: palette.muted }]}>
                {item.label}
              </AppText>
              <AppText style={[styles.detailValue, { color: palette.text }]}>
                {item.value}
              </AppText>
            </View>
          ))}
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('productGodownTitle')}
        subtitle={t('productGodownSubtitle')}
      >
        <View style={styles.detailStack}>
          <AppInput
            value={godownInput}
            onChangeText={setGodownInput}
            keyboardType="number-pad"
            placeholder={t('productGodownPlaceholder')}
          />
          <AppButton
            title={t('productUpdateGodownButton')}
            onPress={() => {
              const nextQuantity = Number(godownInput.replace(/[^\d]/g, ''));
              onUpdateGodownInventory(Number.isNaN(nextQuantity) ? 0 : nextQuantity);
              setGodownInput(
                String(Number.isNaN(nextQuantity) ? 0 : nextQuantity),
              );
            }}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('productVehicleInventoryTitle')}
        subtitle={t('productVehicleInventorySubtitle')}
      >
        <View style={styles.summaryRow}>
          <AppText style={[styles.summaryLabel, { color: palette.muted }]}>
            {t('productVehicleInventorySummary')}
          </AppText>
          <AppText style={[styles.summaryValue, { color: palette.text }]}>
            {totalVehicleQuantity} {product.unitLabel}
          </AppText>
        </View>

        <View style={styles.detailStack}>
          {product.vehicleInventory.map(item => (
            <View
              key={item.id}
              style={[
                styles.inventoryCard,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.inventoryHeader}>
                <AppText style={[styles.inventoryTitle, { color: palette.text }]}>
                  {item.vehicleName}
                </AppText>
                <AppText style={[styles.inventoryMeta, { color: palette.muted }]}>
                  {item.quantity} {product.unitLabel}
                </AppText>
              </View>
              <View style={styles.inventoryActionRow}>
                <View style={styles.inventoryInputWrap}>
                  <AppInput
                    value={vehicleInputs[item.id] ?? String(item.quantity)}
                    onChangeText={value =>
                      setVehicleInputs(current => ({
                        ...current,
                        [item.id]: value,
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder={t('productVehicleQuantityPlaceholder')}
                  />
                </View>
                <AppButton
                  title={t('productVehicleUpdateButton')}
                  onPress={() => {
                    const nextQuantity = Number(
                      (vehicleInputs[item.id] ?? '').replace(/[^\d]/g, ''),
                    );
                    onUpdateVehicleInventory(
                      item.id,
                      Number.isNaN(nextQuantity) ? 0 : nextQuantity,
                    );
                    setVehicleInputs(current => ({
                      ...current,
                      [item.id]: String(Number.isNaN(nextQuantity) ? 0 : nextQuantity),
                    }));
                  }}
                  style={styles.secondaryButton}
                  textStyle={styles.secondaryButtonText}
                />
              </View>
            </View>
          ))}
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
  detailStack: {
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
  primaryButton: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
    borderRadius: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#DFF6FF',
    borderColor: '#B8E6FB',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#0369A1',
    fontWeight: '800',
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  inventoryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  inventoryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  inventoryMeta: {
    fontSize: 13,
  },
  inventoryActionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  inventoryInputWrap: {
    flex: 1,
  },
});
