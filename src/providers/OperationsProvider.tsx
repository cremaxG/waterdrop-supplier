import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncAppShortcutsSummary } from '../native/appShortcuts';
import ProductApi from '../service/productApi';
import SupplierApi from '../service/supplierApi';
import { syncHomeWidgetSummary } from '../native/homeWidget';
import type { ProductRecord } from '../screens/product/ProductDetailsScreen';
import type { VehicleRecord } from '../screens/vehicle/VehicleDetailsScreen';
import { getStoredVehicleMetadata } from '../storage/vehicleMetadata';

function extractCollection(response: any, key?: string) {
  const candidates = [
    response,
    response?.data,
    key ? response?.[key] : null,
    key ? response?.data?.[key] : null,
    response?.items,
    response?.data?.items,
    response?.results,
    response?.data?.results,
    response?.rows,
    response?.data?.rows,
    key ? response?.[key]?.items : null,
    key ? response?.data?.[key]?.items : null,
    key ? response?.[key]?.rows : null,
    key ? response?.data?.[key]?.rows : null,
    key ? response?.[key]?.data : null,
    key ? response?.data?.[key]?.data : null,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
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

function toNumber(value: any) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeVehicleInventoryEntry(entry: any) {
  return {
    id: String(
      entry.id ??
        entry.vehicle_id ??
        entry.vehicleId ??
        entry.vehicle?.id ??
        entry.name ??
        '',
    ),
    vehicleName:
      entry.vehicle_name ??
      entry.vehicleName ??
      entry.vehicle?.name ??
      entry.name ??
      'Unknown vehicle',
    quantity:
      toNumber(
        entry.quantity ??
          entry.qty ??
          entry.stock_qty ??
          entry.stockQty ??
          entry.loaded_qty ??
          entry.loadedQty ??
          entry.units,
      ) || 0,
  };
}

function extractSupplierId(response: any) {
  const profile =
    response?.data?.supplier ??
    response?.data?.profile ??
    response?.supplier ??
    response?.profile ??
    response;

  const supplierId = Number(profile?.id);
  return Number.isFinite(supplierId) ? supplierId : null;
}

function extractQuantityFromVehicleProduct(value: string) {
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) || 0 : 0;
}

function deriveVehicleInventoryFromVehicles(
  productName: string,
  vehicles: VehicleRecord[],
) {
  const normalizedProductName = productName.trim().toLowerCase();

  return vehicles
    .map(vehicle => {
      const matchingProduct = vehicle.products.find(
        item => item.name.trim().toLowerCase() === normalizedProductName,
      );

      if (!matchingProduct) {
        return null;
      }

      return {
        id: vehicle.id,
        vehicleName: vehicle.name,
        quantity: extractQuantityFromVehicleProduct(matchingProduct.quantity),
      };
    })
    .filter((entry): entry is { id: string; vehicleName: string; quantity: number } =>
      Boolean(entry && entry.quantity > 0),
    );
}

function normalizeVehicle(item: any): VehicleRecord {
  const products = Array.isArray(item.products) ? item.products : [];
  const history = Array.isArray(item.history) ? item.history : [];
  const vehicleId = String(item.id ?? item.vehicle_number ?? 'unknown-vehicle');
  const metadata = getStoredVehicleMetadata(vehicleId) ?? {};
  const apiStatus = item.reviewStatus ?? item.status ?? 'pending_review';
  const reviewStatus = apiStatus === 'approved' ? 'approved' : 'pending';

  return {
    id: vehicleId,
    name: item.name ?? item.vehicle_number ?? 'Unnamed vehicle',
    route: item.route ?? item.vehicle_number ?? 'Unknown route',
    capacity: item.capacity ?? item.load_capacity ?? metadata.capacity ?? 'N/A',
    currentLocation:
      item.currentLocation ||
      [item.lat, item.lng].filter(Boolean).join(', ') ||
      'Unknown location',
    driverName:
      item.driverName ??
      item.driver_name ??
      metadata.driverName ??
      'Assigned driver',
    driverPhone: item.driverPhone ?? item.phone ?? '',
    driverEmail: item.driverEmail ?? item.email ?? metadata.driverEmail ?? '',
    driverLicenseNumber:
      item.driverLicenseNumber ??
      item.driver_license_number ??
      item.driver_licence_no ??
      metadata.driverLicenseNumber ??
      '',
    driverRating: item.driverRating ?? 'N/A',
    shiftWindow: item.shiftWindow ?? '',
    earningsToday: item.earningsToday ?? '₹0',
    deliveredStops: item.deliveredStops ?? '0',
    pendingStops: item.pendingStops ?? '0',
    cashCollected: item.cashCollected ?? '₹0',
    fuelLevel: item.fuelLevel ?? 'N/A',
    lastUpdated: item.lastUpdated ?? 'Just now',
    nextService: item.nextService ?? '',
    etaToHub: item.etaToHub ?? '',
    isOnline: Boolean(item.online ?? item.isOnline),
    reviewStatus,
    products,
    history,
  };
}

function parseDemand(value: any) {
  const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(numeric)) {
    return 'N/A';
  }
  return `${Math.round(numeric)}%`;
}

