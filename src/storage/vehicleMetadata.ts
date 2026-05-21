import { createMMKV } from 'react-native-mmkv';

export interface StoredVehicleMetadata {
  capacity?: string;
  driverEmail?: string;
  driverLicenseNumber?: string;
  driverName?: string;
}

const storage = createMMKV({
  id: 'water-supplier-vehicle-metadata',
});

const VEHICLE_METADATA_KEY = 'vehicles.metadata';

function readMetadataMap(): Record<string, StoredVehicleMetadata> {
  const rawValue = storage.getString(VEHICLE_METADATA_KEY);
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getStoredVehicleMetadata(vehicleId: string) {
  return readMetadataMap()[vehicleId] ?? null;
}

export function setStoredVehicleMetadata(
  vehicleId: string,
  metadata: StoredVehicleMetadata,
) {
  const currentMap = readMetadataMap();
  currentMap[vehicleId] = {
    ...(currentMap[vehicleId] ?? {}),
    ...metadata,
  };
  storage.set(VEHICLE_METADATA_KEY, JSON.stringify(currentMap));
}
