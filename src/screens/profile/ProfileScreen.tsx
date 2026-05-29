import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppButton, AppIcon, AppRefreshScrollView, AppText } from '../../components';
import {
  ProfileActionRow,
  ProfileCard,
  ProfileDetailRow,
  ProfileHeroCard,
  ProfilePreferenceCard,
} from '../../components/profile';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';
import SupplierApi from '../../service/supplierApi';

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
  onOpenAddresses: () => void;
  onOpenOrders: () => void;
  onOpenReviews: () => void;
  onOpenFavourites: () => void;
  onOpenDiscounts: () => void;
  onOpenImages: () => void;
  onOpenVehicles: () => void;
  onOpenProducts: () => void;
  onRequestLogout: () => void;
}

type ProfileStepKey = 'overview' | 'operations' | 'resources' | 'account';

interface ProfileStepDefinition {
  key: ProfileStepKey;
  icon: string;
  label: string;
  title: string;
  subtitle: string;
}

function unwrapApiData<T>(response: T | { data?: T } | null | undefined): T | null {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: T }).data ?? null;
  }

  return (response as T) ?? null;
}

function formatDateLabel(value?: string) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCoordinateLabel(lat?: string, lng?: string) {
  if (!lat || !lng) {
    return '—';
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return '—';
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
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
  onOpenAddresses,
  onOpenOrders,
  onOpenReviews,
  onOpenFavourites,
  onOpenDiscounts,
  onOpenImages,
  onOpenVehicles,
  onOpenProducts,
  onRequestLogout,
}: ProfileScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();

  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo<ProfileStepDefinition[]>(
    () => [
      {
        key: 'overview',
        icon: 'dashboard',
        label: 'Overview',
        title: 'Business overview',
        subtitle:
          'See the supplier identity, compliance details, and primary dispatch address in one place.',
      },
      {
        key: 'operations',
        icon: 'route',
        label: 'Ops',
        title: 'Operations and fleet',
        subtitle:
          'Jump into day-to-day controls for business settings, vehicles, products, and alerts.',
      },
      {
        key: 'resources',
        icon: 'package',
        label: 'Resources',
        title: 'Orders and resources',
        subtitle:
          'Navigate quickly to addresses, orders, reviews, favourites, discounts, and media.',
      },
      {
        key: 'account',
        icon: 'user',
        label: 'Account',
        title: 'Account and preferences',
        subtitle:
          'Manage payouts, support, language, theme, and logout actions from one section.',
      },
    ],
    [],
  );

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await SupplierApi.getSupplierProfile();
      const nextProfile = unwrapApiData<SupplierProfile>(response);
      setProfile(nextProfile);
      if (!nextProfile) {
        setError('No profile data available');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const openSupportCall = () => {
    const supportNumber = profile?.phone || t('profilePhoneValue');
    const cleanedNumber = supportNumber.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const retryFetchProfile = loadProfile;
  const currentStepDefinition = steps[currentStep];

  const profileAddress = [
    profile?.address_line_1,
    profile?.address_line_2,
    profile?.city,
    profile?.state,
    profile?.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
  const profileCoverage = [profile?.city, profile?.state, profile?.country]
    .filter(Boolean)
    .join(', ');
  const profileCoordinates = formatCoordinateLabel(profile?.lat, profile?.lng);
  const profileUpdatedAt = formatDateLabel(profile?.updated_at);
  const profileCreatedAt = formatDateLabel(profile?.created_at);

  const renderStepChip = (step: ProfileStepDefinition, index: number) => {
    const isActive = currentStep === index;
    const isComplete = currentStep > index;

    return (
      <Pressable
        key={step.key}
        onPress={() => setCurrentStep(index)}
        style={[
          styles.stepChip,
          {
            backgroundColor: isActive ? palette.accentSoft : palette.surface,
            borderColor:
              isActive || isComplete ? palette.accentSoftBorder : palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View
          style={[
            styles.stepIconBadge,
            {
              backgroundColor:
                isActive || isComplete ? palette.accentSoft : palette.surfaceSoft,
              borderColor:
                isActive || isComplete ? palette.accentSoftBorder : palette.border,
            },
          ]}
        >
          <AppIcon
            name={step.icon}
            size={14}
            color={
              isActive || isComplete ? palette.accentStrong : palette.muted
            }
          />
        </View>
        <AppText
          style={[
            styles.stepLabel,
            {
              color:
                isActive || isComplete ? palette.accentStrong : palette.muted,
            },
          ]}
          numberOfLines={1}
        >
          {step.label}
        </AppText>
      </Pressable>
    );
  };

  const renderCurrentStepContent = () => {
    if (!profile) {
      return null;
    }

    switch (currentStepDefinition.key) {
      case 'overview':
        return (
          <ProfileCard
            title={currentStepDefinition.title}
            subtitle={currentStepDefinition.subtitle}
          >
            <View style={styles.stack}>
              <ProfileDetailRow
                icon="document"
                label={t('profileGstinLabel')}
                value={profile.gstin || '—'}
              />
              <ProfileDetailRow
                icon="document"
                label="CIN"
                value={profile.cin || '—'}
              />
              <ProfileDetailRow
                icon="mail"
                label={t('profileEmailLabel')}
                value={profile.email || '—'}
              />
              <ProfileDetailRow
                icon="phone"
                label={t('profilePhoneLabel')}
                value={profile.phone || '—'}
              />
              <ProfileDetailRow
                icon="location"
                label={t('profileAddressLabel')}
                value={profileAddress || '—'}
              />
              <ProfileDetailRow
                icon="route"
                label="Supplier location"
                value={profileCoordinates}
              />
              <ProfileDetailRow
                icon="clock"
                label="Last updated"
                value={profileUpdatedAt}
              />
              <ProfileActionRow
                icon="building"
                title={t('profileBusinessAction')}
                description={t('profileBusinessActionDescription')}
                onPress={onOpenBusinessSheet}
              />
              <AppButton
                title={t('profileSupportButton')}
                onPress={openSupportCall}
                variant="primary"
                style={styles.supportButton}
              />
            </View>
          </ProfileCard>
        );

      case 'operations':
        return (
          <ProfileCard
            title={currentStepDefinition.title}
            subtitle={currentStepDefinition.subtitle}
          >
            <View style={styles.stack}>
              <ProfileDetailRow
                icon="location"
                label={t('profileCoverageLabel')}
                value={profileCoverage || '—'}
              />
              <ProfileDetailRow
                icon="clock"
                label={t('profileHoursLabel')}
                value={t('profileHoursValue')}
              />
              <ProfileDetailRow
                icon="shield"
                label="Verification status"
                value={profile.verified ? t('profileVerifiedBadge') : 'Pending verification'}
              />
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
        );

      case 'resources':
        return (
          <ProfileCard
            title={currentStepDefinition.title}
            subtitle={currentStepDefinition.subtitle}
          >
            <View style={styles.stack}>
              <ProfileActionRow
                icon="location"
                title={t('supplierResourcesAddressesTitle')}
                description={t('profileAddressesDescription')}
                onPress={onOpenAddresses}
              />
              <ProfileActionRow
                icon="package"
                title={t('supplierResourcesOrdersTitle')}
                description={t('profileOrdersDescription')}
                onPress={onOpenOrders}
              />
              <ProfileActionRow
                icon="star"
                title={t('supplierResourcesReviewsTitle')}
                description={t('profileReviewsDescription')}
                onPress={onOpenReviews}
              />
              <ProfileActionRow
                icon="heart"
                title={t('supplierResourcesFavouritesTitle')}
                description={t('profileFavouritesDescription')}
                onPress={onOpenFavourites}
              />
              <ProfileActionRow
                icon="money"
                title={t('supplierResourcesDiscountsTitle')}
                description={t('profileDiscountsDescription')}
                onPress={onOpenDiscounts}
              />
              <ProfileActionRow
                icon="image"
                title={t('supplierResourcesImagesTitle')}
                description={t('profileImagesDescription')}
                onPress={onOpenImages}
              />
            </View>
          </ProfileCard>
        );

      case 'account':
      default:
        return (
          <>
            <ProfileCard
              title={currentStepDefinition.title}
              subtitle={currentStepDefinition.subtitle}
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
                <ProfileDetailRow
                  icon="clock"
                  label={t('profileSinceLabel')}
                  value={profileCreatedAt}
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
                variant="danger"
                style={styles.logoutButton}
                textStyle={styles.logoutButtonText}
              />
            </ProfileCard>
          </>
        );
    }
  };

  if (loading) {
    return (
      <AppRefreshScrollView
        onRefresh={loadProfile}
        contentContainerStyle={styles.stateContainer}
      >
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View
            style={[
              styles.stateIconWrap,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
          >
            <AppIcon name="profile" size={22} color={palette.accentStrong} />
          </View>
          <AppText style={[styles.stateTitle, { color: palette.text }]}>
            {t('profileHeading')}
          </AppText>
          <AppText style={[styles.stateBody, { color: palette.muted }]}>
            Loading profile...
          </AppText>
        </View>
      </AppRefreshScrollView>
    );
  }

  if (error) {
    return (
      <AppRefreshScrollView
        onRefresh={loadProfile}
        contentContainerStyle={styles.stateContainer}
      >
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View
            style={[
              styles.stateIconWrap,
              styles.errorStateIconWrap,
            ]}
          >
            <AppIcon name="info" size={22} color="#DC2626" />
          </View>
          <AppText style={[styles.stateTitle, { color: palette.text }]}>
            {t('profileHeading')}
          </AppText>
          <AppText style={[styles.stateBody, { color: palette.muted }]}>
            {error}
          </AppText>
          <AppButton
            title="Retry"
            onPress={retryFetchProfile}
            variant="primary"
            style={styles.retryButton}
          />
        </View>
      </AppRefreshScrollView>
    );
  }

  if (!profile) {
    return (
      <AppRefreshScrollView
        onRefresh={loadProfile}
        contentContainerStyle={styles.stateContainer}
      >
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <AppText style={[styles.stateTitle, { color: palette.text }]}>
            {t('profileHeading')}
          </AppText>
          <AppText style={[styles.stateBody, { color: palette.muted }]}>
            No profile data available
          </AppText>
          <AppButton
            title="Retry"
            onPress={retryFetchProfile}
            variant="primary"
            style={styles.retryButton}
          />
        </View>
      </AppRefreshScrollView>
    );
  }

  return (
    <AppRefreshScrollView
      onRefresh={loadProfile}
      contentContainerStyle={styles.contentContainer}
    >
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
        badgeSecondary={
          profile.created_at
            ? `${t('profileSinceLabel')}: ${new Date(profile.created_at).getFullYear()}`
            : ''
        }
        metrics={[
          {
            icon: 'star',
            label: t('profileRatingLabel'),
            value: profile.ratings ? `${profile.ratings}/5` : '—',
          },
          { icon: 'shield', label: t('profileCompletionLabel'), value: '97%' },
          {
            icon: 'clock',
            label: 'Updated',
            value: profileUpdatedAt,
          },
        ]}
      />

      <View style={styles.stepRow}>{steps.map(renderStepChip)}</View>

      {renderCurrentStepContent()}

      <View style={styles.footerActions}>
        {currentStep > 0 ? (
          <AppButton
            title="Previous"
            onPress={() => setCurrentStep(step => Math.max(0, step - 1))}
            style={styles.secondaryAction}
            textStyle={{ color: palette.accentStrong }}
          />
        ) : (
          <View style={styles.actionSpacer} />
        )}

        {currentStep < steps.length - 1 ? (
          <AppButton
            title="Next"
            onPress={() =>
              setCurrentStep(step => Math.min(steps.length - 1, step + 1))
            }
            style={styles.primaryAction}
            textStyle={styles.primaryActionText}
          />
        ) : (
          <AppButton
            title="Back to overview"
            onPress={() => setCurrentStep(0)}
            style={styles.primaryAction}
            textStyle={styles.primaryActionText}
          />
        )}
      </View>
    </AppRefreshScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 170,
  },
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
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stepChip: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
  },
  supportButton: {
    borderRadius: 18,
  },
  supportButtonText: {
    fontWeight: '800',
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
    borderRadius: 18,
  },
  logoutButtonText: {
    fontWeight: '800',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stateCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 5,
  },
  stateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorStateIconWrap: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  retryButton: {
    minWidth: 140,
  },
});
