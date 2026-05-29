import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
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
import { VehicleListCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useOperations } from '../../providers/OperationsProvider';
import { useTranslation } from '../../providers/AppProviders';
import SupplierApi from '../../service/supplierApi';
import type { SupplierProfile } from '../../service/supplierApi';
import {
  removeStoredVehicleMetadata,
  setStoredVehicleMetadata,
} from '../../storage/vehicleMetadata';
import { AddVehicleScreen, NewVehicleDraft } from './AddVehicleScreen';
import { VehicleHistoryScreen } from './VehicleHistoryScreen';
import { VehicleHistoryOrderScreen } from './VehicleHistoryOrderScreen';
import {
  VehicleCurrentOrder,
  VehicleDetailsScreen,
  VehicleRecord,
} from './VehicleDetailsScreen';

type VehicleFilterKey = 'all' | 'online' | 'offline' | 'pending';
type VehicleFilterTone = 'neutral' | 'success' | 'danger' | 'pending';

interface VehicleOrderSummary {
  todayOrdersCount: number;
  currentOrder: VehicleCurrentOrder | null;
}

function unwrapApiData<T>(response: T | { data?: T } | null | undefined): T | null {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: T }).data ?? null;
  }
  return (response as T) ?? null;
}

function unwrapSupplierProfile(response: any): SupplierProfile | null {
  const unwrapped = unwrapApiData<any>(response);
  return (unwrapped?.supplier ?? unwrapped?.profile ?? unwrapped) as SupplierProfile | null;
}

