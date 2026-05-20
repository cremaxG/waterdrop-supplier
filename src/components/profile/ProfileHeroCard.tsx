import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { useAppPalette } from '../../hooks/useAppPalette';

interface ProfileMetric {
  icon: string;
  label: string;
  value: string;
}

interface ProfileHeroCardProps {
  title: string;
  subtitle: string;
  status: string;
  badgePrimary: string;
  badgeSecondary: string;
  metrics: ProfileMetric[];
}

export function ProfileHeroCard({
  title,
  subtitle,
  status,
  badgePrimary,
  badgeSecondary,
  metrics,
}: ProfileHeroCardProps) {
  const palette = useAppPalette();
  const badges = [badgePrimary, badgeSecondary].filter(Boolean);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppIcon name="water" size={26} color={palette.accentStrong} />
        </View>
        <View style={styles.copy}>
          <AppText style={[styles.title, { color: palette.text }]}>
            {title}
          </AppText>
          <AppText style={[styles.subtitle, { color: palette.muted }]}>
            {subtitle}
          </AppText>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.accentSoftBorder,
            },
          ]}
        >
          <AppText style={[styles.statusText, { color: palette.accentStrong }]}>
            {status}
          </AppText>
        </View>
      </View>

      <View style={styles.badgeRow}>
        {badges.map(badge => (
          <View
            key={badge}
            style={[
              styles.badge,
              {
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.border,
              },
            ]}
          >
            <AppText style={[styles.badgeText, { color: palette.text }]}>
              {badge}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.metricRow}>
        {metrics.map(metric => (
          <View
            key={metric.label}
            style={[
              styles.metricCard,
              {
                backgroundColor: palette.surfaceSoft,
                borderColor: palette.border,
              },
            ]}
          >
            <AppIcon
              name={metric.icon}
              size={16}
              color={palette.accentStrong}
            />
            <AppText style={[styles.metricValue, { color: palette.text }]}>
              {metric.value}
            </AppText>
            <AppText style={[styles.metricLabel, { color: palette.muted }]}>
              {metric.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 17,
  },
});
