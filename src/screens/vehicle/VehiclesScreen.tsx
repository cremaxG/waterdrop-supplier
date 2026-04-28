import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppButton, AppText } from '../../components';
import { VehicleListCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useOperations } from '../../providers/OperationsProvider';
import { useTranslation } from '../../providers/AppProviders';
import { AddVehicleScreen, NewVehicleDraft } from './AddVehicleScreen';
import { VehicleHistoryScreen } from './VehicleHistoryScreen';
import { VehicleHistoryOrderScreen } from './VehicleHistoryOrderScreen';
import { VehicleDetailsScreen, VehicleRecord } from './VehicleDetailsScreen';

type VehicleFilterKey = 'all' | 'online' | 'offline' | 'pending';
type VehicleFilterTone = 'neutral' | 'success' | 'danger' | 'pending';

interface VehiclesScreenProps {
  onDetailVisibilityChange?: (isVisible: boolean) => void;
}

export function VehiclesScreen({
  onDetailVisibilityChange,
}: VehiclesScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const { vehicles, addVehicle, toggleVehicleAvailability } = useOperations();
  const { width } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<VehicleFilterKey>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isHistoryScreenVisible, setHistoryScreenVisible] = useState(false);
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(
    null,
  );
  const [isAddVehicleVisible, setAddVehicleVisible] = useState(false);
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

  const closeAddVehicle = () => {
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
    });
  };

  const handleAddVehicle = (draft: NewVehicleDraft) => {
    const nextVehicleId = `vehicle-${Date.now()}`;
    const normalizedPhone = draft.driverPhone.replace(/[^\d+]/g, '');

    const newVehicle: VehicleRecord = {
      id: nextVehicleId,
      name: draft.name.trim(),
      route: draft.route.trim(),
      capacity: draft.capacity.trim(),
      currentLocation: draft.currentLocation.trim(),
      driverName: draft.driverName.trim(),
      driverPhone: normalizedPhone,
      driverRating: t('vehicleAddPendingValue'),
      shiftWindow: draft.shiftWindow.trim(),
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

    addVehicle(newVehicle);
    setSelectedFilter('pending');
    closeAddVehicle();
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
      <View style={styles.listScreen}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
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
            style={styles.addButton}
            textStyle={styles.addButtonText}
          />
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
          </View>
        ) : null}
      </View>

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
            onBack={closeAddVehicle}
            onSubmit={handleAddVehicle}
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
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});
