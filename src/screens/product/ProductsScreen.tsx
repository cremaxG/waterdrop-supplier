import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  AppButton,
  AppIcon,
  AppRefreshScrollView,
  AppSheet,
  AppSnackbar,
  AppText,
} from '../../components';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';
import { useOperations } from '../../providers/OperationsProvider';
import SupplierApi from '../../service/supplierApi';
import ProductApi from '../../service/productApi';
import { AddProductScreen, NewProductDraft } from './AddProductScreen';
import {
  ProductDetailsScreen,
  ProductRecord,
} from './ProductDetailsScreen';

interface ProductsScreenProps {
  externalAddRequestToken?: number | null;
  onDetailVisibilityChange?: (isVisible: boolean) => void;
}

function unwrapApiData<T>(response: T | { data?: T } | null | undefined): T | null {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: T }).data ?? null;
  }
  return (response as T) ?? null;
}

function unwrapSupplierProfile(response: any) {
  const unwrapped = unwrapApiData<any>(response);
  return unwrapped?.supplier ?? unwrapped?.profile ?? unwrapped;
}

function unwrapCreatedProduct(response: any) {
  const unwrapped = unwrapApiData<any>(response);
  return unwrapped?.product ?? unwrapped;
}

function extractApiErrorMessage(response: any) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  return (
    response.message ??
    response.error ??
    response.errors?.[0]?.message ??
    response.data?.message ??
    null
  );
}

function hasApiFailure(response: any) {
  return Boolean(
    !response ||
      response.success === false ||
      response.error ||
      (typeof response.status === 'number' && response.status >= 400) ||
      (typeof response.statusCode === 'number' && response.statusCode >= 400),
  );
}

function getProductVehicleUnits(product: ProductRecord) {
  const explicitVehicleUnits = product.vehicleInventory.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  if (explicitVehicleUnits > 0) {
    return explicitVehicleUnits;
  }

  return Math.max(product.totalStock - product.godownInventory, 0);
}

