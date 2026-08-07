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
    const numStock = Number(stock) || 0;
    if (numStock === 0) return { label: 'Out of Stock', color: COLORS.dangerRed || '#EF4444', bg: '#FEE2E2' };
    if (numStock <= 10) return { label: 'Low Stock', color: COLORS.warningYellow || '#D97706', bg: '#FEF3C7' };
    return { label: 'In Stock', color: COLORS.successGreen || '#10B981', bg: '#D1FAE5' };
  };

  const safeProducts = products || [];

  const filteredProducts = safeProducts.filter((p) => {
    const query = search.toLowerCase();
    const matchesSearch = p?.name?.toLowerCase().includes(query) || 
                          p?.sku?.toLowerCase().includes(query) || 
                          p?.brand?.toLowerCase().includes(query);
    const matchesCategory = categoryFilter === 'All' || p?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
      <Header 
        title="Products" 
        onOpenMenu={onOpenMenu}
        onOpenProfile={onOpenProfile}  
        user={user} 
      />
      <View style={styles.contentPadding}>
        {/* Title & Add Button Row */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.pageTitle}>Products</Text>
            <Text style={styles.pageSubtitle}>Manage your catalog</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={onOpenAdd} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search products or SKU..." 
          placeholderTextColor="#9CA3AF"
          value={search} 
          onChangeText={setSearch} 
        />

        {/* Category Horizontal Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['All', 'Electronics', 'Furniture', 'Accessories'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
              onPress={() => setCategoryFilter(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product Cards */}
        {filteredProducts.map((item) => {
          const status = getStockStatus(item.stock);

          // Standardized variables: costPrice and price
          const costVal = item.costPrice ?? 0;
          const salesVal = item.price ?? 0;
          
          // Calculate profit dynamically if not stored
          const profitVal = item.profit ?? (salesVal - costVal).toFixed(2);
          const hasCost = item.costPrice !== undefined && item.costPrice !== null && String(item.costPrice) !== '';

          return (
            <View key={item.id} style={styles.itemCard}>
              {/* Header Row: Title & Stock Status Badge */}
              <View style={styles.itemCardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.itemCardTitle}>{item.name}</Text>
                  <Text style={styles.itemCardSubtitle}>
                    {item.brand ? `${item.brand}  •  ` : ''}{item.category}{item.sku ? `  •  SKU: ${item.sku}` : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              {/* Styled Specs Grid */}
              {(item.manufactureDate || item.warranty || hasCost) && (
                <View style={styles.specsGrid}>
                  {item.manufactureDate ? (
                    <View style={styles.specChip}>
                      <Text style={styles.specLabel}>MFG DATE</Text>
                      <Text style={styles.specValue}>{item.manufactureDate}</Text>
                    </View>
                  ) : null}

                  {item.warranty ? (
                    <View style={styles.specChip}>
                      <Text style={styles.specLabel}>WARRANTY</Text>
                      <Text style={styles.specValue}>{item.warranty}</Text>
                    </View>
                  ) : null}

                  {hasCost ? (
                    <View style={styles.specChip}>
                      <Text style={styles.specLabel}>COST PRICE</Text>
                      <Text style={[styles.specValue, styles.costValueText]}>PHP {costVal}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Card Footer: Sales Price, Stock, Profit & Action Buttons */}
              <View style={styles.itemCardFooter}>
                <View>
                  <Text style={styles.priceText}>PHP {salesVal}</Text>
                  <View style={styles.statsInlineRow}>
                    <Text style={styles.stockText}>
                      Stock: <Text style={styles.darkBoldText}>{item.stock ?? 0}</Text>
                    </Text>
                    <Text style={styles.statDot}>•</Text>
                    <Text style={styles.stockText}>
                      Profit: <Text style={styles.profitHighlight}>PHP {profitVal}</Text>
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.editButton} onPress={() => onOpenEdit(item)} activeOpacity={0.7}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {filteredProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: { 
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentPadding: { 
    padding: 16,
  },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  pageTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: COLORS.textDark || '#111827' 
  },
  pageSubtitle: { 
    fontSize: 12, 
    color: COLORS.textLight || '#6B7280',
    fontWeight: '500'
  },
  addButton: { 
    backgroundColor: COLORS.accentYellow || '#F59E0B', 
    paddingHorizontal: 16, 
    paddingVertical: 9, 
    borderRadius: 10,
    elevation: 2,
  },
  addButtonText: { 
    fontWeight: '800', 
    color: COLORS.darkBlue || '#1E3A8A',
    fontSize: 14,
  },
  searchInput: { 
    backgroundColor: COLORS.white || '#FFFFFF', 
    borderWidth: 1, 
    borderColor: COLORS.borderGray || '#E5E7EB', 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    marginBottom: 12, 
    fontSize: 14,
    color: COLORS.textDark || '#111827' 
  },
  filterRow: { 
    flexDirection: 'row', 
    marginBottom: 14 
  },
  filterChip: { 
    backgroundColor: COLORS.white || '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: COLORS.borderGray || '#E5E7EB' 
  },
  filterChipActive: { 
    backgroundColor: COLORS.primaryBlue || '#2563EB', 
    borderColor: COLORS.primaryBlue || '#2563EB' 
  },
  filterChipText: { 
    fontSize: 12, 
    fontWeight: '600',
    color: COLORS.textDark || '#111827' 
  },
  filterChipTextActive: { 
    color: COLORS.white || '#FFFFFF', 
    fontWeight: '700' 
  },
  itemCard: { 
    backgroundColor: COLORS.white || '#FFFFFF', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: COLORS.borderGray || '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  itemCardTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: COLORS.textDark || '#111827' 
  },
  itemCardSubtitle: { 
    fontSize: 12, 
    color: COLORS.textLight || '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: '700' 
  },
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 10,
    marginBottom: 12,
  },
  specChip: {
    flex: 1,
    alignItems: 'flex-start',
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textLight || '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark || '#111827',
  },
  costValueText: {
    color: '#374151',
  },
  itemCardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  priceText: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: COLORS.primaryBlue || '#2563EB' 
  },
  statsInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  stockText: { 
    fontSize: 12, 
    color: COLORS.textLight || '#6B7280',
    fontWeight: '500'
  },
  darkBoldText: {
    color: COLORS.textDark || '#111827',
    fontWeight: '700',
  },
  statDot: {
    marginHorizontal: 6,
    color: COLORS.textLight || '#6B7280',
    fontSize: 12,
  },
  profitHighlight: {
    color: COLORS.successGreen || '#10B981',
    fontWeight: '700',
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 8 
  },
  editButton: { 
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 8 
  },
  editButtonText: { 
    color: COLORS.primaryBlue || '#2563EB', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  deleteButton: { 
    backgroundColor: '#FEE2E2', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 8 
  },
  deleteButtonText: { 
    color: COLORS.dangerRed || '#EF4444', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textLight || '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});