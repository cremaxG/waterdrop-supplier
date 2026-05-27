import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MapView, {
  MapPressEvent,
  Marker,
  MarkerDragStartEndEvent,
  Region,
} from 'react-native-maps';
import {
  AppBackButton,
  AppButton,
  AppFieldMessage,
  AppInput,
  AppText,
} from '../../components';
import { VehicleSectionCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';

export interface NewVehicleDraft {
  vehicleNumber: string;
  name: string;
  phone: string;
  email: string;
  capacity: string;
  driverLicenseNumber: string;
  lat: string;
  lng: string;
}

interface AddVehicleScreenProps {
  onBack: () => void;
  onSubmit: (draft: NewVehicleDraft) => void | Promise<void>;
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;
  supplierLocationSuggestion?: {
    lat: string;
    lng: string;
  } | null;
}

type VehicleField = Exclude<keyof NewVehicleDraft, 'lat' | 'lng'>;

interface VehicleLocationValue {
  lat: string;
  lng: string;
}

interface LocationSearchResult extends VehicleLocationValue {
  id: string;
  title: string;
  subtitle: string;
}

const DEFAULT_MAP_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function isValidCoordinate(value: string, min: number, max: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max;
}

function normalizeLocationValue(
  lat?: string | null,
  lng?: string | null,
): VehicleLocationValue | null {
  const normalizedLat = String(lat ?? '').trim();
  const normalizedLng = String(lng ?? '').trim();

  if (!normalizedLat || !normalizedLng) {
    return null;
  }

  if (
    !isValidCoordinate(normalizedLat, -90, 90) ||
    !isValidCoordinate(normalizedLng, -180, 180)
  ) {
    return null;
  }

  return {
    lat: normalizedLat,
    lng: normalizedLng,
  };
}

function formatLocationValue(location: VehicleLocationValue | null) {
  if (!location) {
    return '';
  }

  return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`;
}

function getMapRegion(location: VehicleLocationValue | null): Region {
  if (!location) {
    return DEFAULT_MAP_REGION;
  }

  return {
    latitude: Number(location.lat),
    longitude: Number(location.lng),
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };
}

function formatAddressParts(result: any) {
  const address = result?.address ?? {};
  const title =
    address.road ??
    address.neighbourhood ??
    address.suburb ??
    address.village ??
    address.town ??
    address.city ??
    address.county ??
    'Selected location';

  const subtitleParts = [
    address.suburb,
    address.city ?? address.town ?? address.village,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);

  return {
    title,
    subtitle: subtitleParts.join(', '),
  };
}

async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to search locations right now.');
  }

  const results = await response.json();
  return Array.isArray(results)
    ? results
        .map((item: any) => {
          const location = normalizeLocationValue(item.lat, item.lon);
          if (!location) {
            return null;
          }

          const address = formatAddressParts(item);
          return {
            id: String(item.place_id ?? `${location.lat}-${location.lng}`),
            lat: location.lat,
            lng: location.lng,
            title: address.title,
            subtitle: item.display_name ?? address.subtitle,
          };
        })
        .filter((item): item is LocationSearchResult => Boolean(item))
    : [];
}

async function reverseGeocodeLocation(
  location: VehicleLocationValue,
): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(location.lat)}&lon=${encodeURIComponent(location.lng)}&zoom=18&addressdetails=1`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to fetch location address right now.');
  }

  const result = await response.json();
  return result?.display_name ?? '';
}

function getVehicleValidationErrors(draft: NewVehicleDraft) {
  return {
    vehicleNumber: !draft.vehicleNumber.trim()
      ? 'Vehicle registration number is required.'
      : '',
    name: !draft.name.trim()
      ? 'Vehicle name is required.'
      : draft.name.trim().length < 2
        ? 'Enter at least 2 characters for the vehicle name.'
        : '',
    phone: !draft.phone.trim()
      ? 'Contact phone number is required.'
      : draft.phone.replace(/\D/g, '').length !== 10
        ? 'Enter a valid 10-digit phone number.'
        : '',
    email:
      draft.email.trim() && !isEmail(draft.email)
        ? 'Enter a valid email address or leave this field empty.'
        : '',
    capacity: !draft.capacity.trim() ? 'Vehicle load capacity is required.' : '',
    driverLicenseNumber: !draft.driverLicenseNumber.trim()
      ? 'Driver licence number is required.'
      : '',
  } satisfies Record<VehicleField, string>;
}