export function ProductsScreen({
  externalAddRequestToken = null,
  onDetailVisibilityChange,
}: ProductsScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const {
    products,
    addProduct,
    refreshProducts,
    refreshVehicles,
    updateProductGodownInventory,
    updateProductVehicleInventory,
  } = useOperations();
  const { width } = useWindowDimensions();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isProductFormVisible, setProductFormVisible] = useState(false);
  const [isSubmittingProduct, setSubmittingProduct] = useState(false);
  const [productSubmissionError, setProductSubmissionError] = useState<string | null>(
    null,
  );
  const [isProductActionsVisible, setProductActionsVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarTone, setSnackbarTone] = useState<'success' | 'error' | 'info'>(
    'info',
  );
  const detailTranslateX = useRef(new Animated.Value(width)).current;
  const formTranslateX = useRef(new Animated.Value(width)).current;
  const lastHandledExternalAddTokenRef = useRef<number | null>(null);

  const selectedProduct = useMemo(
    () => products.find(product => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const editingProduct = useMemo(
    () => products.find(product => product.id === editingProductId) ?? null,
    [editingProductId, products],
  );

  const productSummary = useMemo(() => {
    const lowStockCount = products.filter(
      product => product.totalStock <= product.reorderLevel,
    ).length;
    const godownUnits = products.reduce(
      (total, product) => total + product.godownInventory,
      0,
    );
    const vehicleUnits = products.reduce(
      (total, product) => total + getProductVehicleUnits(product),
      0,
    );

    return {
      totalProducts: products.length,
      lowStockCount,
      godownUnits,
      vehicleUnits,
    };
  }, [products]);

  useEffect(() => {
    if (!selectedProductId) {
      detailTranslateX.setValue(width);
    }

    if (!isProductFormVisible) {
      formTranslateX.setValue(width);
    }
  }, [detailTranslateX, formTranslateX, isProductFormVisible, selectedProductId, width]);

  useEffect(() => {
    if (
      !externalAddRequestToken ||
      lastHandledExternalAddTokenRef.current === externalAddRequestToken
    ) {
      return;
    }

    lastHandledExternalAddTokenRef.current = externalAddRequestToken;
    formTranslateX.setValue(width);
    setSelectedProductId(null);
    setEditingProductId(null);
    setProductSubmissionError(null);
    setProductActionsVisible(false);
    setDeleteConfirmVisible(false);
    setProductFormVisible(true);
    onDetailVisibilityChange?.(true);

    requestAnimationFrame(() => {
      Animated.timing(formTranslateX, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [externalAddRequestToken, formTranslateX, onDetailVisibilityChange, width]);

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

  const openProductForm = (productId: string | null) => {
    formTranslateX.setValue(width);
    setEditingProductId(productId);
    setProductSubmissionError(null);
    setProductActionsVisible(false);
    setDeleteConfirmVisible(false);
    setProductFormVisible(true);
    onDetailVisibilityChange?.(true);

    requestAnimationFrame(() => {
      Animated.timing(formTranslateX, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeProductForm = (onClosed?: () => void) => {
    Animated.timing(formTranslateX, {
      toValue: width,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setProductFormVisible(false);
      setProductSubmissionError(null);
      setProductActionsVisible(false);
      setDeleteConfirmVisible(false);
      setEditingProductId(null);
      onDetailVisibilityChange?.(false);
      if (onClosed) {
        onClosed();
      }
    });
  };

  const handleCreateProduct = async (draft: NewProductDraft) => {
    setProductSubmissionError(null);
    setSubmittingProduct(true);

    try {
      const supplierResponse = await SupplierApi.getSupplierProfile();
      const supplier = unwrapSupplierProfile(supplierResponse) as { id?: number } | null;

      if (!supplier?.id) {
        throw new Error('Unable to load supplier profile.');
      }

      const payload = {
        supplier_id: supplier.id,
        name: draft.name.trim(),
        price: draft.price.trim(),
        uom: draft.unitLabel.trim(),
        stock_qty: Number(draft.godownInventory) || 0,
        category: draft.category.trim(),
        type: draft.type.trim(),
        description: draft.description.trim(),
      };

      const createProductResponse = await ProductApi.createProduct(payload);
      const response = unwrapCreatedProduct(createProductResponse);

      if (!response || (!response.id && !response.name)) {
        throw new Error(
          extractApiErrorMessage(createProductResponse) ??
            'Unable to create product. Please try again.',
        );
      }

      const productId = String(response.id ?? `product-${Date.now()}`);
      const nextProduct: ProductRecord = {
        id: productId,
        name: response.name ?? draft.name.trim(),
        sku: draft.sku.trim(),
        category: response.category ?? draft.category.trim(),
        type: response.type ?? draft.type.trim(),
        price: String(response.price ?? draft.price.trim()),
        unitLabel: response.uom ?? draft.unitLabel.trim(),
        totalStock: Number(response.stock_qty ?? draft.godownInventory) || 0,
        godownInventory: Number(response.stock_qty ?? draft.godownInventory) || 0,
        demand: draft.demand.trim(),
        trendKey: 'productTrendSteady',
        reorderLevel: Number(draft.reorderLevel) || 0,
        description: response.description ?? draft.description.trim(),
        vehicleInventory: [],
      };

      try {
        await refreshProducts();
      } catch (refreshError) {
        console.warn('Unable to refresh products after creation', refreshError);
        addProduct(nextProduct);
      }

      closeProductForm(() => {
        setSnackbarMessage(response.message ?? 'Product created successfully.');
        setSnackbarTone('success');
        setSnackbarVisible(true);
      });
    } catch (error: any) {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        'Unable to create product. Please try again.';
      setProductSubmissionError(nextMessage);
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleUpdateProduct = async (draft: NewProductDraft) => {
    if (!editingProductId) {
      return;
    }

    setProductSubmissionError(null);
    setSubmittingProduct(true);

    try {
      const numericProductId = Number(editingProductId);
      const requestProductId = Number.isFinite(numericProductId)
        ? numericProductId
        : editingProductId;
      const payload = {
        name: draft.name.trim(),
        price: draft.price.trim(),
        uom: draft.unitLabel.trim(),
        stock_qty: Number(draft.godownInventory) || 0,
        category: draft.category.trim(),
        type: draft.type.trim(),
        description: draft.description.trim(),
      };

      const response = await ProductApi.updateProduct(requestProductId, payload);
      if (hasApiFailure(response)) {
        throw new Error(
          extractApiErrorMessage(response) ?? 'Unable to update product.',
        );
      }

      await refreshProducts();

      closeProductForm(() => {
        setSnackbarMessage('Product updated successfully.');
        setSnackbarTone('success');
        setSnackbarVisible(true);
      });
    } catch (error: any) {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        'Unable to update product.';
      setProductSubmissionError(nextMessage);
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleSubmitProduct = async (draft: NewProductDraft) => {
    if (editingProductId) {
      await handleUpdateProduct(draft);
      return;
    }

    await handleCreateProduct(draft);
  };

  const handleDeleteProduct = async () => {
    if (!editingProductId) {
      return;
    }

    setSubmittingProduct(true);
    try {
      const numericProductId = Number(editingProductId);
      const requestProductId = Number.isFinite(numericProductId)
        ? numericProductId
        : editingProductId;
      const response = await ProductApi.deleteProduct(requestProductId);
      if (hasApiFailure(response)) {
        throw new Error(
          extractApiErrorMessage(response) ?? 'Unable to delete product.',
        );
      }
      await refreshProducts();
      closeProductForm(() => {
        setSnackbarMessage('Product deleted successfully.');
        setSnackbarTone('success');
        setSnackbarVisible(true);
      });
    } catch (error: any) {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        'Unable to delete product.';
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    } finally {
      setSubmittingProduct(false);
      setDeleteConfirmVisible(false);
    }
  };

  const updateGodownInventory = (nextQuantity: number) => {
    if (!selectedProductId) {
      return;
    }
    updateProductGodownInventory(selectedProductId, nextQuantity);
  };

  const updateVehicleInventory = async (vehicleId: string, nextQuantity: number) => {
    if (!selectedProductId) {
      return;
    }

    const numericVehicleId = Number(vehicleId);
    const numericProductId = Number(selectedProductId);

    if (!Number.isFinite(numericVehicleId) || !Number.isFinite(numericProductId)) {
      updateProductVehicleInventory(selectedProductId, vehicleId, nextQuantity);
      return;
    }

    try {
      await SupplierApi.upsertVehicleProduct(numericVehicleId, {
        product_id: numericProductId,
        qty: nextQuantity,
      });
      await Promise.all([refreshProducts(), refreshVehicles()]);
    } catch (error: any) {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        'Unable to update vehicle inventory. Please try again.';
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    }
  };

  const editingInitialDraft = useMemo(
    () =>
      editingProduct
        ? {
            name: editingProduct.name,
            sku: editingProduct.sku,
            category: editingProduct.category,
            type: editingProduct.type ?? '',
            unitLabel: editingProduct.unitLabel,
            price: editingProduct.price ? String(editingProduct.price) : '',
            godownInventory: String(editingProduct.godownInventory),
            demand: editingProduct.demand,
            reorderLevel: String(editingProduct.reorderLevel),
            description: editingProduct.description,
          }
        : null,
    [editingProduct],
  );

  return (
    <View style={styles.screenRoot}>
      <AppRefreshScrollView
        refreshEnabled={!selectedProductId && !isProductFormVisible}
        onRefresh={refreshProducts}
      >
        <View style={styles.listScreen}>
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

            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <View
                  style={[
                    styles.heroBadge,
                    {
                      backgroundColor: palette.accentSoft,
                      borderColor: palette.accentSoftBorder,
                    },
                  ]}
                >
                  <AppIcon name="products" size={18} color={palette.accentStrong} />
                  <AppText style={[styles.heroBadgeText, { color: palette.accentStrong }]}>
                    {t('productsTab')}
                  </AppText>
                </View>
                <AppText style={[styles.sectionTitle, { color: palette.text }]}>
                  {t('productsHeading')}
                </AppText>
                <AppText style={[styles.sectionSubtitle, { color: palette.muted }]}>
                  {t('productsSubtitle')}
                </AppText>
              </View>
              <AppButton
                title={t('productAddButton')}
                onPress={() => openProductForm(null)}
                variant="primary"
                style={styles.addButton}
                textStyle={styles.addButtonText}
              />
            </View>

            <View style={styles.summaryRow}>
              {[
                {
                  label: t('productsTab'),
                  value: String(productSummary.totalProducts),
                },
                {
                  label: t('dashboardLowStockTitle'),
                  value: String(productSummary.lowStockCount),
                },
                {
                  label: t('dashboardGodownLabel'),
                  value: String(productSummary.godownUnits),
                },
              ].map(item => (
                <View
                  key={item.label}
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: palette.surfaceSoft,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <AppText style={[styles.summaryValue, { color: palette.text }]}>
                    {item.value}
                  </AppText>
                  <AppText style={[styles.summaryLabel, { color: palette.muted }]}>
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.loadCard,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <AppText style={[styles.loadCardLabel, { color: palette.muted }]}>
                {t('dashboardVehicleLoadLabel')}
              </AppText>
              <AppText style={[styles.loadCardValue, { color: palette.text }]}>
                {productSummary.vehicleUnits}
              </AppText>
            </View>
          </View>

          {products.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <AppText style={[styles.emptyStateTitle, { color: palette.text }]}>
                {t('productsHeading')}
              </AppText>
              <AppText style={[styles.emptyStateBody, { color: palette.muted }]}>
                {t('productsSubtitle')}
              </AppText>
              <AppButton
                title={t('productAddButton')}
                onPress={() => openProductForm(null)}
                variant="primary"
                style={styles.emptyStateButton}
                textStyle={styles.addButtonText}
              />
            </View>
          ) : (
            products.map(product => (
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
            ))
          )}
        </View>
      </AppRefreshScrollView>

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
            onEdit={() => openProductForm(selectedProduct.id)}
            onOpenActionMenu={() => {
              setEditingProductId(selectedProduct.id);
              setProductActionsVisible(true);
            }}
            onUpdateGodownInventory={updateGodownInventory}
            onUpdateVehicleInventory={updateVehicleInventory}
          />
        </Animated.View>
      ) : null}

      {isProductFormVisible ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: formTranslateX }],
            },
          ]}
        >
          <AddProductScreen
            mode={editingProduct ? 'edit' : 'create'}
            onBack={() => closeProductForm()}
            onSubmit={handleSubmitProduct}
            isSubmitting={isSubmittingProduct}
            submitErrorMessage={productSubmissionError}
            initialDraft={editingInitialDraft}
            onOpenActionMenu={editingProduct ? () => setProductActionsVisible(true) : null}
          />
        </Animated.View>
      ) : null}

      <AppSheet
        visible={isProductActionsVisible}
        title="Product actions"
        subtitle="Manage this product directly from the detail or edit flow."
        onClose={() => setProductActionsVisible(false)}
      >
        <AppButton
          title="Edit product"
          onPress={() => {
            if (!editingProductId) {
              return;
            }
            setProductActionsVisible(false);
            openProductForm(editingProductId);
          }}
          style={styles.sheetActionButton}
          textStyle={styles.sheetActionText}
        />
        <AppButton
          title="Delete product"
          variant="danger"
          onPress={() => {
            setProductActionsVisible(false);
            setDeleteConfirmVisible(true);
          }}
          disabled={!editingProductId || isSubmittingProduct}
          style={styles.sheetDeleteButton}
          textStyle={styles.sheetDeleteText}
        />
      </AppSheet>

      <AppSheet
        visible={isDeleteConfirmVisible}
        title="Delete product?"
        subtitle="This action removes the product from the supplier catalog. Please confirm before continuing."
        onClose={() => setDeleteConfirmVisible(false)}
      >
        <AppButton
          title="Keep product"
          onPress={() => setDeleteConfirmVisible(false)}
          style={styles.sheetActionButton}
          textStyle={styles.sheetActionText}
        />
        <AppButton
          title="Delete permanently"
          variant="danger"
          onPress={handleDeleteProduct}
          loading={isSubmittingProduct}
          disabled={!editingProductId}
          style={styles.sheetDeleteButton}
          textStyle={styles.sheetDeleteText}
        />
      </AppSheet>

      <AppSnackbar
        visible={isSnackbarVisible}
        message={snackbarMessage}
        tone={snackbarTone}
        onHide={() => {
          setSnackbarVisible(false);
          setSnackbarMessage('');
        }}
      />
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
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
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
    top: -70,
    right: -30,
  },
  heroBubbleBottom: {
    width: 150,
    height: 150,
    bottom: -50,
    left: -20,
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
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '800',
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
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 17,
  },
  loadCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadCardLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadCardValue: {
    fontSize: 20,
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
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyStateBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  emptyStateButton: {
    alignSelf: 'flex-start',
  },
  sheetActionButton: {
    borderRadius: 18,
  },
  sheetActionText: {
    fontWeight: '800',
  },
  sheetDeleteButton: {
    borderRadius: 18,
  },
  sheetDeleteText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
