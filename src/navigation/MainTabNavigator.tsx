import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppIcon, AppSheet, AppText } from '../components';
import { ProfileDetailRow } from '../components/profile';
import { useAppPalette } from '../hooks/useAppPalette';
import { useTheme, useTranslation } from '../providers/AppProviders';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProductsScreen } from '../screens/product/ProductsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import {
  AppLaunchRequest,
  getProfileResourceForLaunchAction,
  getTabForLaunchAction,
  SupplierResourceKey,
  SupplierResourceScreen,
} from '../screens/profile/SupplierResourceScreen';
import { VehiclesScreen } from '../screens/vehicle/VehiclesScreen';
import { ThemePreference } from '../theme';
import { AppTabKey } from './types';

type ActiveSheet =
  | 'theme'
  | 'language'
  | 'about'
  | 'business'
  | 'payout'
  | 'documents'
  | 'support'
  | 'alerts'
  | 'logout'
  | null;

interface MainTabNavigatorProps {
  launchRequest?: AppLaunchRequest | null;
  onLogout?: () => void;
}

export function MainTabNavigator({
  launchRequest = null,
  onLogout = () => undefined,
}: MainTabNavigatorProps) {
  const { theme, themePreference, setThemePreference } = useTheme();
  const { t, language, setLanguage, availableLanguages } = useTranslation();
  const palette = useAppPalette();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppTabKey>('dashboard');
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [isVehicleDetailsVisible, setVehicleDetailsVisible] = useState(false);
  const [isProductDetailsVisible, setProductDetailsVisible] = useState(false);
  const [activeProfileResource, setActiveProfileResource] =
    useState<SupplierResourceKey | null>(null);
  const [vehicleLaunchToken, setVehicleLaunchToken] = useState<number | null>(null);
  const [productLaunchToken, setProductLaunchToken] = useState<number | null>(null);
  const lastHandledLaunchIdRef = useRef<number | null>(null);

  const tabs = useMemo(
    () => [
      { key: 'dashboard' as const, icon: 'dashboard', label: t('dashboardTab') },
      { key: 'vehicles' as const, icon: 'vehicles', label: t('vehiclesTab') },
      { key: 'products' as const, icon: 'products', label: t('productsTab') },
      { key: 'profile' as const, icon: 'profile', label: t('profileTab') },
    ],
    [t],
  );

  const themeOptions = useMemo(
    () => [
      { key: 'system' as const, label: t('themeOptionSystem') },
      { key: 'light' as const, label: t('themeOptionLight') },
      { key: 'dark' as const, label: t('themeOptionDark') },
    ],
    [t],
  );

  const currentThemeLabel = useMemo(() => {
    const match = themeOptions.find(option => option.key === themePreference);
    return match?.label ?? t('themeOptionSystem');
  }, [themeOptions, themePreference, t]);

  const currentLanguageLabel = availableLanguages[language];

  const openTab = (tab: AppTabKey) => {
    setVehicleDetailsVisible(false);
    setProductDetailsVisible(false);
    if (tab !== 'profile') {
      setActiveProfileResource(null);
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!launchRequest || lastHandledLaunchIdRef.current === launchRequest.id) {
      return;
    }

    lastHandledLaunchIdRef.current = launchRequest.id;

    const nextTab = getTabForLaunchAction(launchRequest.action);
    const nextProfileResource = getProfileResourceForLaunchAction(
      launchRequest.action,
    );

    setVehicleDetailsVisible(false);
    setProductDetailsVisible(false);
    setActiveTab(nextTab);
    setActiveProfileResource(nextProfileResource);

    if (launchRequest.action === 'addVehicle') {
      setVehicleLaunchToken(launchRequest.id);
    }

    if (launchRequest.action === 'addProduct') {
      setProductLaunchToken(launchRequest.id);
    }
  }, [launchRequest]);

  const closeSheet = () => {
    setActiveSheet(null);
  };

  const handleLogout = () => {
    closeSheet();
    onLogout();
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'vehicles':
        return (
          <VehiclesScreen
            externalAddRequestToken={vehicleLaunchToken}
            onDetailVisibilityChange={setVehicleDetailsVisible}
          />
        );
      case 'products':
        return (
          <ProductsScreen
            externalAddRequestToken={productLaunchToken}
            onDetailVisibilityChange={setProductDetailsVisible}
          />
        );
      case 'profile':
        if (activeProfileResource) {
          return (
            <SupplierResourceScreen
              resourceKey={activeProfileResource}
              onBack={() => setActiveProfileResource(null)}
            />
          );
        }

        return (
          <ProfileScreen
            currentThemeLabel={currentThemeLabel}
            currentLanguageLabel={currentLanguageLabel}
            onOpenThemeSheet={() => setActiveSheet('theme')}
            onOpenLanguageSheet={() => setActiveSheet('language')}
            onOpenAboutSheet={() => setActiveSheet('about')}
            onOpenBusinessSheet={() => setActiveSheet('business')}
            onOpenPayoutSheet={() => setActiveSheet('payout')}
            onOpenDocumentsSheet={() => setActiveSheet('documents')}
            onOpenSupportSheet={() => setActiveSheet('support')}
            onOpenAlertsSheet={() => setActiveSheet('alerts')}
            onOpenAddresses={() => setActiveProfileResource('addresses')}
            onOpenOrders={() => setActiveProfileResource('orders')}
            onOpenReviews={() => setActiveProfileResource('reviews')}
            onOpenFavourites={() => setActiveProfileResource('favourites')}
            onOpenDiscounts={() => setActiveProfileResource('discounts')}
            onOpenImages={() => setActiveProfileResource('images')}
            onOpenVehicles={() => openTab('vehicles')}
            onOpenProducts={() => openTab('products')}
            onRequestLogout={() => setActiveSheet('logout')}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardScreen
            onOpenVehicles={() => openTab('vehicles')}
            onOpenProducts={() => openTab('products')}
            onOpenProfile={() => openTab('profile')}
          />
        );
    }
  };

  const renderSheetBody = () => {
    if (activeSheet === 'theme') {
      return (
        <View style={styles.sheetOptions}>
          {themeOptions.map(option => {
            const isSelected = option.key === themePreference;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  setThemePreference(option.key as ThemePreference);
                  closeSheet();
                }}
                style={[
                  styles.sheetOption,
                  {
                    backgroundColor: isSelected
                      ? palette.accentSoft
                      : palette.surfaceSoft,
                    borderColor: isSelected ? palette.accent : palette.border,
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.sheetOptionTitle,
                    {
                      color: isSelected ? palette.accentStrong : palette.text,
                    },
                  ]}
                >
                  {option.label}
                </AppText>
                {isSelected ? (
                  <View
                    style={[
                      styles.selectedDot,
                      { backgroundColor: palette.accent },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (activeSheet === 'language') {
      return (
        <View style={styles.sheetOptions}>
          {Object.entries(availableLanguages).map(([code, label]) => {
            const isSelected = code === language;
            return (
              <Pressable
                key={code}
                onPress={() => {
                  setLanguage(code as typeof language);
                  closeSheet();
                }}
                style={[
                  styles.sheetOption,
                  {
                    backgroundColor: isSelected
                      ? palette.accentSoft
                      : palette.surfaceSoft,
                    borderColor: isSelected ? palette.accent : palette.border,
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.sheetOptionTitle,
                    {
                      color: isSelected ? palette.accentStrong : palette.text,
                    },
                  ]}
                >
                  {label}
                </AppText>
                {isSelected ? (
                  <View
                    style={[
                      styles.selectedDot,
                      { backgroundColor: palette.accent },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (activeSheet === 'about') {
      return (
        <>
          <View
            style={[
              styles.sheetInfoCard,
              {
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.border,
              },
            ]}
          >
            <AppText style={[styles.infoCardTitle, { color: palette.text }]}>
              {t('profileAboutMissionTitle')}
            </AppText>
            <AppText style={[styles.infoCardBody, { color: palette.muted }]}>
              {t('profileAboutMissionBody')}
            </AppText>
          </View>
          <ProfileDetailRow
            icon="location"
            label={t('profileAboutCoverageLabel')}
            value={t('profileAboutCoverageValue')}
          />
          <ProfileDetailRow
            icon="vehicles"
            label={t('profileAboutFleetLabel')}
            value={t('profileAboutFleetValue')}
          />
          <ProfileDetailRow
            icon="products"
            label={t('profileAboutProductsLabel')}
            value={t('profileAboutProductsValue')}
          />
        </>
      );
    }

    if (activeSheet === 'business') {
      return (
        <>
          <ProfileDetailRow
            icon="building"
            label={t('profileBusinessSheetTypeLabel')}
            value={t('profileBusinessType')}
          />
          <ProfileDetailRow
            icon="location"
            label={t('profileBusinessSheetHubLabel')}
            value={t('profileBusinessSheetHubValue')}
          />
          <ProfileDetailRow
            icon="vehicles"
            label={t('profileBusinessSheetFleetLabel')}
            value={t('profileBusinessSheetFleetValue')}
          />
          <ProfileDetailRow
            icon="dashboard"
            label={t('profileBusinessSheetCapacityLabel')}
            value={t('profileBusinessSheetCapacityValue')}
          />
        </>
      );
    }

    if (activeSheet === 'payout') {
      return (
        <>
          <ProfileDetailRow
            icon="money"
            label={t('profileSettlementLabel')}
            value={t('profileSettlementValue')}
          />
          <ProfileDetailRow
            icon="wallet"
            label={t('profileBankLabel')}
            value={t('profileBankValue')}
          />
          <ProfileDetailRow
            icon="mail"
            label={t('profilePayoutEmailLabel')}
            value={t('profilePayoutEmailValue')}
          />
          <ProfileDetailRow
            icon="document"
            label={t('profileComplianceLabel')}
            value={t('profileComplianceValue')}
          />
        </>
      );
    }

    if (activeSheet === 'documents') {
      return (
        <>
          <ProfileDetailRow
            icon="document"
            label={t('profileDocumentGstLabel')}
            value={t('profileDocumentGstValue')}
          />
          <ProfileDetailRow
            icon="shield"
            label={t('profileDocumentFssaiLabel')}
            value={t('profileDocumentFssaiValue')}
          />
          <ProfileDetailRow
            icon="vehicles"
            label={t('profileDocumentPermitLabel')}
            value={t('profileDocumentPermitValue')}
          />
          <ProfileDetailRow
            icon="bell"
            label={t('profileDocumentInsuranceLabel')}
            value={t('profileDocumentInsuranceValue')}
          />
        </>
      );
    }

    if (activeSheet === 'support') {
      return (
        <>
          <ProfileDetailRow
            icon="phone"
            label={t('profileHelpLabel')}
            value={t('profileHelpValue')}
          />
          <ProfileDetailRow
            icon="mail"
            label={t('profileSupportMailLabel')}
            value={t('profileSupportMailValue')}
          />
          <ProfileDetailRow
            icon="clock"
            label={t('profileSupportEscalationLabel')}
            value={t('profileSupportEscalationValue')}
          />
          <ProfileDetailRow
            icon="shield"
            label={t('profileTrainingLabel')}
            value={t('profileTrainingValue')}
          />
        </>
      );
    }

    if (activeSheet === 'alerts') {
      return (
        <>
          <ProfileDetailRow
            icon="bell"
            label={t('profileAlertsLabel')}
            value={t('profileAlertsValue')}
          />
          <ProfileDetailRow
            icon="language"
            label={t('profileAlertsChannelLabel')}
            value={t('profileAlertsChannelValue')}
          />
          <ProfileDetailRow
            icon="clock"
            label={t('profileAlertsResponseLabel')}
            value={t('profileAlertsResponseValue')}
          />
          <ProfileDetailRow
            icon="support"
            label={t('profileAlertsEscalationLabel')}
            value={t('profileAlertsEscalationValue')}
          />
        </>
      );
    }

    if (activeSheet === 'logout') {
      return (
        <View
          style={[
            styles.sheetInfoCard,
            {
              backgroundColor: palette.surfaceSoft,
              borderColor: palette.border,
            },
          ]}
        >
          <AppText style={[styles.infoCardBody, { color: palette.muted }]}>
            {t('logoutSheetBody')}
          </AppText>
          <View style={styles.logoutActionRow}>
            <AppButton
              title={t('cancelButton')}
              onPress={closeSheet}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
              textStyle={{ color: palette.text }}
            />
            <AppButton
              title={t('logoutButton')}
              onPress={handleLogout}
              style={styles.primaryLogoutButton}
              textStyle={styles.primaryLogoutButtonText}
            />
          </View>
        </View>
      );
    }

    return null;
  };

  const sheetTitle =
    activeSheet === 'theme'
      ? t('themeSheetTitle')
      : activeSheet === 'language'
        ? t('languageSheetTitle')
        : activeSheet === 'about'
          ? t('profileAboutSheetTitle')
          : activeSheet === 'business'
            ? t('profileBusinessSheetTitle')
            : activeSheet === 'payout'
              ? t('profilePayoutSheetTitle')
              : activeSheet === 'documents'
                ? t('profileDocumentsSheetTitle')
                : activeSheet === 'support'
                  ? t('profileSupportSheetTitle')
                  : activeSheet === 'alerts'
                    ? t('profileAlertsSheetTitle')
                    : activeSheet === 'logout'
                      ? t('logoutSheetTitle')
                      : '';

  const sheetSubtitle =
    activeSheet === 'theme'
      ? t('themeSheetSubtitle')
      : activeSheet === 'language'
        ? t('languageSheetSubtitle')
        : activeSheet === 'about'
          ? t('profileAboutSheetSubtitle')
          : activeSheet === 'business'
            ? t('profileBusinessSheetSubtitle')
            : activeSheet === 'payout'
              ? t('profilePayoutSheetSubtitle')
              : activeSheet === 'documents'
                ? t('profileDocumentsSheetSubtitle')
                : activeSheet === 'support'
                  ? t('profileSupportSheetSubtitle')
                  : activeSheet === 'alerts'
                    ? t('profileAlertsSheetSubtitle')
                    : activeSheet === 'logout'
                      ? t('logoutSheetSubtitle')
                      : '';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar barStyle={theme.statusBarStyle} />
      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View
          style={[
            styles.backgroundBubble,
            styles.backgroundBubbleTop,
            { backgroundColor: palette.heroTop },
          ]}
        />
        <View
          style={[
            styles.backgroundBubble,
            styles.backgroundBubbleBottom,
            { backgroundColor: palette.heroBottom },
          ]}
        />
      </View>

      <View
        style={[
          styles.contentArea,
          {
            backgroundColor: palette.background,
          },
        ]}
      >
        {renderActiveTab()}
      </View>

      {!isVehicleDetailsVisible && !isProductDetailsVisible ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.bottomBarWrap,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            {tabs.map(tab => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabButton,
                    isActive && {
                      backgroundColor: palette.accentSoft,
                      borderColor: palette.accentSoftBorder,
                    },
                  ]}
                >
                  <AppIcon
                    name={tab.icon}
                    size={20}
                    color={isActive ? palette.accentStrong : palette.muted}
                  />
                  <AppText
                    style={[
                      styles.tabLabel,
                      { color: isActive ? palette.accentStrong : palette.muted },
                    ]}
                  >
                    {tab.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <AppSheet
        visible={activeSheet !== null}
        onClose={closeSheet}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        bottomInset={Math.max(insets.bottom + 18, 26)}
      >
        {renderSheetBody()}
      </AppSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  backgroundDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  backgroundBubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  backgroundBubbleTop: {
    width: 260,
    height: 260,
    top: -90,
    right: -70,
  },
  backgroundBubbleBottom: {
    width: 220,
    height: 220,
    bottom: 120,
    left: -90,
  },
  bottomBarWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  bottomBar: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetOptions: {
    gap: 12,
  },
  sheetOption: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sheetInfoCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoCardBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  logoutActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
  },
  primaryLogoutButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  primaryLogoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
