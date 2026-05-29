import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AppBackButton,
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
  driverName: string;
  phone: string;
  email: string;
  capacity: string;
  driverLicenseNumber: string;
  lat: string;
  lng: string;
}

interface AddVehicleScreenProps {
  mode?: 'create' | 'edit';
  onBack: () => void;
  onSubmit: (draft: NewVehicleDraft) => void | Promise<void>;
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;
  supplierLocationSuggestion?: {
    lat: string;
    lng: string;
  } | null;
  initialDraft?: Partial<NewVehicleDraft> | null;
  onOpenActionMenu?: (() => void) | null;
}

type VehicleField = Exclude<keyof NewVehicleDraft, 'lat' | 'lng'>;
type VehicleStepKey = 'vehicle' | 'driver' | 'review';

interface VehicleStepDefinition {
  key: VehicleStepKey;
  label: string;
  title: string;
  subtitle: string;
  fields: VehicleField[];
}

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function buildInitialDraft(
  initialDraft?: Partial<NewVehicleDraft> | null,
): NewVehicleDraft {
  return {
    vehicleNumber: initialDraft?.vehicleNumber ?? '',
    name: initialDraft?.name ?? '',
    driverName: initialDraft?.driverName ?? '',
    phone: initialDraft?.phone ?? '',
    email: initialDraft?.email ?? '',
    capacity: initialDraft?.capacity ?? '',
    driverLicenseNumber: initialDraft?.driverLicenseNumber ?? '',
    lat: initialDraft?.lat ?? '',
    lng: initialDraft?.lng ?? '',
  };
}

function getVehicleValidationErrors(
  draft: NewVehicleDraft,
  t: (key: string) => string,
) {
  return {
    vehicleNumber: !draft.vehicleNumber.trim()
      ? t('vehicleValidationNumberRequired')
      : '',
    name: !draft.name.trim()
      ? t('vehicleValidationNameRequired')
      : draft.name.trim().length < 2
        ? t('vehicleValidationNameMin')
        : '',
    driverName: !draft.driverName.trim()
      ? t('vehicleValidationDriverNameRequired')
      : draft.driverName.trim().length < 2
        ? t('vehicleValidationDriverNameMin')
        : '',
    phone: !draft.phone.trim()
      ? t('vehicleValidationPhoneRequired')
      : draft.phone.replace(/\D/g, '').length !== 10
        ? t('vehicleValidationPhoneInvalid')
        : '',
    email:
      draft.email.trim() && !isEmail(draft.email)
        ? t('vehicleValidationEmailInvalid')
        : '',
    capacity: !draft.capacity.trim() ? t('vehicleValidationCapacityRequired') : '',
    driverLicenseNumber: !draft.driverLicenseNumber.trim()
      ? t('vehicleValidationLicenseRequired')
      : '',
  } satisfies Record<VehicleField, string>;
}

