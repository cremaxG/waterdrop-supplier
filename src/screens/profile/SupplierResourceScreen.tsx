import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppButton,
  AppIcon,
  AppImage,
  AppRefreshScrollView,
  AppText,
} from '../../components';
import { useAppPalette } from '../../hooks/useAppPalette';
import { useTranslation } from '../../providers/AppProviders';
import SupplierApi, { SupplierProfile } from '../../service/supplierApi';

export type SupplierResourceKey =
  | 'addresses'
  | 'orders'
  | 'reviews'
  | 'discounts'
  | 'images';

interface SupplierResourceScreenProps {
  resourceKey: SupplierResourceKey;
  onBack: () => void;
}

function unwrapApiData<T>(response: T | { data?: T } | null | undefined): T | null {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: T }).data ?? null;
  }
  return (response as T) ?? null;
}

function unwrapSupplierProfile(response: any): SupplierProfile | null {
  const unwrapped = unwrapApiData<any>(response);
  return (unwrapped?.supplier ?? unwrapped?.profile ?? unwrapped) as SupplierProfile | null;
}

function extractCollection(response: any, key?: string) {
  const candidates = [
    response,
    response?.data,
    key ? response?.[key] : null,
    key ? response?.data?.[key] : null,
    response?.items,
    response?.results,
    response?.rows,
    response?.data?.items,
    response?.data?.results,
    response?.data?.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function formatDate(value?: string) {
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

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(value: any) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value ?? '—');
  }

  return `₹${numeric.toLocaleString('en-IN')}`;
}

function pickImageUrl(item: any) {
  return item.url ?? item.image_url ?? item.imageUrl ?? item.file_url ?? item.path ?? '';
}

function getResourceMeta(resourceKey: SupplierResourceKey, t: (key: string) => string) {
  switch (resourceKey) {
    case 'addresses':
      return {
        title: t('supplierResourcesAddressesTitle'),
        subtitle: t('supplierResourcesAddressesSubtitle'),
        icon: 'location',
      };
    case 'orders':
      return {
        title: t('supplierResourcesOrdersTitle'),
        subtitle: t('supplierResourcesOrdersSubtitle'),
        icon: 'package',
      };
    case 'reviews':
      return {
        title: t('supplierResourcesReviewsTitle'),
        subtitle: t('supplierResourcesReviewsSubtitle'),
        icon: 'star',
      };
    case 'discounts':
      return {
        title: t('supplierResourcesDiscountsTitle'),
        subtitle: t('supplierResourcesDiscountsSubtitle'),
        icon: 'money',
      };
    case 'images':
    default:
      return {
        title: t('supplierResourcesImagesTitle'),
        subtitle: t('supplierResourcesImagesSubtitle'),
        icon: 'image',
      };
  }
}