function unwrapCreatedVehicle(response: any) {
  const unwrapped = unwrapApiData<any>(response);
  return unwrapped?.vehicle ?? unwrapped;
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
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function getDateCandidate(order: any) {
  return (
    order?.scheduled_at ??
    order?.scheduledAt ??
    order?.delivery_date ??
    order?.deliveryDate ??
    order?.order_date ??
    order?.orderDate ??
    order?.created_at ??
    order?.createdAt ??
    order?.updated_at ??
    order?.updatedAt ??
    null
  );
}

function isSameDay(value: unknown, referenceDate = new Date()) {
  if (!value) {
    return false;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

function normalizeStatus(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

function formatStatusLabel(value: unknown) {
  const normalized = normalizeStatus(value);
  if (!normalized) {
    return 'Awaiting assignment';
  }

  return normalized.replace(/\b\w/g, char => char.toUpperCase());
}

function formatCurrencyLike(value: unknown) {
  if (value == null || value === '') {
    return '';
  }

  if (typeof value === 'string' && value.includes('₹')) {
    return value;
  }

  const numeric = Number(String(value).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '';
  }

  return `₹${numeric.toLocaleString('en-IN')}`;
}

function buildCurrentOrderTitle(order: any) {
  return (
    order?.customer_name ??
    order?.customerName ??
    order?.customer?.name ??
    order?.delivery_name ??
    order?.deliveryName ??
    order?.order_number ??
    order?.orderNumber ??
    order?.id?.toString?.() ??
    'Current order'
  );
}

function buildCurrentOrderSubtitle(order: any) {
  const address =
    order?.delivery_address ??
    order?.deliveryAddress ??
    order?.address ??
    order?.delivery_location ??
    order?.deliveryLocation ??
    order?.shipping_address ??
    order?.shippingAddress ??
    order?.customer_address ??
    order?.customerAddress;

  if (address) {
    return String(address);
  }

  const productNames = Array.isArray(order?.products)
    ? order.products
        .map((item: any) => item?.name ?? item?.product?.name ?? '')
        .filter(Boolean)
        .join(', ')
    : '';

  return productNames || 'Current order details are available from the vehicle orders API.';
}

function sortOrdersByRecency(orders: any[]) {
  return [...orders].sort((left, right) => {
    const leftDate = new Date(String(getDateCandidate(left) ?? 0)).getTime();
    const rightDate = new Date(String(getDateCandidate(right) ?? 0)).getTime();
    return rightDate - leftDate;
  });
}

function summarizeVehicleOrders(response: any): VehicleOrderSummary {
  const orders = extractCollection(response, 'orders');
  const sortedOrders = sortOrdersByRecency(orders);
  const activeOrder =
    sortedOrders.find(order =>
      ['out for delivery', 'confirmed', 'assigned', 'pending', 'processing'].includes(
        normalizeStatus(order?.status),
      ),
    ) ?? sortedOrders[0];
  const todayOrders = orders.filter(order => isSameDay(getDateCandidate(order)));

  return {
    todayOrdersCount: todayOrders.length,
    currentOrder: activeOrder
      ? {
          id: String(
            activeOrder?.id ??
              activeOrder?.order_number ??
              activeOrder?.orderNumber ??
              'current-order',
          ),
          title: buildCurrentOrderTitle(activeOrder),
          subtitle: buildCurrentOrderSubtitle(activeOrder),
          status: formatStatusLabel(activeOrder?.status),
          value: formatCurrencyLike(
            activeOrder?.amount ??
              activeOrder?.total_amount ??
              activeOrder?.totalAmount ??
              activeOrder?.order_value ??
              activeOrder?.orderValue,
          ),
        }
      : null,
  };
}

interface VehiclesScreenProps {
  externalAddRequestToken?: number | null;
  onDetailVisibilityChange?: (isVisible: boolean) => void;
}

export function VehiclesScreen({
  externalAddRequestToken = null,
  onDetailVisibilityChange,
}: VehiclesScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const { vehicles, addVehicle, refreshVehicles, toggleVehicleAvailability } =
    useOperations();
  const { width } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<VehicleFilterKey>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(
    null,
  );
  const [isHistoryScreenVisible, setHistoryScreenVisible] = useState(false);
  const [isVehicleFormVisible, setVehicleFormVisible] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const [isSubmittingVehicle, setSubmittingVehicle] = useState(false);
  const [vehicleSubmissionError, setVehicleSubmissionError] = useState<string | null>(
    null,
  );
  const [isVehicleActionsVisible, setVehicleActionsVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [vehicleOrderSummaries, setVehicleOrderSummaries] = useState<
    Record<string, VehicleOrderSummary>
  >({});
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarTone, setSnackbarTone] = useState<'success' | 'error' | 'info'>(
    'success',
  );
  const detailTranslateX = useRef(new Animated.Value(width)).current;
  const historyTranslateX = useRef(new Animated.Value(width)).current;
  const orderTranslateX = useRef(new Animated.Value(width)).current;
  const formTranslateX = useRef(new Animated.Value(width)).current;
  const lastHandledExternalAddTokenRef = useRef<number | null>(null);

  const selectedVehicle = useMemo(() => {
    const vehicle = vehicles.find(item => item.id === selectedVehicleId) ?? null;
    if (!vehicle) {
      return null;
    }

    const summary = vehicleOrderSummaries[vehicle.id];
    return {
      ...vehicle,
      todayOrdersCount: summary?.todayOrdersCount ?? vehicle.todayOrdersCount ?? 0,
      currentOrder: summary?.currentOrder ?? vehicle.currentOrder ?? null,
    };
  }, [selectedVehicleId, vehicleOrderSummaries, vehicles]);
  const editingVehicle = useMemo(
    () => vehicles.find(vehicle => vehicle.id === editingVehicleId) ?? null,
    [editingVehicleId, vehicles],
  );
  const selectedHistoryItem = useMemo(
    () =>
      selectedVehicle?.history.find(item => item.id === selectedHistoryItemId) ??
      null,
    [selectedHistoryItemId, selectedVehicle],
  );

  const filterOptions = useMemo(
    () => [
      { key: 'all' as const, label: t('vehiclesFilterAll'), tone: 'neutral' as const },
      {
        key: 'online' as const,
        label: t('vehiclesFilterOnline'),
        tone: 'success' as const,
      },
      {
        key: 'offline' as const,
        label: t('vehiclesFilterOffline'),
        tone: 'danger' as const,
      },
      {
        key: 'pending' as const,
        label: t('vehiclesFilterPending'),
        tone: 'pending' as const,
      },
    ],
    [t],
  );

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      if (selectedFilter === 'online') {
        return vehicle.reviewStatus === 'approved' && vehicle.isOnline;
      }

      if (selectedFilter === 'offline') {
        return vehicle.reviewStatus === 'approved' && !vehicle.isOnline;
      }

      if (selectedFilter === 'pending') {
        return vehicle.reviewStatus === 'pending';
      }

      return true;
    });
  }, [selectedFilter, vehicles]);

  const vehicleSummary = useMemo(() => {
    const approvedVehicles = vehicles.filter(
      vehicle => vehicle.reviewStatus === 'approved',
    );
    const todayOrders = Object.values(vehicleOrderSummaries).reduce(
      (total, summary) => total + (summary.todayOrdersCount || 0),
      0,
    );

    return {
      total: vehicles.length,
      online: approvedVehicles.filter(vehicle => vehicle.isOnline).length,
      pending: vehicles.filter(vehicle => vehicle.reviewStatus === 'pending').length,
      todayOrders,
    };
  }, [vehicleOrderSummaries, vehicles]);

  useEffect(() => {
    if (!selectedVehicleId) {
      detailTranslateX.setValue(width);
      historyTranslateX.setValue(width);
      orderTranslateX.setValue(width);
    }

    if (!isVehicleFormVisible) {
      formTranslateX.setValue(width);
    }
  }, [
    detailTranslateX,
    formTranslateX,
    historyTranslateX,
    isVehicleFormVisible,
    orderTranslateX,
    selectedVehicleId,
    width,
  ]);

  useEffect(() => {
    if ((!isVehicleFormVisible && !editingVehicleId) || supplierProfile?.id) {
      return;
    }

    const loadSupplierProfile = async () => {
      try {
        const profileResponse = await SupplierApi.getSupplierProfile();
        const profile = unwrapSupplierProfile(profileResponse);
        if (profile?.id) {
          setSupplierProfile(profile);
        }
      } catch (error) {
        console.warn('Unable to prefill supplier profile for vehicle form', error);
      }
    };

    loadSupplierProfile();
  }, [editingVehicleId, isVehicleFormVisible, supplierProfile?.id]);

  useEffect(() => {
    let isActive = true;

    if (!vehicles.length) {
      setVehicleOrderSummaries({});
      return;
    }

    const loadVehicleOrderSummaries = async () => {
      const entries = await Promise.all(
        vehicles.map(async vehicle => {
          try {
            const response = await SupplierApi.listVehicleOrders(vehicle.id, {
              status: 'all',
            });
            return [vehicle.id, summarizeVehicleOrders(response)] as const;
          } catch (error) {
            console.warn('Unable to load vehicle orders', vehicle.id, error);
            return [vehicle.id, { todayOrdersCount: 0, currentOrder: null }] as const;
          }
        }),
      );

      if (!isActive) {
        return;
      }

      setVehicleOrderSummaries(Object.fromEntries(entries));
    };

    loadVehicleOrderSummaries();

    return () => {
      isActive = false;
    };
  }, [vehicles]);

  useEffect(() => {
    if (
      !externalAddRequestToken ||
      lastHandledExternalAddTokenRef.current === externalAddRequestToken
    ) {
      return;
    }

    lastHandledExternalAddTokenRef.current = externalAddRequestToken;
    formTranslateX.setValue(width);
    setEditingVehicleId(null);
    setVehicleSubmissionError(null);
    setVehicleActionsVisible(false);
    setDeleteConfirmVisible(false);
    setVehicleFormVisible(true);
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

  const ensureSupplierProfile = async () => {
    if (supplierProfile?.id) {
      return supplierProfile;
    }

    const profileResponse = await SupplierApi.getSupplierProfile();
    const profile = unwrapSupplierProfile(profileResponse);

    if (profile?.id) {
      setSupplierProfile(profile);
    }

    return profile;
  };

  const openVehicleDetails = (vehicleId: string) => {
    detailTranslateX.setValue(width);
    setSelectedVehicleId(vehicleId);
    onDetailVisibilityChange?.(true);

    requestAnimationFrame(() => {
      Animated.timing(detailTranslateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeVehicleDetails = () => {
    Animated.timing(detailTranslateX, {
      toValue: width,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setSelectedHistoryItemId(null);
      setHistoryScreenVisible(false);
      setSelectedVehicleId(null);
      onDetailVisibilityChange?.(false);
    });
  };

  const openVehicleHistory = () => {
    historyTranslateX.setValue(width);
    setHistoryScreenVisible(true);

    requestAnimationFrame(() => {
      Animated.timing(historyTranslateX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeVehicleHistory = () => {
    Animated.timing(historyTranslateX, {
      toValue: width,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setSelectedHistoryItemId(null);
      setHistoryScreenVisible(false);
    });
  };

  const openHistoryItem = (historyItemId: string) => {
    orderTranslateX.setValue(width);
    setSelectedHistoryItemId(historyItemId);

    requestAnimationFrame(() => {
      Animated.timing(orderTranslateX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeHistoryItem = () => {
    Animated.timing(orderTranslateX, {
      toValue: width,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setSelectedHistoryItemId(null);
    });
  };

  const openVehicleForm = (vehicleId: string | null) => {
    formTranslateX.setValue(width);
    setEditingVehicleId(vehicleId);
    setVehicleSubmissionError(null);
    setVehicleActionsVisible(false);
    setDeleteConfirmVisible(false);
    setVehicleFormVisible(true);
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

  const closeVehicleForm = (onClosed?: () => void) => {
    Animated.timing(formTranslateX, {
      toValue: width,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setVehicleFormVisible(false);
      setVehicleSubmissionError(null);
      setVehicleActionsVisible(false);
      setDeleteConfirmVisible(false);
      setEditingVehicleId(null);
      onDetailVisibilityChange?.(false);
      if (typeof onClosed === 'function') {
        onClosed();
      }
    });
  };

  const handleCreateVehicle = async (draft: NewVehicleDraft) => {
    setVehicleSubmissionError(null);
    setSubmittingVehicle(true);

    try {
      const profile = await ensureSupplierProfile();

      if (!profile?.id) {
        throw new Error('Unable to load supplier profile.');
      }

      const payload = {
        phone: draft.phone.trim(),
        email: draft.email.trim() || undefined,
        supplier_id: profile.id,
        vehicle_number: draft.vehicleNumber.trim(),
        load_capacity: draft.capacity.trim(),
        driver_licence_no: draft.driverLicenseNumber.trim(),
        name: draft.name.trim(),
        // Vehicle-specific location capture is paused for now.
        lat: profile.lat ? String(profile.lat) : undefined,
        lng: profile.lng ? String(profile.lng) : undefined,
        status: 'pending_review' as const,
        online: false,
      };

      const createVehicleResponse = await SupplierApi.createVehicle(payload);
      const createVehicleResult = unwrapApiData<any>(createVehicleResponse);
      const response = unwrapCreatedVehicle(createVehicleResponse);

      if (!response || (!response.id && !response.vehicle_number && !response.name)) {
        throw new Error(
          extractApiErrorMessage(createVehicleResponse) ??
            'Unable to add vehicle. Please try again.',
        );
      }

      const nextVehicleId = String(response.id ?? `vehicle-${Date.now()}`);
      setStoredVehicleMetadata(nextVehicleId, {
        capacity: draft.capacity.trim(),
        driverEmail: draft.email.trim(),
        driverLicenseNumber: draft.driverLicenseNumber.trim(),
        driverName: draft.driverName.trim(),
      });

      const newVehicle: VehicleRecord = {
        id: nextVehicleId,
        name: response.name ?? draft.name.trim(),
        vehicleNumber: response.vehicle_number ?? draft.vehicleNumber.trim(),
        route: response.vehicle_number ?? draft.vehicleNumber.trim(),
        capacity: response.load_capacity ?? draft.capacity.trim(),
        currentLocation:
          [profile.lat, profile.lng].filter(Boolean).join(', ') || 'Supplier default location',
        driverName: draft.driverName.trim(),
        driverPhone: response.phone ?? draft.phone.trim(),
        driverEmail: response.email ?? draft.email.trim(),
        driverLicenseNumber:
          response.driver_licence_no ?? draft.driverLicenseNumber.trim(),
        driverRating: t('vehicleAddPendingValue'),
        shiftWindow: '',
        earningsToday: '₹0',
        deliveredStops: '0',
        pendingStops: '0',
        cashCollected: '₹0',
        fuelLevel: t('vehicleAddPendingValue'),
        lastUpdated: t('vehicleAddJustNowLabel'),
        nextService: t('vehicleAddReviewServiceValue'),
        etaToHub: t('vehicleAddReviewEtaValue'),
        isOnline: false,
        reviewStatus: 'pending',
        todayOrdersCount: 0,
        currentOrder: null,
        products: [],
        history: [],
      };

      try {
        await refreshVehicles();
      } catch (refreshError) {
        console.warn('Unable to refresh vehicles after creation', refreshError);
        addVehicle(newVehicle);
      }

      setSelectedFilter('pending');
      closeVehicleForm(() => {
        setSnackbarMessage(
          createVehicleResult?.message ?? t('vehicleAddSuccessSnackbar'),
        );
        setSnackbarTone('success');
        setSnackbarVisible(true);
      });
    } catch (error: any) {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        t('vehicleAddErrorSnackbar');
      setVehicleSubmissionError(nextMessage);
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleUpdateVehicle = async (draft: NewVehicleDraft) => {
    if (!editingVehicleId) {
      return;
    }

    setVehicleSubmissionError(null);
    setSubmittingVehicle(true);

    try {
      const profile = await ensureSupplierProfile();
      const payload = {
        phone: draft.phone.trim(),
        email: draft.email.trim() || undefined,
        supplier_id: profile?.id,
        vehicle_number: draft.vehicleNumber.trim(),
        load_capacity: draft.capacity.trim(),
        driver_licence_no: draft.driverLicenseNumber.trim(),
        name: draft.name.trim(),
        // Vehicle-specific location capture is paused for now.
        lat: profile?.lat ? String(profile.lat) : undefined,
        lng: profile?.lng ? String(profile.lng) : undefined,
        online: editingVehicle?.isOnline ?? false,
      };

      const response = await SupplierApi.updateVehicle(editingVehicleId, payload);
      if (hasApiFailure(response)) {
        throw new Error(
          extractApiErrorMessage(response) ??
            'Unable to update vehicle right now.',
        );
      }

      setStoredVehicleMetadata(editingVehicleId, {
        capacity: draft.capacity.trim(),
        driverEmail: draft.email.trim(),
        driverLicenseNumber: draft.driverLicenseNumber.trim(),
        driverName: draft.driverName.trim(),
      });

      await refreshVehicles();

      closeVehicleForm(() => {
        setSnackbarMessage('Vehicle details updated successfully.');
        setSnackbarTone('success');
        setSnackbarVisible(true);
      });
    } catch (error: any) {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        'Unable to update vehicle.';
      setVehicleSubmissionError(nextMessage);
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleSubmitVehicle = async (draft: NewVehicleDraft) => {
    if (editingVehicleId) {
      await handleUpdateVehicle(draft);
      return;
    }

    await handleCreateVehicle(draft);
  };

  const handleToggleVehicleAvailability = (vehicleId: string) => {
    toggleVehicleAvailability(vehicleId).catch((error: any) => {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        'Unable to update vehicle availability.';
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    });
  };

  const handleDeleteVehicle = async () => {
    if (!editingVehicleId) {
      return;
    }

    setSubmittingVehicle(true);
    try {
      const response = await SupplierApi.deleteVehicle(editingVehicleId);
      if (hasApiFailure(response)) {
        throw new Error(
          extractApiErrorMessage(response) ?? 'Unable to delete vehicle.',
        );
      }
      removeStoredVehicleMetadata(editingVehicleId);
      await refreshVehicles();
      closeVehicleForm(() => {
        setSnackbarMessage('Vehicle deleted successfully.');
        setSnackbarTone('success');
        setSnackbarVisible(true);
      });
    } catch (error: any) {
      const nextMessage =
        extractApiErrorMessage(error) ??
        error?.message ??
        'Unable to delete vehicle.';
      setSnackbarMessage(nextMessage);
      setSnackbarTone('error');
      setSnackbarVisible(true);
    } finally {
      setSubmittingVehicle(false);
      setDeleteConfirmVisible(false);
    }
  };

  const handleTrackVehicle = (vehicle: VehicleRecord) => {
    setSnackbarMessage(`Latest location: ${vehicle.currentLocation}`);
    setSnackbarTone('info');
    setSnackbarVisible(true);
  };

  const handleCallVehicle = (vehicle: VehicleRecord) => {
    if (!vehicle.driverPhone) {
      setSnackbarMessage('Driver phone number is not available yet.');
      setSnackbarTone('info');
      setSnackbarVisible(true);
      return;
    }

    Linking.openURL(`tel:${vehicle.driverPhone.replace(/\s+/g, '')}`).catch(() => {
      setSnackbarMessage('Unable to start the phone call on this device.');
      setSnackbarTone('error');
      setSnackbarVisible(true);
    });
  };

  const getVehicleStatus = (vehicle: VehicleRecord) => {
    if (vehicle.reviewStatus === 'pending') {
      return {
        label: t('vehiclePendingReviewStatus'),
        accentColor: '#D97706',
        tone: 'pending' as const,
      };
    }

    if (vehicle.isOnline) {
      return {
        label: t('vehicleStatusOnline'),
        accentColor: '#0284C7',
        tone: 'success' as const,
      };
    }

    return {
      label: t('vehicleStatusOffline'),
      accentColor: '#DC2626',
      tone: 'warning' as const,
    };
  };

  const getFilterChipColors = (tone: VehicleFilterTone, isSelected: boolean) => {
    if (tone === 'success') {
      return {
        backgroundColor: isSelected ? '#E0F2FE' : '#F0F9FF',
        borderColor: isSelected ? '#7DD3FC' : '#BAE6FD',
        textColor: '#0284C7',
      };
    }

    if (tone === 'danger') {
      return {
        backgroundColor: isSelected ? '#FEE2E2' : '#FEF2F2',
        borderColor: isSelected ? '#FCA5A5' : '#FECACA',
        textColor: '#DC2626',
      };
    }

    if (tone === 'pending') {
      return {
        backgroundColor: isSelected ? '#FEF3C7' : '#FFFBEB',
        borderColor: isSelected ? '#FCD34D' : '#FDE68A',
        textColor: '#D97706',
      };
    }

    return {
      backgroundColor: isSelected ? palette.accentSoft : palette.surface,
      borderColor: isSelected ? palette.accentSoftBorder : palette.border,
      textColor: isSelected ? palette.accentStrong : palette.muted,
    };
  };

  const editingInitialDraft = useMemo(
    () =>
      editingVehicle
        ? {
            vehicleNumber: editingVehicle.vehicleNumber ?? editingVehicle.route,
            name: editingVehicle.name,
            driverName: editingVehicle.driverName,
            phone: editingVehicle.driverPhone,
            email: editingVehicle.driverEmail ?? '',
            capacity: editingVehicle.capacity,
            driverLicenseNumber: editingVehicle.driverLicenseNumber ?? '',
            lat: supplierProfile?.lat ? String(supplierProfile.lat) : '',
            lng: supplierProfile?.lng ? String(supplierProfile.lng) : '',
          }
        : null,
    [editingVehicle, supplierProfile?.lat, supplierProfile?.lng],
  );

  return (
    <View style={styles.screenRoot}>
      <AppRefreshScrollView
        refreshEnabled={
          !selectedVehicleId &&
          !isHistoryScreenVisible &&
          !selectedHistoryItemId &&
          !isVehicleFormVisible
        }
        onRefresh={refreshVehicles}
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
                  <AppIcon name="vehicles" size={18} color={palette.accentStrong} />
                  <AppText style={[styles.heroBadgeText, { color: palette.accentStrong }]}>
                    {t('vehiclesTab')}
                  </AppText>
                </View>
                <AppText style={[styles.sectionTitle, { color: palette.text }]}>
                  {t('vehiclesHeading')}
                </AppText>
                <AppText style={[styles.sectionSubtitle, { color: palette.muted }]}>
                  {t('vehiclesSubtitle')}
                </AppText>
              </View>
              <AppButton
                title={t('vehicleAddButton')}
                onPress={() => openVehicleForm(null)}
                variant="primary"
                style={styles.addButton}
                textStyle={styles.addButtonText}
              />
            </View>

            <View style={styles.compactSummaryRow}>
              {[
                {
                  label: t('vehiclesFilterAll'),
                  value: String(vehicleSummary.total),
                },
                {
                  label: t('dashboardOnlineVehiclesLabel'),
                  value: String(vehicleSummary.online),
                },
                {
                  label: t('dashboardPendingReviewLabel'),
                  value: String(vehicleSummary.pending),
                },
                {
                  label: t('dashboardMetricOrders'),
                  value: String(vehicleSummary.todayOrders),
                },
              ].map(item => (
                <View
                  key={item.label}
                  style={[
                    styles.compactSummaryChip,
                    {
                      backgroundColor: palette.surfaceSoft,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <AppText style={[styles.compactSummaryValue, { color: palette.text }]}>
                    {item.value}
                  </AppText>
                  <AppText style={[styles.compactSummaryLabel, { color: palette.muted }]}>
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            {filterOptions.map(option => {
              const isSelected = option.key === selectedFilter;
              const chipColors = getFilterChipColors(option.tone, isSelected);
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedFilter(option.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: chipColors.backgroundColor,
                      borderColor: chipColors.borderColor,
                    },
                  ]}
                >
                  <AppText
                    style={[
                      styles.filterChipText,
                      { color: chipColors.textColor },
                    ]}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {filteredVehicles.map(vehicle => {
            const status = getVehicleStatus(vehicle);
            const summary = vehicleOrderSummaries[vehicle.id];

            return (
              <VehicleListCard
                key={vehicle.id}
                name={vehicle.name}
                vehicleNumber={vehicle.vehicleNumber ?? vehicle.route}
                status={status.label}
                statusTone={status.tone}
                driverName={vehicle.driverName || 'Assigned driver'}
                driverDetails={
                  [vehicle.driverPhone, vehicle.driverEmail]
                    .filter(Boolean)
                    .join(' • ') || 'Driver details pending'
                }
                capacityValue={vehicle.capacity}
                routeValue={vehicle.route}
                locationValue={vehicle.currentLocation}
                todayOrdersLabel={t('dashboardMetricOrders')}
                todayOrdersValue={String(summary?.todayOrdersCount ?? 0)}
                currentOrderTitle={summary?.currentOrder?.title ?? undefined}
                currentOrderSubtitle={summary?.currentOrder?.subtitle ?? undefined}
                currentOrderMeta={
                  [summary?.currentOrder?.status, summary?.currentOrder?.value]
                    .filter(Boolean)
                    .join(' • ') || undefined
                }
                accentColor={status.accentColor}
                onPress={() => openVehicleDetails(vehicle.id)}
                onTrack={() => handleTrackVehicle(vehicle)}
                onCall={() => handleCallVehicle(vehicle)}
                onEdit={() => openVehicleForm(vehicle.id)}
                onView={() => openVehicleDetails(vehicle.id)}
                onHistory={() => {
                  setSelectedVehicleId(vehicle.id);
                  openVehicleHistory();
                }}
              />
            );
          })}

          {filteredVehicles.length === 0 ? (
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
                {t('vehiclesEmptyTitle')}
              </AppText>
              <AppText style={[styles.emptyStateBody, { color: palette.muted }]}>
                {t('vehiclesEmptyBody')}
              </AppText>
              <AppButton
                title={t('vehicleAddButton')}
                onPress={() => openVehicleForm(null)}
                variant="primary"
                style={styles.emptyStateButton}
                textStyle={styles.addButtonText}
              />
            </View>
          ) : null}
        </View>
      </AppRefreshScrollView>

      {selectedVehicle ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: detailTranslateX }],
            },
          ]}
        >
          <VehicleDetailsScreen
            vehicle={selectedVehicle}
            onBack={closeVehicleDetails}
            onToggleAvailability={() => handleToggleVehicleAvailability(selectedVehicle.id)}
            onOpenHistory={openVehicleHistory}
          />
        </Animated.View>
      ) : null}

      {selectedVehicle && isHistoryScreenVisible ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: historyTranslateX }],
            },
          ]}
        >
          <VehicleHistoryScreen
            vehicle={selectedVehicle}
            onBack={closeVehicleHistory}
            onOpenHistoryItem={openHistoryItem}
          />
        </Animated.View>
      ) : null}

      {selectedVehicle && selectedHistoryItem ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: orderTranslateX }],
            },
          ]}
        >
          <VehicleHistoryOrderScreen
            vehicle={selectedVehicle}
            historyItem={selectedHistoryItem}
            onBack={closeHistoryItem}
          />
        </Animated.View>
      ) : null}

      {isVehicleFormVisible ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: formTranslateX }],
            },
          ]}
        >
          <AddVehicleScreen
            mode={editingVehicle ? 'edit' : 'create'}
            onBack={() => closeVehicleForm()}
            onSubmit={handleSubmitVehicle}
            isSubmitting={isSubmittingVehicle}
            submitErrorMessage={vehicleSubmissionError}
            supplierLocationSuggestion={
              supplierProfile?.lat && supplierProfile?.lng
                ? {
                    lat: String(supplierProfile.lat),
                    lng: String(supplierProfile.lng),
                  }
                : null
            }
            initialDraft={editingInitialDraft}
            onOpenActionMenu={editingVehicle ? () => setVehicleActionsVisible(true) : null}
          />
        </Animated.View>
      ) : null}

      <AppSheet
        visible={isVehicleActionsVisible}
        title="Vehicle actions"
        subtitle="Manage this vehicle directly from the edit flow."
        onClose={() => setVehicleActionsVisible(false)}
      >
        <AppButton
          title={
            editingVehicle?.isOnline ? 'Mark as offline' : 'Mark as online'
          }
          onPress={() => {
            if (!editingVehicleId) {
              return;
            }
            setVehicleActionsVisible(false);
            handleToggleVehicleAvailability(editingVehicleId);
          }}
          disabled={!editingVehicleId}
          style={styles.sheetActionButton}
          textStyle={styles.sheetActionText}
        />
        <AppButton
          title="Delete vehicle"
          variant="danger"
          onPress={() => {
            setVehicleActionsVisible(false);
            setDeleteConfirmVisible(true);
          }}
          disabled={!editingVehicleId || isSubmittingVehicle}
          style={styles.sheetDeleteButton}
          textStyle={styles.sheetDeleteText}
        />
      </AppSheet>

      <AppSheet
        visible={isDeleteConfirmVisible}
        title="Delete vehicle?"
        subtitle="This action removes the vehicle from your fleet list. Please confirm before continuing."
        onClose={() => setDeleteConfirmVisible(false)}
      >
        <AppButton
          title="Keep vehicle"
          onPress={() => setDeleteConfirmVisible(false)}
          style={styles.sheetActionButton}
          textStyle={styles.sheetActionText}
        />
        <AppButton
          title="Delete permanently"
          variant="danger"
          onPress={handleDeleteVehicle}
          loading={isSubmittingVehicle}
          disabled={!editingVehicleId}
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
  compactSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  compactSummaryChip: {
    minWidth: '47%',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  compactSummaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  compactSummaryLabel: {
    fontSize: 12,
    lineHeight: 17,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 13,
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
