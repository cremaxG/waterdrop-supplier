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
  AppSnackbar,
  AppText,
} from '../../components';
import { VehicleListCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useOperations } from '../../providers/OperationsProvider';
import { useTranslation } from '../../providers/AppProviders';
import SupplierApi from '../../service/supplierApi';
import type { SupplierProfile } from '../../service/supplierApi';
import { AddVehicleScreen, NewVehicleDraft } from './AddVehicleScreen';
import { VehicleHistoryScreen } from './VehicleHistoryScreen';
import { VehicleHistoryOrderScreen } from './VehicleHistoryOrderScreen';
import { VehicleDetailsScreen, VehicleRecord } from './VehicleDetailsScreen';

type VehicleFilterKey = 'all' | 'online' | 'offline' | 'pending';
type VehicleFilterTone = 'neutral' | 'success' | 'danger' | 'pending';

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

interface VehiclesScreenProps {
  onDetailVisibilityChange?: (isVisible: boolean) => void;
}

export function VehiclesScreen({
  onDetailVisibilityChange,
}: VehiclesScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const { vehicles, addVehicle, refreshVehicles, toggleVehicleAvailability } =
    useOperations();
  const { width } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<VehicleFilterKey>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isHistoryScreenVisible, setHistoryScreenVisible] = useState(false);
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(
    null,
  );
  const [isAddVehicleVisible, setAddVehicleVisible] = useState(false);
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarTone, setSnackbarTone] = useState<'success' | 'error' | 'info'>(
    'success',
  );
  const detailTranslateX = useRef(new Animated.Value(width)).current;
  const historyTranslateX = useRef(new Animated.Value(width)).current;
  const orderTranslateX = useRef(new Animated.Value(width)).current;
  const addVehicleTranslateX = useRef(new Animated.Value(width)).current;

  const selectedVehicle = useMemo(
    () => vehicles.find(vehicle => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
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

    return {
      total: vehicles.length,
      online: approvedVehicles.filter(vehicle => vehicle.isOnline).length,
      pending: vehicles.filter(vehicle => vehicle.reviewStatus === 'pending').length,
    };
  }, [vehicles]);

  useEffect(() => {
    if (!selectedVehicleId) {
      detailTranslateX.setValue(width);
      historyTranslateX.setValue(width);
      orderTranslateX.setValue(width);
    }

    if (!isAddVehicleVisible) {
      addVehicleTranslateX.setValue(width);
    }
  }, [
    addVehicleTranslateX,
    detailTranslateX,
    historyTranslateX,
    isAddVehicleVisible,
    orderTranslateX,
    selectedVehicleId,
    width,
  ]);

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

  const openAddVehicle = () => {
    addVehicleTranslateX.setValue(width);
    setAddVehicleVisible(true);
    onDetailVisibilityChange?.(true);

    requestAnimationFrame(() => {
      Animated.timing(addVehicleTranslateX, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeAddVehicle = (onClosed?: () => void) => {
    Animated.timing(addVehicleTranslateX, {
      toValue: width,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setAddVehicleVisible(false);
      onDetailVisibilityChange?.(false);
      if (typeof onClosed === 'function') {
        onClosed();
      }
    });
  };

  const handleAddVehicle = async (draft: NewVehicleDraft) => {
    try {
      const profileResponse = await SupplierApi.getSupplierProfile();
      const profile = unwrapSupplierProfile(profileResponse);

      if (!profile?.id) {
        throw new Error('Unable to load supplier profile.');
      }

      const supplierLat = String(profile.lat ?? '').trim();
      const supplierLng = String(profile.lng ?? '').trim();

      if (!supplierLat || !supplierLng) {
        throw new Error('Supplier location is missing. Please update the supplier profile location first.');
      }

      const payload = {
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        supplier_id: profile.id,
        vehicle_number: draft.vehicleNumber.trim(),
        name: draft.name.trim(),
        lat: supplierLat,
        lng: supplierLng,
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

      const newVehicle: VehicleRecord = {
        id: nextVehicleId,
        name: response.name ?? draft.name.trim(),
        route: response.vehicle_number ?? draft.vehicleNumber.trim(),
        capacity: 'N/A',
        currentLocation:
          [response.lat ?? supplierLat, response.lng ?? supplierLng]
            .filter(Boolean)
            .join(', ') || 'Location pending',
        driverName: '',
        driverPhone: response.phone ?? draft.phone.trim(),
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
      closeAddVehicle(() => {
        setSnackbarMessage(
          createVehicleResult?.message ?? t('vehicleAddSuccessSnackbar'),
        );
        setSnackbarTone('success');
        setSnackbarVisible(true);
      });
    } catch (error: any) {
      setSnackbarMessage(
        extractApiErrorMessage(error) ??
          error?.message ??
          t('vehicleAddErrorSnackbar'),
      );
      setSnackbarTone('error');
      setSnackbarVisible(true);
    }
  };

  const handleToggleVehicleAvailability = () => {
    if (!selectedVehicleId) {
      return;
    }
    toggleVehicleAvailability(selectedVehicleId);
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
        accentColor: '#059669',
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
        backgroundColor: isSelected ? '#DCFCE7' : '#F0FDF4',
        borderColor: isSelected ? '#86EFAC' : '#BBF7D0',
        textColor: '#059669',
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

  return (
    <View style={styles.screenRoot}>
      <AppRefreshScrollView
        refreshEnabled={
          !selectedVehicleId &&
          !isHistoryScreenVisible &&
          !selectedHistoryItemId &&
          !isAddVehicleVisible
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
              onPress={openAddVehicle}
              variant="primary"
              style={styles.addButton}
              textStyle={styles.addButtonText}
            />
          </View>

          <View style={styles.summaryRow}>
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

          return (
            <VehicleListCard
              key={vehicle.id}
              name={vehicle.name}
              status={status.label}
              statusTone={status.tone}
              capacityLabel={t('vehicleCardCapacity')}
              capacityValue={vehicle.capacity}
              routeLabel={t('vehicleCardRoute')}
              routeValue={vehicle.route}
              locationLabel={t('vehicleCurrentLocation')}
              locationValue={vehicle.currentLocation}
              accentColor={status.accentColor}
              onPress={() => openVehicleDetails(vehicle.id)}
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
              onPress={openAddVehicle}
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
            onToggleAvailability={handleToggleVehicleAvailability}
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

      {isAddVehicleVisible ? (
        <Animated.View
          style={[
            styles.overlayScreen,
            {
              backgroundColor: palette.background,
              transform: [{ translateX: addVehicleTranslateX }],
            },
          ]}
        >
          <AddVehicleScreen
            onBack={() => closeAddVehicle()}
            onSubmit={handleAddVehicle}
          />
        </Animated.View>
      ) : null}

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
});
