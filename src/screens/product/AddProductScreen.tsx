import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppButton, AppIcon, AppInput, AppText } from '../../components';
import { VehicleSectionCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';

export interface NewProductDraft {
  name: string;
  sku: string;
  category: string;
  unitLabel: string;
  godownInventory: string;
  demand: string;
  reorderLevel: string;
  description: string;
}

interface AddProductScreenProps {
  onBack: () => void;
  onSubmit: (draft: NewProductDraft) => void;
}

export function AddProductScreen({
  onBack,
  onSubmit,
}: AddProductScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [draft, setDraft] = useState<NewProductDraft>({
    name: '',
    sku: '',
    category: '',
    unitLabel: '',
    godownInventory: '',
    demand: '',
    reorderLevel: '',
    description: '',
  });

  const isValid = useMemo(
    () =>
      Object.values(draft).every(value => value.trim().length > 0) &&
      Number(draft.godownInventory) >= 0 &&
      Number(draft.reorderLevel) >= 0,
    [draft],
  );

  const updateField = (field: keyof NewProductDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} style={styles.backRow}>
        <AppIcon name="back" size={18} color={palette.accentStrong} />
        <AppText style={[styles.backText, { color: palette.accentStrong }]}>
          {t('productAddBackButton')}
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
            placeholder={t('productAddNamePlaceholder')}
          />
          <AppInput
            value={draft.sku}
            onChangeText={value => updateField('sku', value)}
            placeholder={t('productAddSkuPlaceholder')}
          />
          <AppInput
            value={draft.category}
            onChangeText={value => updateField('category', value)}
            placeholder={t('productAddCategoryPlaceholder')}
          />
          <AppInput
            value={draft.unitLabel}
            onChangeText={value => updateField('unitLabel', value)}
            placeholder={t('productAddUnitPlaceholder')}
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
            placeholder={t('productAddGodownPlaceholder')}
            keyboardType="number-pad"
          />
          <AppInput
            value={draft.reorderLevel}
            onChangeText={value => updateField('reorderLevel', value)}
            placeholder={t('productAddReorderPlaceholder')}
            keyboardType="number-pad"
          />
          <AppInput
            value={draft.demand}
            onChangeText={value => updateField('demand', value)}
            placeholder={t('productAddDemandPlaceholder')}
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
            placeholder={t('productAddDescriptionPlaceholder')}
            multiline
            style={styles.descriptionInput}
          />
          <AppButton
            title={t('productAddSubmitButton')}
            onPress={() => onSubmit(draft)}
            disabled={!isValid}
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
