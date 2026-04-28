import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppButton, AppIcon, AppText } from '../../components';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';
import { useOperations } from '../../providers/OperationsProvider';
import { AddProductScreen, NewProductDraft } from './AddProductScreen';
import {
  ProductDetailsScreen,
  ProductRecord,
} from './ProductDetailsScreen';

interface ProductsScreenProps {
  onDetailVisibilityChange?: (isVisible: boolean) => void;
}

export function ProductsScreen({
  onDetailVisibilityChange,
}: ProductsScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const {
    products,
    addProduct,
    updateProductGodownInventory,
    updateProductVehicleInventory,
  } = useOperations();
  const { width } = useWindowDimensions();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isAddProductVisible, setAddProductVisible] = useState(false);
  const detailTranslateX = useRef(new Animated.Value(width)).current;
  const addTranslateX = useRef(new Animated.Value(width)).current;

  const selectedProduct = useMemo(
    () => products.find(product => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  useEffect(() => {
    if (!selectedProductId) {
      detailTranslateX.setValue(width);
    }

    if (!isAddProductVisible) {
      addTranslateX.setValue(width);
    }
  }, [addTranslateX, detailTranslateX, isAddProductVisible, selectedProductId, width]);

  const openProductDetails = (productId: string) => {
    detailTranslateX.setValue(width);
    setSelectedProductId(productId);
    onDetailVisibilityChange?.(true);

    requestAnimationFrame(() => {
      Animated.timing(detailTranslateX, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeProductDetails = () => {
    Animated.timing(detailTranslateX, {
      toValue: width,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setSelectedProductId(null);
      onDetailVisibilityChange?.(false);
    });
  };

  const openAddProduct = () => {
    addTranslateX.setValue(width);
    setAddProductVisible(true);
    onDetailVisibilityChange?.(true);

    requestAnimationFrame(() => {
      Animated.timing(addTranslateX, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeAddProduct = () => {
    Animated.timing(addTranslateX, {
      toValue: width,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setAddProductVisible(false);
      onDetailVisibilityChange?.(false);
    });
  };

  const handleAddProduct = (draft: NewProductDraft) => {
    const godownInventory = Number(draft.godownInventory) || 0;
    const newProduct: ProductRecord = {
      id: `product-${Date.now()}`,
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      category: draft.category.trim(),
      unitLabel: draft.unitLabel.trim(),
      totalStock: godownInventory,
      godownInventory,
      demand: draft.demand.trim(),
      trendKey: 'productTrendSteady',
      reorderLevel: Number(draft.reorderLevel) || 0,
      description: draft.description.trim(),
      vehicleInventory: [],
    };

    addProduct(newProduct);
    closeAddProduct();
  };

  const updateGodownInventory = (nextQuantity: number) => {
    if (!selectedProductId) {
      return;
    }
    updateProductGodownInventory(selectedProductId, nextQuantity);
  };

  const updateVehicleInventory = (vehicleId: string, nextQuantity: number) => {
    if (!selectedProductId) {
      return;
    }
    updateProductVehicleInventory(selectedProductId, vehicleId, nextQuantity);
  };

  return (
    <View style={styles.screenRoot}>
      <View style={styles.listScreen}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText style={[styles.sectionTitle, { color: palette.text }]}>
              {t('productsHeading')}
            </AppText>
            <AppText style={[styles.sectionSubtitle, { color: palette.muted }]}>
              {t('productsSubtitle')}
            </AppText>
          </View>
          <AppButton
            title={t('productAddButton')}
            onPress={openAddProduct}
            style={styles.addButton}
            textStyle={styles.addButtonText}
          />
        </View>

        {products.map(product => (
          <Pressable
            key={product.id}
            onPress={() => openProductDetails(product.id)}
            style={[
              styles.listCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.listCardHeader}>
              <View>
                <AppText style={[styles.listCardTitle, { color: palette.text }]}>
                  {product.name}
                </AppText>
                <AppText
                  style={[styles.listCardStatus, { color: palette.accentStrong }]}
                >
                  {t(product.trendKey)}
                </AppText>
              </View>
              <View
                style={[
                  styles.iconBadgeSmall,
                  {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accentSoftBorder,
                  },
                ]}
              >
                <AppIcon name="package" size={18} color={palette.accentStrong} />
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaBlock}>
                <AppText style={[styles.metaLabel, { color: palette.muted }]}>
                  {t('productStockLabel')}
                </AppText>
                <AppText style={[styles.metaValue, { color: palette.text }]}>
                  {product.totalStock}
                </AppText>
              </View>
              <View style={styles.metaBlock}>
                <AppText style={[styles.metaLabel, { color: palette.muted }]}>
                  {t('productDemandLabel')}
                </AppText>
                <AppText style={[styles.metaValue, { color: palette.text }]}>
                  {product.demand}
                </AppText>
              </View>
            </View>

            <View
              style={[
                styles.inventoryStrip,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <AppText style={[styles.inventoryStripLabel, { color: palette.muted }]}>
                {t('productGodownShortLabel')}
              </AppText>
              <AppText style={[styles.inventoryStripValue, { color: palette.text }]}>
                {product.godownInventory} {product.unitLabel}
              </AppText>
              <AppIcon name="chevron" size={18} color={palette.accentStrong} />
            </View>
          </Pressable>
        ))}
      </View>

      {selectedProduct ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: detailTranslateX }],
            },
          ]}
        >
          <ProductDetailsScreen
            product={selectedProduct}
            onBack={closeProductDetails}
            onUpdateGodownInventory={updateGodownInventory}
            onUpdateVehicleInventory={updateVehicleInventory}
          />
        </Animated.View>
      ) : null}

      {isAddProductVisible ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: addTranslateX }],
            },
          ]}
        >
          <AddProductScreen
            onBack={closeAddProduct}
            onSubmit={handleAddProduct}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    minHeight: '100%',
  },
  listScreen: {
    flex: 1,
  },
  overlayScreen: {
    ...StyleSheet.absoluteFill,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 23,
  },
  addButton: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  listCard: {
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
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  listCardStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconBadgeSmall: {
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
  inventoryStrip: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inventoryStripLabel: {
    fontSize: 12,
  },
  inventoryStripValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});