function getTrendKey(value: any) {
  const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) {
    return 'productTrendSteady';
  }
  if (numeric >= 80) {
    return 'productTrendFast';
  }
  if (numeric >= 50) {
    return 'productTrendSteady';
  }
  return 'productTrendLow';
}

function normalizeProduct(item: any, vehicles: VehicleRecord[] = []): ProductRecord {
  const stockQty =
    toNumber(
      item.stock_qty ??
        item.stockQty ??
        item.godown_stock ??
        item.godownStock ??
        item.godownInventory ??
        item.warehouse_stock ??
        item.warehouseStock,
    ) || 0;
  const reorderLevel =
    toNumber(
      item.reorder_level ??
        item.reorderLevel ??
        item.min_stock ??
        item.minStock,
    ) || 0;
  const vehicleInventorySource =
    item.vehicle_inventory ??
    item.vehicleInventory ??
    item.vehicle_stocks ??
    item.vehicleStocks ??
    item.assigned_vehicles ??
    item.assignedVehicles ??
    item.inventory_by_vehicle ??
    item.inventoryByVehicle;
  const explicitVehicleInventory = Array.isArray(vehicleInventorySource)
    ? vehicleInventorySource.map(normalizeVehicleInventoryEntry)
    : [];
  const vehicleInventory =
    explicitVehicleInventory.length > 0
      ? explicitVehicleInventory
      : deriveVehicleInventoryFromVehicles(item.name ?? item.title ?? '', vehicles);
  const explicitVehicleUnits = vehicleInventory.reduce(
    (sum: number, entry: { quantity: number }) => sum + entry.quantity,
    0,
  );
  const totalStockCandidate = toNumber(
    item.totalStock ??
      item.total_stock ??
      item.stock ??
      item.total_qty ??
      item.totalQty ??
      item.quantity,
  );
  const derivedVehicleUnits =
    explicitVehicleUnits > 0
      ? explicitVehicleUnits
      : Math.max(totalStockCandidate - stockQty, 0);
  const totalStock =
    totalStockCandidate > 0 ? totalStockCandidate : stockQty + derivedVehicleUnits;

  return {
    id: String(item.id ?? item.sku ?? `product-${Date.now()}`),
    name: item.name ?? item.title ?? 'Untitled product',
    sku: item.sku ?? item.code ?? '',
    category: item.category ?? '',
    unitLabel: item.uom ?? item.unitLabel ?? '',
    totalStock,
    godownInventory: stockQty,
    demand: parseDemand(item.demand ?? item.demand_value ?? item.demandValue),
    trendKey: getTrendKey(item.demand ?? item.demand_value ?? item.demandValue),
    reorderLevel,
    description: item.description ?? '',
    vehicleInventory,
  };
}

