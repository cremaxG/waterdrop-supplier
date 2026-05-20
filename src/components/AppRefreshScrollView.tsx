import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppPalette } from '../hooks/useAppPalette';

interface AppRefreshScrollViewProps extends Omit<ScrollViewProps, 'refreshControl'> {
  onRefresh?: () => Promise<void> | void;
  refreshEnabled?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function AppRefreshScrollView({
  children,
  onRefresh,
  refreshEnabled = true,
  contentContainerStyle,
  ...rest
}: AppRefreshScrollViewProps) {
  const insets = useSafeAreaInsets();
  const palette = useAppPalette();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.contentContainer,
        {
          backgroundColor: palette.background,
          paddingBottom: Math.max(insets.bottom + 110, 130),
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          enabled={refreshEnabled && Boolean(onRefresh)}
          tintColor={palette.accent}
          colors={[palette.accent]}
          progressBackgroundColor={palette.surface}
        />
      }
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
});
