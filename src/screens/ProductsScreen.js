import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';
export default function ProductsScreen({ 
  onOpenMenu, 
  onOpenProfile, 
  user, 
  products = [], 
  onOpenAdd, 
  onOpenEdit, 
  onDelete 
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: COLORS.dangerRed, bg: '#FEE2E2' };
    if (stock <= 10) return { label: 'Low Stock', color: COLORS.warningYellow, bg: '#FEF3C7' };
    return { label: 'In Stock', color: COLORS.successGreen, bg: '#D1FAE5' };
  };

  const safeProducts = products || [];

  const filteredProducts = safeProducts.filter((p) => {
    const matchesSearch = p?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollView style={styles.tabContainer}>
      <Header title="Products" 
      onOpenMenu={onOpenMenu}
      onOpenProfile={onOpenProfile}  
  user={user} />
      <View style={styles.contentPadding}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Products</Text>
            <Text style={styles.pageSubtitle}>Manage your catalog</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={onOpenAdd}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.searchInput} placeholder="Search products..." value={search} onChangeText={setSearch} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['All', 'Electronics', 'Furniture', 'Accessories'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredProducts.map((item) => {
          const status = getStockStatus(item.stock);
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemCardTitle}>{item.name}</Text>
                  <Text style={styles.itemCardSubtitle}>
                    {item.brand} | {item.category}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.itemCardFooter}>
                <View>
                  <Text style={styles.priceText}>PHP {item.price}</Text>
                  <Text style={styles.stockText}>Stock: {item.stock}</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.editButton} onPress={() => onOpenEdit(item)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
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
  addButton: { backgroundColor: COLORS.accentYellow, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { fontWeight: 'bold', color: COLORS.darkBlue },
  searchInput: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.borderGray, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  filterRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: { backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: COLORS.borderGray },
  filterChipActive: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  filterChipText: { fontSize: 12, color: COLORS.textDark },
  filterChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  itemCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderGray },
  itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemCardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.textDark },
  itemCardSubtitle: { fontSize: 11, color: COLORS.textLight },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, height: 22 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  itemCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primaryBlue },
  stockText: { fontSize: 11, color: COLORS.textLight },
  actionRow: { flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  editButtonText: { color: COLORS.primaryBlue, fontSize: 12, fontWeight: '600' },
  deleteButton: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: COLORS.dangerRed, fontSize: 12, fontWeight: '600' },
});