interface OperationsState {
  vehicles: VehicleRecord[];
  products: ProductRecord[];
}

interface OperationsContextValue extends OperationsState {
  addVehicle: (vehicle: VehicleRecord) => void;
  refreshVehicles: () => Promise<void>;
  toggleVehicleAvailability: (vehicleId: string) => Promise<void>;
  addProduct: (product: ProductRecord) => void;
  refreshProducts: () => Promise<void>;
  updateProductGodownInventory: (productId: string, nextQuantity: number) => void;
  updateProductVehicleInventory: (
    productId: string,
    vehicleId: string,
    nextQuantity: number,
  ) => void;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

export function OperationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<OperationsState>({
    vehicles: [],
    products: [],
  });

  const loadProducts = async () => {
    const profileResponse = await SupplierApi.getSupplierProfile();
    const supplierId = extractSupplierId(profileResponse);
    const productResponse = await ProductApi.listProducts(
      supplierId ? { supplierId } : undefined,
    );
    return extractCollection(productResponse, 'products');
  };

  useEffect(() => {
    const loadOperations = async () => {
      try {
        const [vehicleResponse, productsData] = await Promise.all([
          SupplierApi.listSupplierVehicles('me', { filter: 'all' }),
          loadProducts(),
        ]);

        const vehiclesData = extractCollection(vehicleResponse, 'vehicles');
        const normalizedVehicles = vehiclesData.map(normalizeVehicle);

        setState({
          vehicles: normalizedVehicles,
          products: productsData.map((item: any) =>
            normalizeProduct(item, normalizedVehicles),
          ),
        });
      } catch (error) {
        console.warn('Unable to load operations data', error);
        setState({
          vehicles: [],
          products: [],
        });
      }
    };

    loadOperations();
  }, []);

  useEffect(() => {
    const summary = {
      vehicles: state.vehicles.length,
      products: state.products.length,
      pendingReviews: state.vehicles.filter(
        vehicle => vehicle.reviewStatus === 'pending',
      ).length,
    };

    syncAppShortcutsSummary(summary);
    syncHomeWidgetSummary({
      vehicles: summary.vehicles,
      products: summary.products,
      pendingReviews: summary.pendingReviews,
    });
  }, [state.products.length, state.vehicles]);

  const refreshVehicles = async () => {
    const vehicleResponse = await SupplierApi.listSupplierVehicles('me', {
      filter: 'all',
    });
    const vehiclesData = extractCollection(vehicleResponse, 'vehicles');
    const normalizedVehicles = vehiclesData.map(normalizeVehicle);

    setState(current => ({
      ...current,
      vehicles: normalizedVehicles,
      products: current.products.map(product => {
        const derivedVehicleInventory = deriveVehicleInventoryFromVehicles(
          product.name,
          normalizedVehicles,
        );
        const derivedVehicleUnits = derivedVehicleInventory.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        if (derivedVehicleUnits <= 0) {
          return product;
        }

        return {
          ...product,
          vehicleInventory: derivedVehicleInventory,
          totalStock: Math.max(product.totalStock, product.godownInventory + derivedVehicleUnits),
        };
      }),
    }));
  };

  const addVehicle = (vehicle: VehicleRecord) => {
    setState(current => ({
      ...current,
      vehicles: [vehicle, ...current.vehicles],
    }));
  };

