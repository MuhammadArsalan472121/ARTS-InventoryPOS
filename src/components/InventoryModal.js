import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/theme';

export default function InventoryModal({ visible, item, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', stock: '', minStock: '' });

  useEffect(() => {
    if (item) {
      setForm({ name: item.name || '', stock: String(item.stock ?? ''), minStock: String(item.minStock ?? '') });
    } else {
      setForm({ name: '', stock: '', minStock: '' });
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Product Name is required.');
      return;
    }
    onSave({
      name: form.name.trim(),
      stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) || 0,
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{item ? 'Update Stock' : '+ Add Inventory Item'}</Text>

          <Text style={styles.inputLabel}>PRODUCT NAME</Text>
          <TextInput 
            style={styles.textInput} 
            placeholder="e.g. Wireless Keyboard" 
            placeholderTextColor="#9CA3AF"
            value={form.name} 
            onChangeText={(text) => setForm({ ...form, name: text })} 
          />

          <View style={styles.row}>
            <View style={styles.flex1Right}>
              <Text style={styles.inputLabel}>CURRENT STOCK</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="0" 
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric" 
                value={form.stock} 
                onChangeText={(text) => setForm({ ...form, stock: text })} 
              />
            </View>

            <View style={styles.flex1Left}>
              <Text style={styles.inputLabel}>MIN STOCK</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="10" 
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric" 
                value={form.minStock} 
                onChangeText={(text) => setForm({ ...form, minStock: text })} 
              />
            </View>
          </View>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{item ? 'Update Item' : 'Save Item'}</Text>
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
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark || '#111827',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textLight || '#6B7280',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark || '#111827',
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
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: COLORS.textDark || '#111827',
    fontSize: 13,
  },
  saveButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primaryBlue || '#2563EB',
  },
  saveButtonText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});