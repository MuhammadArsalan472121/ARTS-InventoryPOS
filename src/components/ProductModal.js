import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/theme';

export default function ProductModal({ visible, product, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', brand: '', category: 'Electronics', price: '', retailPrice: '', stock: '' });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        retailPrice: product.retailPrice,
        stock: String(product.stock),
      });
    } else {
      setForm({ name: '', brand: '', category: 'Electronics', price: '', retailPrice: '', stock: '' });
    }
  }, [product, visible]);

  const handleSave = () => {
    if (!form.name || !form.price) {
      Alert.alert('Error', 'Product Name and Price are required.');
      return;
    }
    onSave({ ...form, stock: Number(form.stock) || 0 });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{product ? 'Edit Product' : '+ Add Product'}</Text>

          <Text style={styles.inputLabel}>PRODUCT NAME</Text>
          <TextInput style={styles.textInput} placeholder="e.g. Wireless Keyboard" value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} />

          <Text style={styles.inputLabel}>BRAND NAME</Text>
          <TextInput style={styles.textInput} placeholder="e.g. Logitech" value={form.brand} onChangeText={(text) => setForm({ ...form, brand: text })} />

          <Text style={styles.inputLabel}>CATEGORY</Text>
          <TextInput style={styles.textInput} placeholder="e.g. Electronics" value={form.category} onChangeText={(text) => setForm({ ...form, category: text })} />

          <View style={styles.row}>
            <View style={styles.flex1Right}>
              <Text style={styles.inputLabel}>RETAIL PRICE</Text>
              <TextInput style={styles.textInput} placeholder="0.00" keyboardType="numeric" value={form.retailPrice} onChangeText={(text) => setForm({ ...form, retailPrice: text })} />
            </View>
            <View style={styles.flex1Left}>
              <Text style={styles.inputLabel}>SALES PRICE</Text>
              <TextInput style={styles.textInput} placeholder="0.00" keyboardType="numeric" value={form.price} onChangeText={(text) => setForm({ ...form, price: text })} />
            </View>
          </View>

          <Text style={styles.inputLabel}>STOCK</Text>
          <TextInput style={styles.textInput} placeholder="0" keyboardType="numeric" value={form.stock} onChangeText={(text) => setForm({ ...form, stock: text })} />

          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{product ? 'Update' : 'Save Product'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
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
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
  },
  cancelButtonText: {
    color: COLORS.textDark,
    fontSize: 13,
  },
  saveButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primaryBlue,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
});