  const toggleVehicleAvailability = async (vehicleId: string) => {
    const targetVehicle = state.vehicles.find(vehicle => vehicle.id === vehicleId);
    if (!targetVehicle || targetVehicle.reviewStatus === 'pending') {
      return;
    }

    const availabilityResponse = await SupplierApi.setVehicleAvailability(
      vehicleId,
      !targetVehicle.isOnline,
    );
    if (hasApiFailure(availabilityResponse)) {
      throw new Error(
        availabilityResponse?.message ??
          availabilityResponse?.error ??
          'Unable to update vehicle availability.',
      );
    }

    setState(current => ({
      ...current,
      vehicles: current.vehicles.map(vehicle => {
        if (vehicle.id !== vehicleId || vehicle.reviewStatus === 'pending') {
          return vehicle;
        }

        return {
          ...vehicle,
          isOnline: !vehicle.isOnline,
        };
      }),
    }));
  };

  const addProduct = (product: ProductRecord) => {
    setState(current => ({
      ...current,
      products: [product, ...current.products],
    }));
  };

  const refreshProducts = async () => {
    const productsData = await loadProducts();

    setState(current => ({
      ...current,
      products: productsData.map((item: any) =>
        normalizeProduct(item, current.vehicles),
      ),
    }));
  };

  const updateProductGodownInventory = (productId: string, nextQuantity: number) => {
    setState(current => ({
      ...current,
      products: current.products.map(product => {
        if (product.id !== productId) {
          return product;
        }

        const vehicleTotal = product.vehicleInventory.reduce(
          (total, item) => total + item.quantity,
          0,
        );

        return {
          ...product,
          godownInventory: nextQuantity,
          totalStock: nextQuantity + vehicleTotal,
        };
      }),
    }));
  };

  const updateProductVehicleInventory = (
    productId: string,
    vehicleId: string,
    nextQuantity: number,
  ) => {
    setState(current => {
      const products = current.products.map(product => {
        if (product.id !== productId) {
          return product;
        }

        const vehicleInventory = product.vehicleInventory.some(
          item => item.id === vehicleId,
        )
          ? product.vehicleInventory.map(item =>
              item.id === vehicleId ? { ...item, quantity: nextQuantity } : item,
            )
          : [
              ...product.vehicleInventory,
              {
                id: vehicleId,
                vehicleName:
                  current.vehicles.find(vehicle => vehicle.id === vehicleId)?.name ??
                  vehicleId,
                quantity: nextQuantity,
              },
            ];

        const normalizedVehicleInventory = vehicleInventory.filter(
          item => item.quantity > 0,
        );
        const vehicleTotal = normalizedVehicleInventory.reduce(
          (total, item) => total + item.quantity,
          0,
        );

        return {
          ...product,
          vehicleInventory: normalizedVehicleInventory,
          totalStock: product.godownInventory + vehicleTotal,
        };
      });

      const targetProduct = products.find(product => product.id === productId);
      if (!targetProduct) {
        return current;
      }

      const vehicles = current.vehicles.map(vehicle => {
        if (vehicle.id !== vehicleId) {
          return vehicle;
        }

        const hasProduct = vehicle.products.some(
          item => item.name === targetProduct.name,
        );
        const nextProducts =
          nextQuantity <= 0
            ? vehicle.products.filter(item => item.name !== targetProduct.name)
            : hasProduct
              ? vehicle.products.map(item =>
                  item.name === targetProduct.name
                    ? {
                        ...item,
                        quantity: `${nextQuantity} ${targetProduct.unitLabel} loaded`,
                      }
                    : item,
                )
              : [
                  ...vehicle.products,
                  {
                    name: targetProduct.name,
                    quantity: `${nextQuantity} ${targetProduct.unitLabel} loaded`,
                    trend: 'Inventory synced',
                  },
                ];

        return {
          ...vehicle,
          products: nextProducts,
        };
      });

      return {
        vehicles,
        products,
      };
    });
  };

  const value = {
    vehicles: state.vehicles,
    products: state.products,
    addVehicle,
    refreshVehicles,
    toggleVehicleAvailability,
    addProduct,
    refreshProducts,
    updateProductGodownInventory,
    updateProductVehicleInventory,
  };

  return (
    <OperationsContext.Provider value={value}>
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within OperationsProvider');
  }
  return context;
}
