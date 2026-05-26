import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppButton,
  AppFieldMessage,
  AppIcon,
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
}

interface AddVehicleScreenProps {
  onBack: () => void;
  onSubmit: (draft: NewVehicleDraft) => void | Promise<void>;
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;
}

type VehicleField = keyof NewVehicleDraft;

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
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
  });
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<VehicleField, boolean>>
  >({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);

  const validationErrors = useMemo(() => getVehicleValidationErrors(draft), [draft]);
  const hasValidationErrors = useMemo(
    () => Object.values(validationErrors).some(Boolean),
    [validationErrors],
  );

  const updateField = (field: keyof NewVehicleDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const markTouched = (field: VehicleField) => {
    setTouchedFields(current => ({ ...current, [field]: true }));
  };

  const shouldShowFieldError = (field: VehicleField) =>
    Boolean((didAttemptSubmit || touchedFields[field]) && validationErrors[field]);

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
      <Pressable onPress={onBack} style={styles.backRow}>
        <AppIcon name="back" size={18} color={palette.accentStrong} />
        <AppText style={[styles.backText, { color: palette.accentStrong }]}>
          {t('vehicleAddBackButton')}
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
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
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
  noteText: {
    fontSize: 14,
    lineHeight: 21,
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
