import React, { createContext, useContext, useMemo, useState } from 'react';
import { initialProducts, initialVehicles } from '../data/operations';
import type { ProductRecord } from '../screens/product/ProductDetailsScreen';
import type { VehicleRecord } from '../screens/vehicle/VehicleDetailsScreen';

interface OperationsState {
  vehicles: VehicleRecord[];
  products: ProductRecord[];
}

interface OperationsContextValue extends OperationsState {
  addVehicle: (vehicle: VehicleRecord) => void;
  toggleVehicleAvailability: (vehicleId: string) => void;
  addProduct: (product: ProductRecord) => void;
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
    vehicles: initialVehicles,
    products: initialProducts,
  });

  const addVehicle = (vehicle: VehicleRecord) => {
    setState(current => ({
      ...current,
      vehicles: [vehicle, ...current.vehicles],
    }));
  };

  const toggleVehicleAvailability = (vehicleId: string) => {
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

  const value = useMemo(
    () => ({
      vehicles: state.vehicles,
      products: state.products,
      addVehicle,
      toggleVehicleAvailability,
      addProduct,
      updateProductGodownInventory,
      updateProductVehicleInventory,
    }),
    [state.products, state.vehicles],
  );

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
