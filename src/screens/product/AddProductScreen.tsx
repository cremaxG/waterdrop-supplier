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

export interface NewProductDraft {
  name: string;
  sku: string;
  category: string;
  type: string;
  unitLabel: string;
  price: string;
  godownInventory: string;
  demand: string;
  reorderLevel: string;
  description: string;
}

interface AddProductScreenProps {
  mode?: 'create' | 'edit';
  onBack: () => void;
  onSubmit: (draft: NewProductDraft) => void | Promise<void>;
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;
  initialDraft?: Partial<NewProductDraft> | null;
  onOpenActionMenu?: (() => void) | null;
}

type ProductField = keyof NewProductDraft;
type ProductStepKey = 'basic' | 'inventory' | 'review';

interface ProductStepDefinition {
  key: ProductStepKey;
  label: string;
  title: string;
  subtitle: string;
  fields: ProductField[];
}

function isPositiveNumber(value: string) {
  return Number(value) > 0;
}

function isNonNegativeWholeNumber(value: string) {
  return /^\d+$/.test(value.trim());
}

function buildInitialDraft(initialDraft?: Partial<NewProductDraft> | null): NewProductDraft {
  return {
    name: initialDraft?.name ?? '',
    sku: initialDraft?.sku ?? '',
    category: initialDraft?.category ?? '',
    type: initialDraft?.type ?? '',
    unitLabel: initialDraft?.unitLabel ?? '',
    price: initialDraft?.price ?? '',
    godownInventory: initialDraft?.godownInventory ?? '',
    demand: initialDraft?.demand ?? '',
    reorderLevel: initialDraft?.reorderLevel ?? '',
    description: initialDraft?.description ?? '',
  };
}

function getProductValidationErrors(draft: NewProductDraft) {
  return {
    name: !draft.name.trim() ? 'Product name is required.' : '',
    sku: !draft.sku.trim() ? 'SKU or internal code is required.' : '',
    category: !draft.category.trim() ? 'Category is required.' : '',
    type: !draft.type.trim() ? 'Product type is required.' : '',
    unitLabel: !draft.unitLabel.trim() ? 'Unit label is required.' : '',
    price: !draft.price.trim()
      ? 'Price per unit is required.'
      : !isPositiveNumber(draft.price.trim())
        ? 'Enter a valid price greater than 0.'
        : '',
    godownInventory: !draft.godownInventory.trim()
      ? 'Godown inventory is required.'
      : !isNonNegativeWholeNumber(draft.godownInventory)
        ? 'Enter a valid whole number for godown inventory.'
        : '',
    demand: !draft.demand.trim() ? 'Demand indicator is required.' : '',
    reorderLevel: !draft.reorderLevel.trim()
      ? 'Reorder level is required.'
      : !isNonNegativeWholeNumber(draft.reorderLevel)
        ? 'Enter a valid whole number for reorder level.'
        : '',
    description: !draft.description.trim()
      ? 'Product description is required.'
      : draft.description.trim().length < 10
        ? 'Enter a more descriptive product summary.'
        : '',
  } satisfies Record<ProductField, string>;
}

