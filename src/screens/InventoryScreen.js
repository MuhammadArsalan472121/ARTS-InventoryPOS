import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function InventoryScreen({ 
  onOpenMenu, 
  onOpenProfile, 
  user, 
  inventoryItems = [], 
  onOpenEdit, 
  onDelete 
}) {
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quickStockInput, setQuickStockInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const safeItems = inventoryItems || [];
  const filteredInventory = safeItems.filter((i) => i?.name?.toLowerCase().includes(search.toLowerCase()));
  const lowStockCount = safeItems.filter((i) => i.stock <= i.minStock).length;

  const selectedItem = safeItems.find((item) => item.id === selectedItemId);

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setQuickStockInput(String(item.stock));
    setIsDropdownOpen(false);
  };

  const handleApplyStockUpdate = () => {
    if (!selectedItem) return;
    const newStock = Number(quickStockInput);
    if (isNaN(newStock) || newStock < 0) return;
    
    onOpenEdit({ ...selectedItem, stock: newStock });
  };

  return (
    <ScrollView style={styles.tabContainer}>
      <Header 
        title="Inventory" 
        onOpenMenu={onOpenMenu} 
        onOpenProfile={onOpenProfile} 
        user={user} 
      />
      <View style={styles.contentPadding}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Inventory</Text>
            <Text style={styles.pageSubtitle}>Track stock levels</Text>
          </View>
        </View>

        {/* Quick Quantity Adjustment Box */}
        <View style={styles.quickEditCard}>
          <Text style={styles.quickEditTitle}>QUICK QUANTITY UPDATE</Text>

          <TouchableOpacity 
            style={styles.dropdownSelector} 
            activeOpacity={0.8}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Text style={[styles.dropdownValueText, !selectedItem && styles.placeholderText]}>
              {selectedItem ? selectedItem.name : 'Select item to update stock...'}
            </Text>
            <Text style={styles.arrowIcon}>{isDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {safeItems.length === 0 ? (
                <View style={styles.dropdownOption}>
                  <Text style={styles.dropdownOptionText}>No items available</Text>
                </View>
              ) : (
                safeItems.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dropdownOption,
                      index === safeItems.length - 1 && { borderBottomWidth: 0 },
                      selectedItemId === item.id && styles.dropdownOptionSelected
                    ]}
                    onPress={() => handleSelectItem(item)}
                  >
                    <Text style={styles.dropdownOptionText}>
                      {item.name} (Current: {item.stock})
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {selectedItem && (
            <View style={styles.stockActionRow}>
              <View style={styles.stockInputContainer}>
                <Text style={styles.stockInputLabel}>New Quantity:</Text>
                <TextInput
                  style={styles.stockInput}
                  keyboardType="numeric"
                  value={quickStockInput}
                  onChangeText={setQuickStockInput}
                />
              </View>
              <TouchableOpacity style={styles.updateStockBtn} onPress={handleApplyStockUpdate}>
                <Text style={styles.updateStockBtnText}>Save Quantity</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL SKUS</Text>
            <Text style={styles.statNumber}>{safeItems.length}</Text>
            <Text style={styles.statSubtextSuccess}>Active items</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LOW / OUT</Text>
            <Text style={styles.statNumber}>{lowStockCount}</Text>
            <Text style={styles.statSubtextWarning}>Need reorder</Text>
          </View>
        </View>

        {lowStockCount > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerText}>{lowStockCount} items below minimum — reorder needed.</Text>
          </View>
        )}

        <TextInput style={styles.searchInput} placeholder="Search items..." value={search} onChangeText={setSearch} />

        {filteredInventory.map((item) => {
          const isLow = item.stock <= item.minStock;
          return (
            <View key={item.id} style={styles.inventoryCard}>
              <View style={[styles.stockBox, { backgroundColor: isLow ? '#FEF3C7' : '#D1FAE5' }]}>
                <Text style={[styles.stockBoxNumber, { color: isLow ? COLORS.warningYellow : COLORS.successGreen }]}>{item.stock}</Text>
                <Text style={styles.stockBoxLabel}>units</Text>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.inventoryItemTitle}>{item.name}</Text>
                <View style={[styles.miniBadge, { backgroundColor: isLow ? '#FEF3C7' : '#D1FAE5' }]}>
                  <Text style={[styles.miniBadgeText, { color: isLow ? COLORS.warningYellow : COLORS.successGreen }]}>
                    {isLow ? 'Low' : 'OK'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.editButton} onPress={() => onOpenEdit(item)}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1 },
  contentPadding: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  pageSubtitle: { fontSize: 12, color: COLORS.textLight },

  quickEditCard: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: 12,
  },
  quickEditTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 8 },
  dropdownSelector: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValueText: { fontSize: 13, color: COLORS.textDark },
  placeholderText: { color: '#9CA3AF' },
  arrowIcon: { fontSize: 11, color: COLORS.textLight },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    marginTop: 4,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  dropdownOptionSelected: { backgroundColor: '#EFF6FF' },
  dropdownOptionText: { fontSize: 13, color: COLORS.textDark },

  stockActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stockInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockInputLabel: { fontSize: 12, color: COLORS.textDark, fontWeight: '600' },
  stockInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 70,
    fontSize: 13,
    color: COLORS.textDark,
  },
  updateStockBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  updateStockBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },

  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { width: '48%', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderGray },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginVertical: 4 },
  statSubtextSuccess: { fontSize: 10, color: COLORS.successGreen },
  statSubtextWarning: { fontSize: 10, color: COLORS.warningYellow },
  alertBanner: { backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FDE68A' },
  alertBannerText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  searchInput: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.borderGray, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  inventoryCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderGray },
  stockBox: { width: 50, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stockBoxNumber: { fontSize: 16, fontWeight: 'bold' },
  stockBoxLabel: { fontSize: 9, color: COLORS.textLight },
  inventoryItemTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textDark },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  miniBadgeText: { fontSize: 9, fontWeight: 'bold' },
  actionColumn: { gap: 4 },
  editButton: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  editButtonText: { color: COLORS.primaryBlue, fontSize: 12, fontWeight: '600' },
  deleteButton: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: COLORS.dangerRed, fontSize: 12, fontWeight: '600' },
});