export function AddVehicleScreen({
  onBack,
  onSubmit,
  isSubmitting = false,
  submitErrorMessage = null,
  supplierLocationSuggestion = null,
}: AddVehicleScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [draft, setDraft] = useState<NewVehicleDraft>({
    vehicleNumber: '',
    name: '',
    phone: '',
    email: '',
    capacity: '',
    driverLicenseNumber: '',
    lat: '',
    lng: '',
  });
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<VehicleField, boolean>>
  >({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [isLocationPickerVisible, setLocationPickerVisible] = useState(false);
  const [mapSelection, setMapSelection] = useState<VehicleLocationValue | null>(null);
  const [selectedLocationAddress, setSelectedLocationAddress] = useState('');
  const [mapSelectionAddress, setMapSelectionAddress] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<
    LocationSearchResult[]
  >([]);
  const [isSearchingLocations, setSearchingLocations] = useState(false);
  const [isResolvingAddress, setResolvingAddress] = useState(false);
  const [locationPickerError, setLocationPickerError] = useState('');
  const mapRef = useRef<MapView | null>(null);
  const searchRequestIdRef = useRef(0);
  const reverseRequestIdRef = useRef(0);
  const skipNextSearchRef = useRef(false);

  const validationErrors = useMemo(() => getVehicleValidationErrors(draft), [draft]);
  const hasValidationErrors = useMemo(
    () => Object.values(validationErrors).some(Boolean),
    [validationErrors],
  );
  const selectedLocation = useMemo(
    () => normalizeLocationValue(draft.lat, draft.lng),
    [draft.lat, draft.lng],
  );
  const suggestedLocation = useMemo(
    () =>
      normalizeLocationValue(
        supplierLocationSuggestion?.lat,
        supplierLocationSuggestion?.lng,
      ),
    [supplierLocationSuggestion],
  );
  const mapInitialRegion = useMemo(
    () => getMapRegion(selectedLocation ?? suggestedLocation),
    [selectedLocation, suggestedLocation],
  );

  const updateField = (field: keyof NewVehicleDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const markTouched = (field: VehicleField) => {
    setTouchedFields(current => ({ ...current, [field]: true }));
  };

  const shouldShowFieldError = (field: VehicleField) =>
    Boolean((didAttemptSubmit || touchedFields[field]) && validationErrors[field]);

  useEffect(() => {
    if (!isLocationPickerVisible) {
      return;
    }

    setMapSelection(selectedLocation ?? suggestedLocation ?? null);
    setMapSelectionAddress(
      selectedLocation ? selectedLocationAddress : '',
    );
    skipNextSearchRef.current = true;
    setLocationSearchQuery(selectedLocation ? selectedLocationAddress : '');
    setLocationSearchResults([]);
    setLocationPickerError('');
  }, [
    isLocationPickerVisible,
    selectedLocation,
    selectedLocationAddress,
    suggestedLocation,
  ]);

  useEffect(() => {
    if (!isLocationPickerVisible) {
      return;
    }

    const trimmedQuery = locationSearchQuery.trim();
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (trimmedQuery.length < 3) {
      setLocationSearchResults([]);
      setSearchingLocations(false);
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    setSearchingLocations(true);
    setLocationPickerError('');

    const timeoutId = setTimeout(() => {
      searchLocations(trimmedQuery)
        .then(results => {
          if (searchRequestIdRef.current !== requestId) {
            return;
          }

          setLocationSearchResults(results);
          if (!results.length) {
            setLocationPickerError(t('vehicleAddLocationSearchEmpty'));
          }
        })
        .catch((error: any) => {
          if (searchRequestIdRef.current !== requestId) {
            return;
          }

          setLocationSearchResults([]);
          setLocationPickerError(
            error?.message ?? t('vehicleAddLocationSearchError'),
          );
        })
        .finally(() => {
          if (searchRequestIdRef.current === requestId) {
            setSearchingLocations(false);
          }
        });
    }, 320);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLocationPickerVisible, locationSearchQuery, t]);

  const syncAddressForLocation = async (
    location: VehicleLocationValue,
    target: 'draft' | 'picker',
  ) => {
    const requestId = ++reverseRequestIdRef.current;
    setResolvingAddress(true);
    setLocationPickerError('');

    try {
      const nextAddress = await reverseGeocodeLocation(location);
      if (reverseRequestIdRef.current !== requestId) {
        return;
      }

      if (target === 'draft') {
        setSelectedLocationAddress(nextAddress);
      } else {
        setMapSelectionAddress(nextAddress);
        skipNextSearchRef.current = true;
        setLocationSearchQuery(nextAddress);
        setLocationSearchResults([]);
      }
    } catch (error: any) {
      if (reverseRequestIdRef.current !== requestId) {
        return;
      }

      setLocationPickerError(
        error?.message ?? t('vehicleAddLocationAddressError'),
      );
    } finally {
      if (reverseRequestIdRef.current === requestId) {
        setResolvingAddress(false);
      }
    }
  };

  const applyLocation = (
    location: VehicleLocationValue | null,
    address: string = '',
  ) => {
    setDraft(current => ({
      ...current,
      lat: location?.lat ?? '',
      lng: location?.lng ?? '',
    }));
    setSelectedLocationAddress(location ? address : '');
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const nextLocation = {
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
    };
    setMapSelection(nextLocation);
    syncAddressForLocation(nextLocation, 'picker');
  };

  const handleMarkerDragEnd = (event: MarkerDragStartEndEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const nextLocation = {
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
    };
    setMapSelection(nextLocation);
    syncAddressForLocation(nextLocation, 'picker');
  };

  const handleSubmit = async () => {
    setDidAttemptSubmit(true);

    if (hasValidationErrors || isSubmitting) {
      return;
    }

    await onSubmit(draft);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <AppBackButton onPress={onBack} label={t('vehicleAddBackButton')} />

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
          {t('vehicleAddTitle')}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {t('vehicleAddSubtitle')}
        </AppText>
        <View
          style={[
            styles.reviewChip,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppText style={[styles.reviewChipText, { color: palette.accentStrong }]}>
            {t('vehiclePendingReviewStatus')}
          </AppText>
        </View>
      </View>

      <VehicleSectionCard
        title={t('vehicleAddSectionVehicle')}
        subtitle={t('vehicleAddSectionVehicleSubtitle')}
      >
        <View style={styles.stack}>
          <AppInput
            value={draft.vehicleNumber}
            onChangeText={value => updateField('vehicleNumber', value)}
            onBlur={() => markTouched('vehicleNumber')}
            placeholder={t('vehicleAddNumberPlaceholder')}
            hasError={shouldShowFieldError('vehicleNumber')}
          />
          <AppFieldMessage
            message={
              shouldShowFieldError('vehicleNumber')
                ? validationErrors.vehicleNumber
                : null
            }
          />
          <AppInput
            value={draft.name}
            onChangeText={value => updateField('name', value)}
            onBlur={() => markTouched('name')}
            placeholder={t('vehicleAddNamePlaceholder')}
            hasError={shouldShowFieldError('name')}
          />
          <AppFieldMessage
            message={shouldShowFieldError('name') ? validationErrors.name : null}
          />
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleAddSectionContact')}
        subtitle={t('vehicleAddSectionContactSubtitle')}
      >
        <View style={styles.stack}>
          <AppInput
            value={draft.phone}
            onChangeText={value => updateField('phone', value)}
            onBlur={() => markTouched('phone')}
            placeholder={t('vehicleAddPhonePlaceholder')}
            keyboardType="phone-pad"
            hasError={shouldShowFieldError('phone')}
          />
          <AppFieldMessage
            message={shouldShowFieldError('phone') ? validationErrors.phone : null}
          />
          <AppInput
            value={draft.email}
            onChangeText={value => updateField('email', value)}
            onBlur={() => markTouched('email')}
            placeholder="Vehicle driver email (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            hasError={shouldShowFieldError('email')}
          />
          <AppFieldMessage
            message={shouldShowFieldError('email') ? validationErrors.email : null}
          />
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title="Vehicle capacity and licence"
        subtitle="Capture the load capacity and the driver licence number for review."
      >
        <View style={styles.stack}>
          <AppInput
            value={draft.capacity}
            onChangeText={value => updateField('capacity', value)}
            onBlur={() => markTouched('capacity')}
            placeholder="Vehicle load capacity"
            hasError={shouldShowFieldError('capacity')}
          />
          <AppFieldMessage
            message={
              shouldShowFieldError('capacity') ? validationErrors.capacity : null
            }
          />
          <AppInput
            value={draft.driverLicenseNumber}
            onChangeText={value => updateField('driverLicenseNumber', value)}
            onBlur={() => markTouched('driverLicenseNumber')}
            placeholder="Vehicle driver licence number"
            hasError={shouldShowFieldError('driverLicenseNumber')}
          />
          <AppFieldMessage
            message={
              shouldShowFieldError('driverLicenseNumber')
                ? validationErrors.driverLicenseNumber
                : null
            }
          />
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleAddSectionLocation')}
        subtitle={t('vehicleAddSectionLocationSubtitle')}
      >
        <View style={styles.stack}>
          <View
            style={[
              styles.locationSummaryCard,
              {
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.border,
              },
            ]}
          >
            <View style={styles.locationSummaryHeader}>
              <AppText style={[styles.locationSummaryLabel, { color: palette.muted }]}>
                {t('vehicleAddLocationPickerLabel')}
              </AppText>
              <AppText
                style={[styles.locationOptionalLabel, { color: palette.accentStrong }]}
              >
                {t('vehicleAddLocationOptionalLabel')}
              </AppText>
            </View>
            <AppText style={[styles.locationSummaryValue, { color: palette.text }]}>
              {selectedLocation
                ? formatLocationValue(selectedLocation)
                : t('vehicleAddLocationEmptyState')}
            </AppText>
            {selectedLocationAddress ? (
              <AppText style={[styles.locationAddressValue, { color: palette.text }]}>
                {selectedLocationAddress}
              </AppText>
            ) : null}
            <AppText style={[styles.locationSummaryHint, { color: palette.muted }]}>
              {selectedLocation
                ? t('vehicleAddLocationSelectedHint')
                : suggestedLocation
                  ? t('vehicleAddSupplierLocationHint')
                  : t('vehicleAddLocationEmptyHint')}
            </AppText>
          </View>

          <AppButton
            title={t('vehicleAddLocationPickerButton')}
            onPress={() => setLocationPickerVisible(true)}
            disabled={isSubmitting}
            style={[
              styles.locationActionButton,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
            textStyle={{ color: palette.accentStrong }}
          />

          {suggestedLocation ? (
            <AppButton
              title={t('vehicleAddUseSupplierLocationButton')}
              onPress={() => {
                applyLocation(suggestedLocation);
                syncAddressForLocation(suggestedLocation, 'draft');
              }}
              disabled={isSubmitting}
              style={styles.locationUtilityButton}
              textStyle={{ color: palette.accentStrong }}
            />
          ) : null}

          {selectedLocation ? (
            <AppButton
              title={t('vehicleAddClearLocationButton')}
              onPress={() => applyLocation(null)}
              disabled={isSubmitting}
              variant="ghost"
              style={styles.locationUtilityButton}
              textStyle={{ color: palette.muted }}
            />
          ) : null}
        </View>
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('vehicleAddReviewTitle')}
        subtitle={t('vehicleAddReviewSubtitle')}
      >
        <View style={styles.stack}>
          <AppText style={[styles.noteText, { color: palette.muted }]}>
            {t('vehicleAddReviewNote')}
          </AppText>
          <AppFieldMessage
            message={
              didAttemptSubmit && hasValidationErrors
                ? 'Please fix the highlighted fields before submitting for review.'
                : submitErrorMessage
            }
          />
          <AppButton
            title={t('vehicleAddSubmitButton')}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
        </View>
      </VehicleSectionCard>

      <Modal
        visible={isLocationPickerVisible}
        animationType="slide"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <View
          style={[
            styles.mapPickerScreen,
            { backgroundColor: palette.background },
          ]}
        >
          <AppBackButton
            onPress={() => setLocationPickerVisible(false)}
            style={styles.mapPickerBackButton}
          />
          <AppText style={[styles.mapPickerTitle, { color: palette.text }]}>
            {t('vehicleAddLocationPickerTitle')}
          </AppText>
          <AppText style={[styles.mapPickerSubtitle, { color: palette.muted }]}>
            {t('vehicleAddLocationPickerSubtitle')}
          </AppText>

          <View
            style={[
              styles.mapSearchCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <AppText style={[styles.locationSummaryLabel, { color: palette.muted }]}>
              {t('vehicleAddLocationSearchLabel')}
            </AppText>
            <AppInput
              value={locationSearchQuery}
              onChangeText={setLocationSearchQuery}
              placeholder={t('vehicleAddLocationSearchPlaceholder')}
              editable={!isSubmitting}
            />
            {isSearchingLocations ? (
              <View style={styles.searchLoadingRow}>
                <ActivityIndicator color={palette.accentStrong} />
                <AppText style={[styles.searchLoadingText, { color: palette.muted }]}>
                  {t('vehicleAddLocationSearchingLabel')}
                </AppText>
              </View>
            ) : null}
            {locationSearchResults.length ? (
              <View
                style={[
                  styles.searchResultsCard,
                  {
                    backgroundColor: palette.surfaceSoft,
                    borderColor: palette.border,
                  },
                ]}
              >
                {locationSearchResults.map(result => (
                  <Pressable
                    key={result.id}
                    onPress={() => {
                      setMapSelection(result);
                      setMapSelectionAddress(result.subtitle);
                      skipNextSearchRef.current = true;
                      setLocationSearchQuery(result.subtitle);
                      setLocationSearchResults([]);
                      setLocationPickerError('');
                      mapRef.current?.animateToRegion(getMapRegion(result), 260);
                    }}
                    style={({ pressed }) => [
                      styles.searchResultRow,
                      {
                        borderBottomColor: palette.border,
                        backgroundColor: pressed ? palette.accentSoft : 'transparent',
                      },
                    ]}
                  >
                    <AppText style={[styles.searchResultTitle, { color: palette.text }]}>
                      {result.title}
                    </AppText>
                    <AppText style={[styles.searchResultSubtitle, { color: palette.muted }]}>
                      {result.subtitle}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.mapCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <MapView
              ref={ref => {
                mapRef.current = ref;
              }}
              initialRegion={mapInitialRegion}
              onPress={handleMapPress}
              style={styles.map}
            >
              {mapSelection ? (
                <Marker
                  coordinate={{
                    latitude: Number(mapSelection.lat),
                    longitude: Number(mapSelection.lng),
                  }}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              ) : null}
            </MapView>
          </View>

          <View
            style={[
              styles.mapSelectionCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <AppText style={[styles.locationSummaryLabel, { color: palette.muted }]}>
              {t('vehicleAddLocationAddressBarLabel')}
            </AppText>
            <AppText style={[styles.mapSelectionValue, { color: palette.text }]}>
              {mapSelectionAddress || t('vehicleAddLocationEmptyState')}
            </AppText>
            {mapSelection ? (
              <AppText style={[styles.mapSelectionCoordinates, { color: palette.muted }]}>
                {formatLocationValue(mapSelection)}
              </AppText>
            ) : null}
          </View>

          <AppFieldMessage message={locationPickerError} />
          {isResolvingAddress ? (
            <View style={styles.searchLoadingRow}>
              <ActivityIndicator color={palette.accentStrong} />
              <AppText style={[styles.searchLoadingText, { color: palette.muted }]}>
                {t('vehicleAddLocationResolvingLabel')}
              </AppText>
            </View>
          ) : null}

          <AppButton
            title={t('vehicleAddLocationPickerConfirm')}
            onPress={() => {
              applyLocation(mapSelection, mapSelectionAddress);
              setLocationPickerVisible(false);
            }}
            disabled={!mapSelection || isSubmitting}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
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
  reviewChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stack: {
    gap: 12,
  },
  locationSummaryCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  locationSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationSummaryLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationOptionalLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  locationSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  locationAddressValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  locationSummaryHint: {
    fontSize: 13,
    lineHeight: 19,
  },
  locationActionButton: {
    borderWidth: 1,
    borderRadius: 18,
  },
  locationUtilityButton: {
    borderRadius: 18,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 21,
  },
  mapPickerScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  mapPickerBackButton: {
    marginBottom: 14,
  },
  mapPickerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  mapPickerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  mapSearchCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 10,
    marginBottom: 14,
  },
  mapCard: {
    flex: 1,
    minHeight: 320,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  mapSelectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  mapSelectionValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  mapSelectionCoordinates: {
    fontSize: 13,
    lineHeight: 19,
  },
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchLoadingText: {
    fontSize: 13,
  },
  searchResultsCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  searchResultRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  searchResultSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
    borderRadius: 18,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
