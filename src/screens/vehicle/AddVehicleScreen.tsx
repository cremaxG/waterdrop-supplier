import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, AppIcon, AppInput, AppText } from '../../components';
import { VehicleSectionCard } from '../../components/vehicles';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';

export interface NewVehicleDraft {
  vehicleNumber: string;
  name: string;
  phone: string;
  email: string;
}

interface AddVehicleScreenProps {
  onBack: () => void;
  onSubmit: (draft: NewVehicleDraft) => void;
}

export function AddVehicleScreen({
  onBack,
  onSubmit,
}: AddVehicleScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [draft, setDraft] = useState<NewVehicleDraft>({
    vehicleNumber: '',
    name: '',
    phone: '',
    email: '',
  });

  const isValid = useMemo(
    () =>
      [
        draft.vehicleNumber,
        draft.name,
        draft.phone,
        draft.email,
      ].every(value => value.trim().length > 0) &&
      draft.phone.replace(/\D/g, '').length >= 10,
    [draft],
  );

  const updateField = (field: keyof NewVehicleDraft, value: string) => {
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
            placeholder={t('vehicleAddNumberPlaceholder')}
          />
          <AppInput
            value={draft.name}
            onChangeText={value => updateField('name', value)}
            placeholder={t('vehicleAddNamePlaceholder')}
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
            placeholder={t('vehicleAddPhonePlaceholder')}
            keyboardType="phone-pad"
          />
          <AppInput
            value={draft.email}
            onChangeText={value => updateField('email', value)}
            placeholder={t('vehicleAddEmailPlaceholder')}
            keyboardType="email-address"
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
          <AppButton
            title={t('vehicleAddSubmitButton')}
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
