import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  FlatList,
} from 'react-native';
import { useTheme } from '../providers/AppProviders';
import { AppText } from './AppText';
import { Country, COUNTRIES } from '../constants/countries';

export interface AppCountryPickerProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
}

export function AppCountryPicker({
  selectedCountry,
  onCountrySelect,
  disabled = false,
}: AppCountryPickerProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const renderCountry = ({ item }: { item: Country }) => (
    <Pressable
      onPress={() => {
        onCountrySelect(item);
        setIsOpen(false);
      }}
      style={({ pressed }) => [
        styles.countryItem,
        {
          backgroundColor: pressed ? theme.border : 'transparent',
          borderBottomColor: theme.border,
        },
      ]}
    >
      <AppText style={styles.countryFlag}>{item.flag}</AppText>
      <View style={styles.countryInfo}>
        <AppText style={styles.countryCode}>{item.code}</AppText>
        <AppText style={styles.countryName}>{item.name}</AppText>
      </View>
      <AppText style={styles.dialCode}>{item.dialCode}</AppText>
    </Pressable>
  );

  return (
    <>
      <Pressable
        onPress={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pickerButton,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <AppText style={styles.flag}>{selectedCountry.flag}</AppText>
      </Pressable>

      <Modal visible={isOpen} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.border }]}
            >
              <AppText style={styles.modalTitle}>Select Country</AppText>
              <Pressable onPress={() => setIsOpen(false)}>
                <AppText style={styles.closeButton}>✕</AppText>
              </Pressable>
            </View>
            <FlatList
              data={COUNTRIES}
              renderItem={renderCountry}
              keyExtractor={item => item.code}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    width: 60,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  flag: {
    fontSize: 28,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  countryFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  countryName: {
    fontSize: 12,
    marginTop: 2,
  },
  dialCode: {
    fontSize: 14,
    fontWeight: '500',
  },
});
