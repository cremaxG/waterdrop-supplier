import React, { useEffect, useState } from 'react';
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
import BaseApi from '../../service/baseApi';

interface SupplierProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  cin: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;
  lat: string;
  lng: string;
  status: string;
  online: boolean;
  ratings: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

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

  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await BaseApi.get('/suppliers/profile');
        setProfile(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const openSupportCall = () => {
    const supportNumber = profile?.phone || t('profilePhoneValue');
    const cleanedNumber = supportNumber.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const retryFetchProfile = () => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await BaseApi.get('/suppliers/profile');
        setProfile(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: palette.background },
        ]}
      >
        <AppText style={[styles.loadingText, { color: palette.text }]}>
          Loading profile...
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: palette.background }]}
      >
        <AppText style={[styles.errorText, { color: palette.text }]}>
          {error}
        </AppText>
        <AppButton
          title="Retry"
          onPress={retryFetchProfile}
          style={styles.retryButton}
        />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: palette.background }]}
      >
        <AppText style={[styles.errorText, { color: palette.text }]}>
          No profile data available
        </AppText>
        <AppButton
          title="Retry"
          onPress={retryFetchProfile}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <>
      <AppText style={[styles.sectionTitle, { color: palette.text }]}>
        {t('profileHeading')}
      </AppText>
      <AppText style={[styles.sectionSubtitle, { color: palette.muted }]}>
        {t('profileSubtitle')}
      </AppText>

      <ProfileHeroCard
        title={profile.name}
        subtitle={t('profileBusinessType')}
        status={
          profile.online ? t('profileOnlineLabel') : t('profileOfflineLabel')
        }
        badgePrimary={profile.verified ? t('profileVerifiedBadge') : ''}
        badgeSecondary={`${t('profileSinceLabel')}: ${new Date(
          profile.created_at,
        ).getFullYear()}`}
        metrics={[
          {
            icon: 'star',
            label: t('profileRatingLabel'),
            value: `${profile.ratings}/5`,
          },
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
            value={profile.phone}
          />
          <ProfileDetailRow
            icon="location"
            label={t('profileCoverageLabel')}
            value={`${profile.city}, ${profile.state}, ${profile.country}`}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
});
