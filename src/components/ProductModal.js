import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/theme';

export default function ProductModal({ visible, product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    sku: '',
    category: '',
    costPrice: '',
    price: '',
    profit: '',
    manufactureDate: null,

    // NEW
    validityType: 'none',
    warranty: '',
    expiryDate: null,

    stock: ''
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // NEW
  const [validityDropdownOpen, setValidityDropdownOpen] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  // NEW
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  // Categories
  const categories = [
    'Electronics',
    'Furniture',
    'Food & Beverages',
    'Clothing',
    'Pharmacy',
    'Accessories',
    'Other'
  ];

  // Validity options
  const validityOptions = [
    'None',
    'Warranty',
    'Expiry'
  ];

  useEffect(() => {
    if (product) {
      const initialCost = product.costPrice ?? '';
      const initialSales = product.price ?? '';

      const initialManufactureDate = product.manufactureDate
        ? new Date(product.manufactureDate)
        : null;

      const initialExpiryDate = product.expiryDate
        ? new Date(product.expiryDate)
        : null;

      const costNum = parseFloat(initialCost) || 0;
      const salesNum = parseFloat(initialSales) || 0;

      const calculatedProfit =
        product.profit !== undefined &&
        product.profit !== null &&
        String(product.profit) !== ''
          ? String(product.profit)
          : String((salesNum - costNum).toFixed(2));

      setForm({
        name: product.name || '',
        brand: product.brand || '',
        sku: product.sku || '',
        category: product.category || '',

        costPrice:
          initialCost !== ''
            ? String(initialCost)
            : '',

        price:
          initialSales !== ''
            ? String(initialSales)
            : '',

        profit: calculatedProfit,

        manufactureDate:
          initialManufactureDate &&
          !isNaN(initialManufactureDate.getTime())
            ? initialManufactureDate
            : null,

        // NEW
        validityType: product.validityType || 'none',

        warranty: product.warranty || '',

        // NEW
        expiryDate:
          initialExpiryDate &&
          !isNaN(initialExpiryDate.getTime())
            ? initialExpiryDate
            : null,

        stock:
          product.stock !== undefined &&
          product.stock !== null
            ? String(product.stock)
            : ''
      });
    } else {
      setForm({
        name: '',
        brand: '',
        sku: '',
        category: '',
        costPrice: '',
        price: '',
        profit: '',
        manufactureDate: null,

        // NEW
        validityType: 'none',
        warranty: '',
        expiryDate: null,

        stock: ''
      });
    }

    setDropdownOpen(false);
    setValidityDropdownOpen(false);
    setShowDatePicker(false);
    setShowExpiryDatePicker(false);
  }, [product, visible]);

  const handleCostPriceChange = (text) => {
    const cost = parseFloat(text) || 0;
    const sales = parseFloat(form.price) || 0;

    const computedProfit = (sales - cost).toFixed(2);

    setForm(prev => ({
      ...prev,
      costPrice: text,
      profit: String(computedProfit)
    }));
  };

  const handleSalesPriceChange = (text) => {
    const sales = parseFloat(text) || 0;
    const cost = parseFloat(form.costPrice) || 0;

    const computedProfit = (sales - cost).toFixed(2);

    setForm(prev => ({
      ...prev,
      price: text,
      profit: String(computedProfit)
    }));
  };

  // Manufacture date
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setForm(prev => ({
        ...prev,
        manufactureDate: selectedDate
      }));
    }
  };

  // Expiry date
  const handleExpiryDateChange = (event, selectedDate) => {
    setShowExpiryDatePicker(false);

    if (selectedDate) {
      setForm(prev => ({
        ...prev,
        expiryDate: selectedDate
      }));
    }
  };

  const formatDateString = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Select Date...';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleValidityChange = (type) => {
    let validityType = 'none';

    if (type === 'Warranty') {
      validityType = 'warranty';
    } else if (type === 'Expiry') {
      validityType = 'expiry';
    }

    setForm(prev => ({
      ...prev,
      validityType,

      // Clear irrelevant fields
      warranty:
        validityType === 'warranty'
          ? prev.warranty
          : '',

      expiryDate:
        validityType === 'expiry'
          ? prev.expiryDate
          : null
    }));

    setValidityDropdownOpen(false);

    // Close expiry picker if switching away
    if (validityType !== 'expiry') {
      setShowExpiryDatePicker(false);
    }
  };

  const getValidityLabel = () => {
    if (form.validityType === 'warranty') {
      return 'Warranty';
    }

    if (form.validityType === 'expiry') {
      return 'Expiry';
    }

    return 'None';
  };

  const handleSave = () => {
    if (!form.name || !form.price) {
      Alert.alert(
        'Error',
        'Product Name and Sales Price are required.'
      );
      return;
    }

    if (!form.category) {
      Alert.alert(
        'Error',
        'Please select a category.'
      );
      return;
    }

    // Warranty validation
    if (
      form.validityType === 'warranty' &&
      !form.warranty.trim()
    ) {
      Alert.alert(
        'Error',
        'Please enter the warranty period.'
      );
      return;
    }

    // Expiry validation
    if (
      form.validityType === 'expiry' &&
      !form.expiryDate
    ) {
      Alert.alert(
        'Error',
        'Please select an expiry date.'
      );
      return;
    }

    const costPriceNum =
      form.costPrice !== ''
        ? Number(form.costPrice)
        : 0;

    const priceNum =
      Number(form.price) || 0;

    const profitNum =
      form.profit !== ''
        ? Number(form.profit)
        : (priceNum - costPriceNum);

    onSave({
      ...form,

      costPrice: costPriceNum,
      price: priceNum,
      stock: Number(form.stock) || 0,
      profit: profitNum,

      manufactureDate:
        form.manufactureDate
          ? formatDateString(form.manufactureDate)
          : '',

      // NEW
      validityType: form.validityType,

      warranty:
        form.validityType === 'warranty'
          ? form.warranty.trim()
          : '',

      expiryDate:
        form.validityType === 'expiry' && form.expiryDate
          ? formatDateString(form.expiryDate)
          : ''
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>
              {product ? 'Edit Product' : '+ Add Product'}
            </Text>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
              }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollForm}
            keyboardShouldPersistTaps="handled"
          >

            {/* PRODUCT NAME */}
            <Text style={styles.inputLabel}>
              PRODUCT NAME
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="e.g. Wireless Keyboard"
              placeholderTextColor="#9CA3AF"
              value={form.name}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  name: text
                })
              }
            />

            {/* BRAND + SKU */}
            <View style={styles.row}>

              <View style={styles.flex1Right}>
                <Text style={styles.inputLabel}>
                  BRAND NAME
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Logitech"
                  placeholderTextColor="#9CA3AF"
                  value={form.brand}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      brand: text
                    })
                  }
                />
              </View>

              <View style={styles.flex1Left}>
                <Text style={styles.inputLabel}>
                  SKU
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. KB-1001"
                  placeholderTextColor="#9CA3AF"
                  value={form.sku}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      sku: text
                    })
                  }
                />
              </View>

            </View>

            {/* CATEGORY */}
            <Text style={styles.inputLabel}>
              CATEGORY
            </Text>

            <TouchableOpacity
              style={styles.dropdownSelector}
              activeOpacity={0.8}
              onPress={() =>
                setDropdownOpen(!dropdownOpen)
              }
            >
              <Text
                style={[
                  styles.dropdownValueText,
                  !form.category &&
                    styles.placeholderText
                ]}
              >
                {form.category || 'Select Category...'}
              </Text>

              <Text style={styles.arrowIcon}>
                {dropdownOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>

                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropdownOption,

                      index === categories.length - 1 && {
                        borderBottomWidth: 0
                      },

                      form.category === cat &&
                        styles.dropdownOptionSelected
                    ]}
                    onPress={() => {
                      setForm({
                        ...form,
                        category: cat
                      });

                      setDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,

                        form.category === cat &&
                          styles.dropdownOptionTextSelected
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}

              </View>
            )}

            {/* COST + SALES PRICE */}
            <View style={styles.row}>

              <View style={styles.flex1Right}>
                <Text style={styles.inputLabel}>
                  COST PRICE
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={form.costPrice}
                  onChangeText={handleCostPriceChange}
                />
              </View>

              <View style={styles.flex1Left}>
                <Text style={styles.inputLabel}>
                  SALES PRICE
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={handleSalesPriceChange}
                />
              </View>

            </View>

            {/* PROFIT + STOCK */}
            <View style={styles.row}>

              <View style={styles.flex1Right}>
                <Text style={styles.inputLabel}>
                  PROFIT PER ITEM
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={form.profit}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      profit: text
                    })
                  }
                />
              </View>

              <View style={styles.flex1Left}>
                <Text style={styles.inputLabel}>
                  STOCK
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={form.stock}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      stock: text
                    })
                  }
                />
              </View>

            </View>

            {/* MANUFACTURE DATE */}
            <Text style={styles.inputLabel}>
              MANUFACTURE DATE
            </Text>

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() =>
                setShowDatePicker(true)
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dateSelectorText,
                  !form.manufactureDate &&
                    styles.placeholderText
                ]}
              >
                📅 {formatDateString(form.manufactureDate)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={
                  form.manufactureDate ||
                  new Date()
                }
                mode="date"
                display={
                  Platform.OS === 'ios'
                    ? 'compact'
                    : 'calendar'
                }
                onChange={handleDateChange}
                maximumDate={
                  new Date(2035, 11, 31)
                }
                minimumDate={
                  new Date(2000, 0, 1)
                }
              />
            )}

            {/* PRODUCT VALIDITY */}
            <Text style={styles.inputLabel}>
              PRODUCT VALIDITY
            </Text>

            <TouchableOpacity
              style={styles.dropdownSelector}
              activeOpacity={0.8}
              onPress={() =>
                setValidityDropdownOpen(
                  !validityDropdownOpen
                )
              }
            >
              <Text style={styles.dropdownValueText}>
                {getValidityLabel()}
              </Text>

              <Text style={styles.arrowIcon}>
                {validityDropdownOpen
                  ? '▲'
                  : '▼'}
              </Text>
            </TouchableOpacity>

            {/* VALIDITY OPTIONS */}
            {validityDropdownOpen && (
              <View style={styles.dropdownMenu}>

                {validityOptions.map(
                  (option, index) => {

                    const optionValue =
                      option === 'Warranty'
                        ? 'warranty'
                        : option === 'Expiry'
                        ? 'expiry'
                        : 'none';

                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dropdownOption,

                          index ===
                            validityOptions.length - 1 && {
                            borderBottomWidth: 0
                          },

                          form.validityType ===
                            optionValue &&
                            styles.dropdownOptionSelected
                        ]}
                        onPress={() =>
                          handleValidityChange(
                            option
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,

                            form.validityType ===
                              optionValue &&
                              styles.dropdownOptionTextSelected
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}

              </View>
            )}

            {/* WARRANTY FIELD */}
            {form.validityType ===
              'warranty' && (
              <View style={styles.validityField}>
                <Text style={styles.inputLabel}>
                  WARRANTY PERIOD
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 6 months or 2 years"
                  placeholderTextColor="#9CA3AF"
                  value={form.warranty}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      warranty: text
                    })
                  }
                />
              </View>
            )}

            {/* EXPIRY DATE FIELD */}
            {form.validityType ===
              'expiry' && (
              <View style={styles.validityField}>
                <Text style={styles.inputLabel}>
                  EXPIRY DATE
                </Text>

                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() =>
                    setShowExpiryDatePicker(true)
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dateSelectorText,
                      !form.expiryDate &&
                        styles.placeholderText
                    ]}
                  >
                    📅{' '}
                    {formatDateString(
                      form.expiryDate
                    )}
                  </Text>
                </TouchableOpacity>

                {showExpiryDatePicker && (
                  <DateTimePicker
                    value={
                      form.expiryDate ||
                      new Date()
                    }
                    mode="date"
                    display={
                      Platform.OS === 'ios'
                        ? 'compact'
                        : 'calendar'
                    }
                    onChange={
                      handleExpiryDateChange
                    }
                    minimumDate={new Date()}
                    maximumDate={
                      new Date(2050, 11, 31)
                    }
                  />
                )}
              </View>
            )}

          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtonRow}>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {product
                  ? 'Update'
                  : 'Save Product'}
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.54)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  modalContent: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark || '#111827',
  },

  closeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textLight || '#6B7280',
  },

  scrollForm: {
    paddingBottom: 12,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight || '#6B7280',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  textInput: {
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark || '#111827',
  },

  dropdownSelector: {
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownValueText: {
    fontSize: 14,
    color: COLORS.textDark || '#111827',
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  arrowIcon: {
    fontSize: 12,
    color: COLORS.textLight || '#6B7280',
  },

  dropdownMenu: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    borderRadius: 10,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderGray || '#E5E7EB',
  },

  dropdownOptionSelected: {
    backgroundColor: '#EFF6FF',
  },

  dropdownOptionText: {
    fontSize: 14,
    color: COLORS.textDark || '#111827',
  },

  dropdownOptionTextSelected: {
    color:
      COLORS.primaryBlue || '#2563EB',
    fontWeight: 'bold',
  },

  dateSelector: {
    backgroundColor:
      COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: 'center',
  },

  dateSelectorText: {
    fontSize: 13,
    color:
      COLORS.textDark || '#111827',
    fontWeight: '500',
  },

  // NEW
  validityField: {
    width: '100%',
  },

  row: {
    flexDirection: 'row',
  },

  flex1Right: {
    flex: 1,
    marginRight: 6,
  },

  flex1Left: {
    flex: 1,
    marginLeft: 6,
  },

  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  cancelButtonText: {
    color:
      COLORS.textDark || '#111827',
    fontSize: 14,
    fontWeight: '600',
  },

  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor:
      COLORS.primaryBlue || '#2563EB',
  },

  saveButtonText: {
    color:
      COLORS.white || '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});