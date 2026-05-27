import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
  onBack: () => void;
  onSubmit: (draft: NewProductDraft) => void | Promise<void>;
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;
}

type ProductField = keyof NewProductDraft;

function isPositiveNumber(value: string) {
  return Number(value) > 0;
}

function isNonNegativeWholeNumber(value: string) {
  return /^\d+$/.test(value.trim());
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
  onBack,
  onSubmit,
  isSubmitting = false,
  submitErrorMessage = null,
}: AddProductScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [draft, setDraft] = useState<NewProductDraft>({
    name: '',
    sku: '',
    category: '',
    type: '',
    unitLabel: '',
    price: '',
    godownInventory: '',
    demand: '',
    reorderLevel: '',
    description: '',
  });
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<ProductField, boolean>>
  >({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);

  const validationErrors = useMemo(
    () => getProductValidationErrors(draft),
    [draft],
  );
  const hasValidationErrors = useMemo(
    () => Object.values(validationErrors).some(Boolean),
    [validationErrors],
  );

  const updateField = (field: keyof NewProductDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const markTouched = (field: ProductField) => {
    setTouchedFields(current => ({ ...current, [field]: true }));
  };

  const shouldShowFieldError = (field: ProductField) =>
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
      <AppBackButton onPress={onBack} label={t('productAddBackButton')} />

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
          {t('productAddTitle')}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {t('productAddSubtitle')}
        </AppText>
      </View>

      <VehicleSectionCard
        title={t('productAddBasicTitle')}
        subtitle={t('productAddBasicSubtitle')}
      >
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
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('productAddInventoryTitle')}
        subtitle={t('productAddInventorySubtitle')}
      >
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
      </VehicleSectionCard>

      <VehicleSectionCard
        title={t('productAddDescriptionTitle')}
        subtitle={t('productAddDescriptionSubtitle')}
      >
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
          <AppFieldMessage
            message={
              didAttemptSubmit && hasValidationErrors
                ? 'Please fix the highlighted fields before creating this product.'
                : submitErrorMessage
            }
          />
          <AppButton
            title={t('productAddSubmitButton')}
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
  },
  stack: {
    gap: 12,
  },
  descriptionInput: {
    minHeight: 110,
    textAlignVertical: 'top',
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