export function SupplierResourceScreen({
  resourceKey,
  onBack,
}: SupplierResourceScreenProps) {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resourceMeta = useMemo(
    () => getResourceMeta(resourceKey, t),
    [resourceKey, t],
  );

  const loadResource = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profileResponse = await SupplierApi.getSupplierProfile();
      const nextProfile = unwrapSupplierProfile(profileResponse);
      setProfile(nextProfile);

      if (!nextProfile?.id) {
        throw new Error(t('supplierResourcesProfileMissing'));
      }

      if (resourceKey === 'addresses') {
        setItems([nextProfile]);
        return;
      }

      const response =
        resourceKey === 'orders'
          ? await SupplierApi.listSupplierOrderProducts(nextProfile.id)
          : resourceKey === 'reviews'
            ? await SupplierApi.listSupplierReviews(nextProfile.id)
            : resourceKey === 'discounts'
              ? await SupplierApi.listSupplierDiscounts(nextProfile.id, { limit: 20 })
              : await SupplierApi.listSupplierImages(nextProfile.id, { limit: 20 });

      const collection = extractCollection(response, resourceKey);
      setItems(collection);
    } catch (nextError: any) {
      setItems([]);
      setError(nextError?.message || t('supplierResourcesLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [resourceKey, t]);

  useEffect(() => {
    loadResource();
  }, [loadResource]);

  const renderAddressCard = (item: SupplierProfile) => {
    const addressLines = [
      item.address_line_1,
      item.address_line_2,
      item.city,
      item.state,
      item.postal_code,
      item.country,
    ].filter(Boolean);

    return (
      <View
        key="supplier-address"
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View>
            <AppText style={[styles.cardTitle, { color: palette.text }]}>
              {item.name || t('supplierResourcesAddressFallback')}
            </AppText>
            <AppText style={[styles.cardMeta, { color: palette.muted }]}>
              {t('supplierResourcesAddressRegistered')}
            </AppText>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
          >
            <AppText style={[styles.badgeText, { color: palette.accentStrong }]}>
              {t('supplierResourcesPrimaryLabel')}
            </AppText>
          </View>
        </View>

        <AppText style={[styles.cardBody, { color: palette.text }]}>
          {addressLines.join(', ') || '—'}
        </AppText>

        <View style={styles.metaList}>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {t('profilePhoneLabel')}: {item.phone || '—'}
          </AppText>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {t('profileEmailLabel')}: {item.email || '—'}
          </AppText>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {t('supplierResourcesCoordinatesLabel')}: {item.lat || '—'}, {item.lng || '—'}
          </AppText>
        </View>
      </View>
    );
  };

  const renderOrderCard = (item: any, index: number) => {
    const title =
      item.product_name ??
      item.name ??
      item.title ??
      `${t('supplierResourcesOrderLabel')} #${item.id ?? index + 1}`;
    const quantity = item.qty ?? item.quantity ?? item.units ?? item.ordered_qty;
    const amount = item.total_price ?? item.amount ?? item.price;
    const secondary = item.order_status ?? item.status ?? item.category ?? item.brand;
    const timestamp = item.created_at ?? item.updated_at ?? item.ordered_at;

    return (
      <View
        key={String(item.id ?? `${title}-${index}`)}
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <AppText style={[styles.cardTitle, { color: palette.text }]}>
              {title}
            </AppText>
            <AppText style={[styles.cardMeta, { color: palette.muted }]}>
              {secondary || t('supplierResourcesOrderHistoryLabel')}
            </AppText>
          </View>
          <AppText style={[styles.cardValue, { color: palette.text }]}>
            {amount ? formatCurrency(amount) : quantity ?? '—'}
          </AppText>
        </View>

        <View style={styles.metaList}>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {t('supplierResourcesQuantityLabel')}: {quantity ?? '—'}
          </AppText>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {t('supplierResourcesUpdatedLabel')}: {formatDateTime(timestamp)}
          </AppText>
        </View>
      </View>
    );
  };

  const renderReviewCard = (item: any, index: number) => {
    return (
      <View
        key={String(item.id ?? `review-${index}`)}
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <AppText style={[styles.cardTitle, { color: palette.text }]}>
              {t('supplierResourcesReviewLabel')} #{item.id ?? index + 1}
            </AppText>
            <AppText style={[styles.cardMeta, { color: palette.muted }]}>
              {t('supplierResourcesUserLabel')}: {item.user_id ?? '—'}
            </AppText>
          </View>
          <View
            style={[
              styles.ratingBadge,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
              },
            ]}
          >
            <AppIcon name="star" size={14} color={palette.accentStrong} />
            <AppText style={[styles.ratingText, { color: palette.accentStrong }]}>
              {item.ratings ?? '—'}/5
            </AppText>
          </View>
        </View>

        <AppText style={[styles.cardBody, { color: palette.text }]}>
          {item.comment || '—'}
        </AppText>
        <AppText style={[styles.metaListText, { color: palette.muted }]}>
          {t('supplierResourcesUpdatedLabel')}: {formatDate(item.updated_at ?? item.created_at)}
        </AppText>
      </View>
    );
  };

  const renderDiscountCard = (item: any, index: number) => {
    const isActive = Boolean(item.active);
    const valueText =
      item.type === 'percentage'
        ? `${item.value ?? 0}%`
        : item.value !== undefined
          ? formatCurrency(item.value)
          : '—';

    return (
      <View
        key={String(item.id ?? `discount-${index}`)}
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <AppText style={[styles.cardTitle, { color: palette.text }]}>
              {item.title || t('supplierResourcesDiscountFallback')}
            </AppText>
            <AppText style={[styles.cardMeta, { color: palette.muted }]}>
              {item.type || t('supplierResourcesDiscountTypeLabel')}
            </AppText>
          </View>
          <View
            style={[
              styles.badge,
              isActive ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <AppText
              style={[
                styles.badgeText,
                isActive ? styles.activeBadgeText : styles.inactiveBadgeText,
              ]}
            >
              {isActive ? t('supplierResourcesActiveLabel') : t('supplierResourcesInactiveLabel')}
            </AppText>
          </View>
        </View>

        <AppText style={[styles.cardValueLarge, { color: palette.text }]}>
          {valueText}
        </AppText>
        <AppText style={[styles.cardBody, { color: palette.muted }]}>
          {item.description || t('supplierResourcesNoDescription')}
        </AppText>

        <View style={styles.metaList}>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {t('supplierResourcesMinimumLabel')}: {item.min_amount ? formatCurrency(item.min_amount) : '—'}
          </AppText>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {t('supplierResourcesDurationLabel')}: {formatDate(item.start_date)} - {formatDate(item.end_date)}
          </AppText>
        </View>
      </View>
    );
  };

  const renderImageCard = (item: any, index: number) => {
    const imageUrl = pickImageUrl(item);

    return (
      <View
        key={String(item.id ?? `image-${index}`)}
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        {imageUrl ? (
          <AppImage
            source={{ uri: imageUrl }}
            altTextKey="imageLabel"
            containerStyle={styles.imageWrap}
          />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              {
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.border,
              },
            ]}
          >
            <AppIcon name="image" size={26} color={palette.accentStrong} />
            <AppText style={[styles.imagePlaceholderText, { color: palette.muted }]}>
              {t('supplierResourcesImageUnavailable')}
            </AppText>
          </View>
        )}

        <View style={styles.imageMetaBlock}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <AppText style={[styles.cardTitle, { color: palette.text }]}>
                {item.type || t('supplierResourcesImagesTitle')}
              </AppText>
              <AppText style={[styles.cardMeta, { color: palette.muted }]}>
                {t('supplierResourcesUpdatedLabel')}: {formatDate(item.updated_at ?? item.created_at)}
              </AppText>
            </View>
          </View>
          <AppText style={[styles.metaListText, { color: palette.muted }]}>
            {imageUrl || '—'}
          </AppText>
        </View>
      </View>
    );
  };

  const summaryCount = resourceKey === 'addresses' ? Number(Boolean(profile)) : items.length;
  const activeDiscountsCount =
    resourceKey === 'discounts'
      ? items.filter(item => Boolean(item.active)).length
      : 0;
  const imageTypesCount =
    resourceKey === 'images'
      ? new Set(items.map(item => item.type).filter(Boolean)).size
      : 0;

  const renderCards = () => {
    if (resourceKey === 'addresses') {
      return profile ? renderAddressCard(profile) : null;
    }

    if (resourceKey === 'orders') {
      return items.map(renderOrderCard);
    }

    if (resourceKey === 'reviews') {
      return items.map(renderReviewCard);
    }

    if (resourceKey === 'discounts') {
      return items.map(renderDiscountCard);
    }

    return items.map(renderImageCard);
  };

  return (
    <AppRefreshScrollView onRefresh={loadResource}>
      <Pressable hitSlop={12} onPress={onBack} style={styles.backRow}>
        <View
          style={[
            styles.backIconWrap,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppIcon name="back" size={18} color={palette.accentStrong} />
        </View>
        <AppText style={[styles.backText, { color: palette.accentStrong }]}>
          {t('supplierResourcesBackButton')}
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
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppIcon name={resourceMeta.icon} size={18} color={palette.accentStrong} />
        </View>
        <AppText style={[styles.heroTitle, { color: palette.text }]}>
          {resourceMeta.title}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: palette.muted }]}>
          {resourceMeta.subtitle}
        </AppText>

        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.border,
              },
            ]}
          >
            <AppText style={[styles.summaryValue, { color: palette.text }]}>
              {summaryCount}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: palette.muted }]}>
              {t('supplierResourcesCountLabel')}
            </AppText>
          </View>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.border,
              },
            ]}
          >
            <AppText style={[styles.summaryValue, { color: palette.text }]}>
              {resourceKey === 'discounts' ? activeDiscountsCount : resourceKey === 'images' ? imageTypesCount : '—'}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: palette.muted }]}>
              {resourceKey === 'discounts'
                ? t('supplierResourcesActiveLabel')
                : resourceKey === 'images'
                  ? t('supplierResourcesTypesLabel')
                  : t('supplierResourcesUpdatedLabel')}
            </AppText>
          </View>
        </View>
      </View>

      {loading ? (
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
            {t('supplierResourcesLoadingLabel')}
          </AppText>
        </View>
      ) : error ? (
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
            {t('supplierResourcesLoadFailed')}
          </AppText>
          <AppText style={[styles.stateBody, { color: palette.muted }]}>
            {error}
          </AppText>
          <AppButton
            title={t('supplierResourcesRetryButton')}
            onPress={loadResource}
            variant="primary"
          />
        </View>
      ) : summaryCount === 0 ? (
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
            {resourceMeta.title}
          </AppText>
          <AppText style={[styles.stateBody, { color: palette.muted }]}>
            {t('supplierResourcesEmptyLabel')}
          </AppText>
        </View>
      ) : (
        <View style={styles.stack}>{renderCards()}</View>
      )}
    </AppRefreshScrollView>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
    gap: 8,
  },
  backIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 5,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 18,
  },
  stack: {
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  cardHeaderCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardValueLarge: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  inactiveBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  activeBadgeText: {
    color: '#059669',
  },
  inactiveBadgeText: {
    color: '#D97706',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaList: {
    gap: 4,
  },
  metaListText: {
    fontSize: 13,
    lineHeight: 19,
  },
  imageWrap: {
    marginBottom: 14,
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  imagePlaceholderText: {
    fontSize: 13,
    marginTop: 10,
  },
  imageMetaBlock: {
    gap: 4,
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    textAlign: 'center',
  },
});