export function AddProductScreen({
  mode = 'create',
  onBack,
  onSubmit,
  isSubmitting = false,
  submitErrorMessage = null,
  initialDraft = null,
  onOpenActionMenu = null,
}: AddProductScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [draft, setDraft] = useState<NewProductDraft>(() =>
    buildInitialDraft(initialDraft),
  );
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<ProductField, boolean>>
  >({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setDraft(buildInitialDraft(initialDraft));
    setTouchedFields({});
    setDidAttemptSubmit(false);
    setCurrentStep(0);
  }, [initialDraft, mode]);

  const validationErrors = useMemo(() => getProductValidationErrors(draft), [draft]);
  const hasValidationErrors = useMemo(
    () => Object.values(validationErrors).some(Boolean),
    [validationErrors],
  );
  const isEditMode = mode === 'edit';
  const steps = useMemo<ProductStepDefinition[]>(
    () => [
      {
        key: 'basic',
        label: 'Product',
        title: t('productAddBasicTitle'),
        subtitle: t('productAddBasicSubtitle'),
        fields: ['name', 'sku', 'category', 'type', 'unitLabel', 'price'],
      },
      {
        key: 'inventory',
        label: 'Inventory',
        title: t('productAddInventoryTitle'),
        subtitle: t('productAddInventorySubtitle'),
        fields: ['godownInventory', 'reorderLevel', 'demand'],
      },
      {
        key: 'review',
        label: 'Review',
        title: isEditMode ? 'Review product updates' : t('productAddDescriptionTitle'),
        subtitle: isEditMode
          ? 'Check the updated product information before saving.'
          : t('productAddDescriptionSubtitle'),
        fields: ['description'],
      },
    ],
    [isEditMode, t],
  );
  const currentStepDefinition = steps[currentStep];

  const updateField = (field: keyof NewProductDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const markTouched = (field: ProductField) => {
    setTouchedFields(current => ({ ...current, [field]: true }));
  };

  const markStepTouched = (fields: ProductField[]) => {
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

  const shouldShowFieldError = (field: ProductField) =>
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

  const renderStepChip = (step: ProductStepDefinition, index: number) => {
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

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBar}>
        <AppBackButton onPress={onBack} label={t('productAddBackButton')} />
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
          {isEditMode ? 'Edit product' : t('productAddTitle')}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {isEditMode
            ? 'Update product identity, stock details, and review information step by step.'
            : t('productAddSubtitle')}
        </AppText>
      </View>

      <View style={styles.stepRow}>{steps.map(renderStepChip)}</View>

      <VehicleSectionCard
        title={currentStepDefinition.title}
        subtitle={currentStepDefinition.subtitle}
      >
        {currentStepDefinition.key === 'basic' ? (
          <View style={styles.stack}>
            <AppInput
              value={draft.name}
              onChangeText={value => updateField('name', value)}
              onBlur={() => markTouched('name')}
              placeholder={t('productAddNamePlaceholder')}
              hasError={shouldShowFieldError('name')}
            />
            <AppFieldMessage
              message={shouldShowFieldError('name') ? validationErrors.name : null}
            />
            <AppInput
              value={draft.sku}
              onChangeText={value => updateField('sku', value)}
              onBlur={() => markTouched('sku')}
              placeholder={t('productAddSkuPlaceholder')}
              hasError={shouldShowFieldError('sku')}
            />
            <AppFieldMessage
              message={shouldShowFieldError('sku') ? validationErrors.sku : null}
            />
            <View style={styles.doubleFieldRow}>
              <View style={styles.doubleFieldCell}>
                <AppInput
                  value={draft.category}
                  onChangeText={value => updateField('category', value)}
                  onBlur={() => markTouched('category')}
                  placeholder={t('productAddCategoryPlaceholder')}
                  hasError={shouldShowFieldError('category')}
                />
                <AppFieldMessage
                  message={
                    shouldShowFieldError('category') ? validationErrors.category : null
                  }
                />
              </View>
              <View style={styles.doubleFieldCell}>
                <AppInput
                  value={draft.type}
                  onChangeText={value => updateField('type', value)}
                  onBlur={() => markTouched('type')}
                  placeholder={t('productAddTypePlaceholder')}
                  hasError={shouldShowFieldError('type')}
                />
                <AppFieldMessage
                  message={shouldShowFieldError('type') ? validationErrors.type : null}
                />
              </View>
            </View>
            <View style={styles.doubleFieldRow}>
              <View style={styles.doubleFieldCell}>
                <AppInput
                  value={draft.price}
                  onChangeText={value => updateField('price', value)}
                  onBlur={() => markTouched('price')}
                  placeholder={t('productAddPricePlaceholder')}
                  keyboardType="decimal-pad"
                  hasError={shouldShowFieldError('price')}
                />
                <AppFieldMessage
                  message={shouldShowFieldError('price') ? validationErrors.price : null}
                />
              </View>
              <View style={styles.doubleFieldCell}>
                <AppInput
                  value={draft.unitLabel}
                  onChangeText={value => updateField('unitLabel', value)}
                  onBlur={() => markTouched('unitLabel')}
                  placeholder={t('productAddUnitPlaceholder')}
                  hasError={shouldShowFieldError('unitLabel')}
                />
                <AppFieldMessage
                  message={
                    shouldShowFieldError('unitLabel') ? validationErrors.unitLabel : null
                  }
                />
              </View>
            </View>
          </View>
        ) : null}

        {currentStepDefinition.key === 'inventory' ? (
          <View style={styles.stack}>
            <AppInput
              value={draft.godownInventory}
              onChangeText={value => updateField('godownInventory', value)}
              onBlur={() => markTouched('godownInventory')}
              placeholder={t('productAddGodownPlaceholder')}
              keyboardType="number-pad"
              hasError={shouldShowFieldError('godownInventory')}
            />
            <AppFieldMessage
              message={
                shouldShowFieldError('godownInventory')
                  ? validationErrors.godownInventory
                  : null
              }
            />
            <AppInput
              value={draft.reorderLevel}
              onChangeText={value => updateField('reorderLevel', value)}
              onBlur={() => markTouched('reorderLevel')}
              placeholder={t('productAddReorderPlaceholder')}
              keyboardType="number-pad"
              hasError={shouldShowFieldError('reorderLevel')}
            />
            <AppFieldMessage
              message={
                shouldShowFieldError('reorderLevel')
                  ? validationErrors.reorderLevel
                  : null
              }
            />
            <AppInput
              value={draft.demand}
              onChangeText={value => updateField('demand', value)}
              onBlur={() => markTouched('demand')}
              placeholder={t('productAddDemandPlaceholder')}
              hasError={shouldShowFieldError('demand')}
            />
            <AppFieldMessage
              message={shouldShowFieldError('demand') ? validationErrors.demand : null}
            />
          </View>
        ) : null}

        {currentStepDefinition.key === 'review' ? (
          <View style={styles.stack}>
            <AppInput
              value={draft.description}
              onChangeText={value => updateField('description', value)}
              onBlur={() => markTouched('description')}
              placeholder={t('productAddDescriptionPlaceholder')}
              multiline
              style={styles.descriptionInput}
              hasError={shouldShowFieldError('description')}
            />
            <AppFieldMessage
              message={
                shouldShowFieldError('description')
                  ? validationErrors.description
                  : null
              }
            />
            <View
              style={[
                styles.reviewCard,
                {
                  backgroundColor: palette.surfaceSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              {[
                ['Product', draft.name || 'Not entered'],
                ['SKU', draft.sku || 'Not entered'],
                ['Category', draft.category || 'Not entered'],
                ['Type', draft.type || 'Not entered'],
                ['Price', draft.price || 'Not entered'],
                ['Godown stock', draft.godownInventory || 'Not entered'],
                ['Reorder level', draft.reorderLevel || 'Not entered'],
              ].map(([label, value]) => (
                <View key={label} style={styles.reviewRow}>
                  <AppText style={[styles.reviewLabel, { color: palette.muted }]}>
                    {label}
                  </AppText>
                  <AppText style={[styles.reviewValue, { color: palette.text }]}>
                    {value}
                  </AppText>
                </View>
              ))}
            </View>
            <AppFieldMessage
              message={
                didAttemptSubmit && hasValidationErrors
                  ? `Please fix the highlighted fields before ${
                      isEditMode ? 'saving' : 'creating'
                    } this product.`
                  : submitErrorMessage
              }
            />
          </View>
        ) : null}
      </VehicleSectionCard>

      <View style={styles.footerActions}>
        {currentStep > 0 ? (
          <AppButton
            title="Previous"
            onPress={() => setCurrentStep(current => Math.max(0, current - 1))}
            disabled={isSubmitting}
            style={styles.secondaryAction}
            textStyle={{ color: palette.accentStrong }}
          />
        ) : (
          <View style={styles.actionSpacer} />
        )}
        {currentStep < steps.length - 1 ? (
          <AppButton
            title="Next"
            onPress={handleNextStep}
            disabled={isSubmitting}
            style={styles.primaryAction}
            textStyle={styles.primaryActionText}
          />
        ) : (
          <AppButton
            title={isEditMode ? 'Save product changes' : t('productAddSubmitButton')}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.primaryAction}
            textStyle={styles.primaryActionText}
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
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
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
