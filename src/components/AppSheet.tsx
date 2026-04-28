import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useAppPalette } from '../hooks/useAppPalette';

interface AppSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  bottomInset?: number;
  children: React.ReactNode;
}

export function AppSheet({
  visible,
  title,
  subtitle,
  onClose,
  bottomInset = 26,
  children,
}: AppSheetProps) {
  const palette = useAppPalette();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              paddingBottom: bottomInset,
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: palette.accentSoft,
                borderColor: palette.accentSoftBorder,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <AppIcon name="close" size={18} color={palette.accentStrong} />
          </Pressable>

          <AppText style={[styles.title, { color: palette.text }]}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={[styles.subtitle, { color: palette.muted }]}>
              {subtitle}
            </AppText>
          ) : null}

          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 6, 23, 0.28)',
  },
  backdrop: {
    flex: 1,
  },
  card: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingTop: 28,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: -22,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  content: {
    gap: 12,
  },
});
