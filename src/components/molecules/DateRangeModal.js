import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { FONTS } from '../../utils';

const DATE_RANGE_OPTIONS = [
  'Today',
  'This Week',
  'Last Week',
  'This Month',
  'Last Month',
  'This Year',
];

/**
 * DateRangeModal - Modal component for selecting date range
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when modal should be closed
 * @param {Function} props.onSelect - Function to call when a date range is selected
 * @param {string} props.selectedValue - Currently selected date range value
 * @returns {JSX.Element} DateRangeModal component
 */
export const DateRangeModal = ({
  visible,
  onClose,
  onSelect,
  selectedValue,
}) => {
  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.headerText}>Select Time Period</Text>
              </View>
              <View style={styles.optionsContainer}>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      selectedValue === option && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedValue === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F9F9F9',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    fontFamily: FONTS.anton,
  },
  optionsContainer: {
    padding: 8,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
  },
  optionSelected: {
    backgroundColor: '#E6F7FF',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: FONTS.anton,
  },
  optionTextSelected: {
    color: '#007AFF',
  },
});