export function AddVehicleScreen({
  mode = 'create',
  onBack,
  onSubmit,
  isSubmitting = false,
  submitErrorMessage = null,
  supplierLocationSuggestion = null,
  initialDraft = null,
  onOpenActionMenu = null,
}: AddVehicleScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [draft, setDraft] = useState<NewVehicleDraft>(() =>
    buildInitialDraft(initialDraft),
  );
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<VehicleField, boolean>>
  >({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setDraft(buildInitialDraft(initialDraft));
    setTouchedFields({});
    setDidAttemptSubmit(false);
    setCurrentStep(0);
  }, [initialDraft, mode]);

  const steps = useMemo<VehicleStepDefinition[]>(
    () => [
      {
        key: 'vehicle',
        label: t('vehicleStepVehicle'),
        title:
          mode === 'edit'
            ? t('vehicleEditSectionVehicleTitle')
            : t('vehicleAddSectionVehicle'),
        subtitle:
          mode === 'edit'
            ? t('vehicleEditSectionVehicleSubtitle')
            : t('vehicleAddSectionVehicleSubtitle'),
        fields: ['vehicleNumber', 'name', 'capacity'],
      },
      {
        key: 'driver',
        label: t('vehicleStepDriver'),
        title: t('vehicleEditDriverTitle'),
        subtitle:
          t('vehicleEditDriverSubtitle'),
        fields: ['driverName', 'phone', 'email', 'driverLicenseNumber'],
      },
      {
        key: 'review',
        label: t('vehicleStepReview'),
        title: t('vehicleAddReviewTitle'),
        subtitle:
          mode === 'edit'
            ? t('vehicleEditReviewSubtitle')
            : t('vehicleAddReviewSubtitle'),
        fields: [],
      },
    ],
    [mode, t],
  );

  const validationErrors = useMemo(
    () => getVehicleValidationErrors(draft, t),
    [draft, t],
  );
  const hasValidationErrors = useMemo(
    () => Object.values(validationErrors).some(Boolean),
    [validationErrors],
  );
  const isEditMode = mode === 'edit';
  const headerTitle = isEditMode ? t('vehicleEditTitle') : t('vehicleAddTitle');
  const headerSubtitle = isEditMode
    ? t('vehicleEditSubtitle')
    : t('vehicleAddSubtitle');
  const reviewChipLabel = isEditMode
    ? t('vehicleEditChipLabel')
    : t('vehiclePendingReviewStatus');
  const supplierLocationLabel =
    supplierLocationSuggestion?.lat && supplierLocationSuggestion?.lng
      ? `${Number(supplierLocationSuggestion.lat).toFixed(5)}, ${Number(
          supplierLocationSuggestion.lng,
        ).toFixed(5)}`
      : t('vehicleSupplierDefaultLocationLabel');

  const updateField = (field: keyof NewVehicleDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const markTouched = (field: VehicleField) => {
    setTouchedFields(current => ({ ...current, [field]: true }));
  };

  const markStepTouched = (fields: VehicleField[]) => {
    if (!fields.length) {
      return;
    }

    setTouchedFields(current =>
      fields.reduce(
        (next, field) => ({
          ...next,
          [field]: true,
        }),
        current,
      ),
    );
  };

  const shouldShowFieldError = (field: VehicleField) =>
    Boolean((didAttemptSubmit || touchedFields[field]) && validationErrors[field]);

  const handleNextStep = () => {
    const step = steps[currentStep];
    if (!step) {
      return;
    }

    markStepTouched(step.fields);
    const hasStepErrors = step.fields.some(field => validationErrors[field]);
    if (hasStepErrors) {
      return;
    }

    setCurrentStep(current => Math.min(current + 1, steps.length - 1));
  };

  const handleStepPress = (targetStep: number) => {
    if (targetStep === currentStep) {
      return;
    }

    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    const fieldsToValidate = steps
      .slice(0, targetStep)
      .flatMap(step => step.fields);

    markStepTouched(fieldsToValidate);

    const firstInvalidStep = steps.findIndex(
      (step, index) =>
        index < targetStep && step.fields.some(field => validationErrors[field]),
    );

    if (firstInvalidStep >= 0) {
      setCurrentStep(firstInvalidStep);
      return;
    }

    setCurrentStep(targetStep);
  };

  const handleSubmit = async () => {
    setDidAttemptSubmit(true);
    markStepTouched(steps.flatMap(step => step.fields));

    if (hasValidationErrors || isSubmitting) {
      return;
    }

    await onSubmit(draft);
  };

  const renderStepChip = (step: VehicleStepDefinition, index: number) => {
    const isActive = currentStep === index;
    const isComplete = currentStep > index;
    const stepDotStyle = {
      backgroundColor:
        isActive || isComplete ? palette.accentStrong : 'transparent',
      borderColor:
        isActive || isComplete ? palette.accentStrong : palette.border,
    };

    return (
      <Pressable
        key={step.key}
        onPress={() => handleStepPress(index)}
        style={[
          styles.stepChip,
          {
            backgroundColor: isActive ? palette.accentSoft : palette.surface,
            borderColor:
              isActive || isComplete ? palette.accentSoftBorder : palette.border,
          },
        ]}
      >
        <View
        style={[
          styles.stepDot,
          stepDotStyle,
        ]}
      />
        <AppText
          style={[
            styles.stepLabel,
            {
              color:
                isActive || isComplete ? palette.accentStrong : palette.muted,
            },
          ]}
        >
          {step.label}
        </AppText>
      </Pressable>
    );
  };

  const currentStepDefinition = steps[currentStep];

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBar}>
        <AppBackButton onPress={onBack} label={t('vehicleAddBackButton')} />
        {isEditMode && onOpenActionMenu ? (
          <Pressable
            onPress={onOpenActionMenu}
            style={[
              styles.moreButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <AppIcon name="more" size={20} color={palette.accentStrong} />
          </Pressable>
        ) : null}
      </View>

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
          {headerTitle}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {headerSubtitle}
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
            {reviewChipLabel}
          </AppText>
        </View>
      </View>

      <View style={styles.stepRow}>{steps.map(renderStepChip)}</View>

      <VehicleSectionCard
        title={currentStepDefinition.title}
        subtitle={currentStepDefinition.subtitle}
      >
        {currentStepDefinition.key === 'vehicle' ? (
          <View style={styles.stack}>
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
            <View style={styles.doubleFieldRow}>
              <View style={styles.doubleFieldCell}>
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
              </View>
              <View style={styles.doubleFieldCell}>
                <AppInput
                  value={draft.capacity}
                  onChangeText={value => updateField('capacity', value)}
                  onBlur={() => markTouched('capacity')}
                  placeholder={t('vehicleCapacityPlaceholder')}
                  hasError={shouldShowFieldError('capacity')}
                />
                <AppFieldMessage
                  message={
                    shouldShowFieldError('capacity')
                      ? validationErrors.capacity
                      : null
                  }
                />
              </View>
            </View>
          </View>
        ) : null}

        {currentStepDefinition.key === 'driver' ? (
          <View style={styles.stack}>
            <AppInput
              value={draft.driverName}
              onChangeText={value => updateField('driverName', value)}
              onBlur={() => markTouched('driverName')}
              placeholder={t('vehicleDriverNamePlaceholder')}
              hasError={shouldShowFieldError('driverName')}
            />
            <AppFieldMessage
              message={
                shouldShowFieldError('driverName')
                  ? validationErrors.driverName
                  : null
              }
            />
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
              placeholder={t('vehicleDriverEmailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              hasError={shouldShowFieldError('email')}
            />
            <AppFieldMessage
              message={shouldShowFieldError('email') ? validationErrors.email : null}
            />
            <AppInput
              value={draft.driverLicenseNumber}
              onChangeText={value => updateField('driverLicenseNumber', value)}
              onBlur={() => markTouched('driverLicenseNumber')}
              placeholder={t('vehicleDriverLicensePlaceholder')}
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
        ) : null}

        {currentStepDefinition.key === 'review' ? (
          <View style={styles.stack}>
            <View
              style={[
                styles.reviewCard,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.reviewRow}>
                <AppText style={[styles.reviewLabel, { color: palette.muted }]}>
                  {t('vehicleReviewVehicleLabel')}
                </AppText>
                <AppText style={[styles.reviewValue, { color: palette.text }]}>
                  {draft.name || t('commonNotEntered')}
                </AppText>
              </View>
              <View style={styles.reviewRow}>
                <AppText style={[styles.reviewLabel, { color: palette.muted }]}>
                  {t('vehicleReviewVehicleNumberLabel')}
                </AppText>
                <AppText style={[styles.reviewValue, { color: palette.text }]}>
                  {draft.vehicleNumber || t('commonNotEntered')}
                </AppText>
              </View>
              <View style={styles.reviewRow}>
                <AppText style={[styles.reviewLabel, { color: palette.muted }]}>
                  {t('vehicleReviewCapacityLabel')}
                </AppText>
                <AppText style={[styles.reviewValue, { color: palette.text }]}>
                  {draft.capacity || t('commonNotEntered')}
                </AppText>
              </View>
              <View style={styles.reviewRow}>
                <AppText style={[styles.reviewLabel, { color: palette.muted }]}>
                  {t('vehicleReviewDriverLabel')}
                </AppText>
                <AppText style={[styles.reviewValue, { color: palette.text }]}>
                  {draft.driverName || t('commonNotEntered')}
                </AppText>
              </View>
              <View style={styles.reviewRow}>
                <AppText style={[styles.reviewLabel, { color: palette.muted }]}>
                  {t('vehicleReviewDriverContactLabel')}
                </AppText>
                <AppText style={[styles.reviewValue, { color: palette.text }]}>
                  {[draft.phone, draft.email].filter(Boolean).join(' • ') ||
                    t('commonNotEntered')}
                </AppText>
              </View>
            </View>

            <View
              style={[
                styles.locationSummaryCard,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.accentSoftBorder,
                },
              ]}
            >
              <AppText style={[styles.locationSummaryLabel, { color: palette.accentStrong }]}>
                {t('vehicleLocationTitle')}
              </AppText>
              <AppText style={[styles.locationSummaryValue, { color: palette.text }]}>
                {t('vehicleLocationSupplierDefaultTitle')}
              </AppText>
              <AppText style={[styles.locationSummaryHint, { color: palette.muted }]}>
                {t('vehicleLocationSupplierDefaultHint')}
              </AppText>
              <AppText style={[styles.locationCoordinates, { color: palette.accentStrong }]}>
                {supplierLocationLabel}
              </AppText>
            </View>

            <AppText style={[styles.noteText, { color: palette.muted }]}>
              {isEditMode
                ? t('vehicleEditReviewNote')
                : t('vehicleAddReviewNote')}
            </AppText>

            <AppFieldMessage
              message={
                didAttemptSubmit && hasValidationErrors
                  ? t('vehicleFormFixErrors')
                  : submitErrorMessage
              }
            />
          </View>
        ) : null}
      </VehicleSectionCard>

      <View style={styles.footerActions}>
        {currentStep > 0 ? (
          <AppButton
            title={t('commonPrevious')}
            onPress={() => setCurrentStep(current => Math.max(0, current - 1))}
            disabled={isSubmitting}
            style={styles.secondaryAction}
            textStyle={{ color: palette.accentStrong }}
            leftIconName="back"
          />
        ) : (
          <View style={styles.actionSpacer} />
        )}

        {currentStep < steps.length - 1 ? (
          <AppButton
            title={t('commonNext')}
            onPress={handleNextStep}
            disabled={isSubmitting}
            style={styles.primaryAction}
            textStyle={styles.primaryActionText}
            rightIconName="chevron"
          />
        ) : (
          <AppButton
            title={
              isEditMode ? t('vehicleSaveChangesButton') : t('vehicleAddSubmitButton')
            }
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.primaryAction}
            textStyle={styles.primaryActionText}
            leftIconName={isEditMode ? 'save' : 'check'}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
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
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  stepChip: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 54,
    minWidth: 92,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  stack: {
    gap: 12,
  },
  doubleFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  doubleFieldCell: {
    flex: 1,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  reviewLabel: {
    flex: 1,
    fontSize: 13,
  },
  reviewValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  locationSummaryCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  locationSummaryLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  locationSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  locationSummaryHint: {
    fontSize: 13,
    lineHeight: 20,
  },
  locationCoordinates: {
    fontSize: 13,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 21,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 18,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
    borderRadius: 18,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  actionSpacer: {
    flex: 1,
  },
});
