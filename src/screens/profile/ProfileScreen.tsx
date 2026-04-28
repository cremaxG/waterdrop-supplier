import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppButton, AppText } from '../../components';
import {
  ProfileActionRow,
  ProfileCard,
  ProfileDetailRow,
  ProfileHeroCard,
  ProfilePreferenceCard,
} from '../../components/profile';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';

interface ProfileScreenProps {
  currentThemeLabel: string;
  currentLanguageLabel: string;
  onOpenThemeSheet: () => void;
  onOpenLanguageSheet: () => void;
  onOpenAboutSheet: () => void;
  onOpenBusinessSheet: () => void;
  onOpenPayoutSheet: () => void;
  onOpenDocumentsSheet: () => void;
  onOpenSupportSheet: () => void;
  onOpenAlertsSheet: () => void;
  onOpenVehicles: () => void;
  onOpenProducts: () => void;
  onRequestLogout: () => void;
}

export function ProfileScreen({
  currentThemeLabel,
  currentLanguageLabel,
  onOpenThemeSheet,
  onOpenLanguageSheet,
  onOpenAboutSheet,
  onOpenBusinessSheet,
  onOpenPayoutSheet,
  onOpenDocumentsSheet,
  onOpenSupportSheet,
  onOpenAlertsSheet,
  onOpenVehicles,
  onOpenProducts,
  onRequestLogout,
}: ProfileScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();

  const openSupportCall = () => {
    const supportNumber = t('profilePhoneValue').replace(/\s+/g, '');
    Linking.openURL(`tel:${supportNumber}`);
  };

  return (
    <>
      <AppText style={[styles.sectionTitle, { color: palette.text }]}>
        {t('profileHeading')}
      </AppText>
      <AppText style={[styles.sectionSubtitle, { color: palette.muted }]}>
        {t('profileSubtitle')}
      </AppText>

      <ProfileHeroCard
        title={t('profileBusinessName')}
        subtitle={t('profileBusinessType')}
        status={t('profileOnlineLabel')}
        badgePrimary={t('profileVerifiedBadge')}
        badgeSecondary={`${t('profileSinceLabel')}: ${t('profileSinceValue')}`}
        metrics={[
          { icon: 'star', label: t('profileRatingLabel'), value: '4.8/5' },
          { icon: 'shield', label: t('profileCompletionLabel'), value: '97%' },
          { icon: 'clock', label: t('profileResponseLabel'), value: '3 min' },
        ]}
      />

      <ProfileCard
        title={t('profileOperationsTitle')}
        subtitle={t('profileOperationsSubtitle')}
      >
        <View style={styles.stack}>
          <ProfileDetailRow
            icon="phone"
            label={t('profilePhoneLabel')}
            value={t('profilePhoneValue')}
          />
          <ProfileDetailRow
            icon="location"
            label={t('profileCoverageLabel')}
            value={t('profileCoverageValue')}
          />
          <ProfileDetailRow
            icon="clock"
            label={t('profileHoursLabel')}
            value={t('profileHoursValue')}
          />
          <ProfileActionRow
            icon="building"
            title={t('profileBusinessAction')}
            description={t('profileBusinessActionDescription')}
            onPress={onOpenBusinessSheet}
          />
        </View>
      </ProfileCard>

      <ProfileCard
        title={t('profileQuickActionsTitle')}
        subtitle={t('profileQuickActionsSubtitle')}
      >
        <View style={styles.stack}>
          <ProfileActionRow
            icon="vehicles"
            title={t('profileQuickActionVehicles')}
            description={t('profileQuickActionVehiclesDescription')}
            onPress={onOpenVehicles}
          />
          <ProfileActionRow
            icon="products"
            title={t('profileQuickActionProducts')}
            description={t('profileQuickActionProductsDescription')}
            onPress={onOpenProducts}
          />
          <ProfileActionRow
            icon="document"
            title={t('profileQuickActionDocs')}
            description={t('profileQuickActionDocsDescription')}
            onPress={onOpenDocumentsSheet}
          />
          <ProfileActionRow
            icon="bell"
            title={t('profileNotificationsAction')}
            description={t('profileNotificationsDescription')}
            onPress={onOpenAlertsSheet}
          />
        </View>
      </ProfileCard>

      <ProfileCard
        title={t('profileAccountTitle')}
        subtitle={t('profileAccountSubtitle')}
      >
        <View style={styles.stack}>
          <ProfileActionRow
            icon="info"
            title={t('profileAboutUsAction')}
            description={t('profileAboutUsDescription')}
            onPress={onOpenAboutSheet}
          />
          <ProfileActionRow
            icon="money"
            title={t('profilePayoutAction')}
            description={t('profilePayoutDescription')}
            onPress={onOpenPayoutSheet}
          />
          <ProfileActionRow
            icon="support"
            title={t('profileSupportAction')}
            description={t('profileSupportActionDescription')}
            onPress={onOpenSupportSheet}
          />
          <AppButton
            title={t('profileCallSupportButton')}
            onPress={openSupportCall}
            style={[
              styles.supportButton,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
            textStyle={[
              styles.supportButtonText,
              { color: palette.accentStrong },
            ]}
          />
        </View>
      </ProfileCard>

      <ProfilePreferenceCard
        icon="theme"
        title={t('themeSectionTitle')}
        currentLabel={t('preferenceCurrentLabel')}
        currentValue={currentThemeLabel}
        onPress={onOpenThemeSheet}
      />

      <ProfilePreferenceCard
        icon="language"
        title={t('languageSectionTitle')}
        currentLabel={t('preferenceCurrentLabel')}
        currentValue={currentLanguageLabel}
        onPress={onOpenLanguageSheet}
      />

      <ProfileCard>
        <AppText style={[styles.logoutTitle, { color: palette.text }]}>
          {t('profileLogoutTitle')}
        </AppText>
        <AppText style={[styles.logoutSubtitle, { color: palette.muted }]}>
          {t('profileLogoutSubtitle')}
        </AppText>
        <AppButton
          title={t('logoutButton')}
          onPress={onRequestLogout}
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        />
      </ProfileCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 18,
  },
  stack: {
    gap: 12,
  },
  supportButton: {
    borderRadius: 18,
  },
  supportButtonText: {
    fontWeight: '800',
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  logoutSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
    borderRadius: 18,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
