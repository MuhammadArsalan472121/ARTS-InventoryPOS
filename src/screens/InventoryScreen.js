import React, { useState } from 'react';

import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Keyboard,
} from 'react-native';

import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function InventoryScreen({
  onOpenMenu,
  onOpenProfile,
  user,
  inventoryItems = [],
  onOpenEdit,
  onDelete,
  onStockUpdate,
}) {
  const [search, setSearch] = useState('');
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quickStockInput, setQuickStockInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const safeItems = inventoryItems || [];

  const filteredInventory = safeItems.filter((item) =>
    item?.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  const dropdownFilteredItems = safeItems.filter((item) =>
    item?.name
      ?.toLowerCase()
      .includes(dropdownSearch.toLowerCase())
  );

  const lowStockCount = safeItems.filter(
    (item) =>
      Number(item.stock || 0) <=
      Number(item.minStock || 0)
  ).length;

  const selectedItem = safeItems.find(
    (item) => item.id === selectedItemId
  );

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setQuickStockInput(String(item.stock ?? 0));
    setIsDropdownOpen(false);
    setDropdownSearch('');
  };

  // =====================================================
  // QUICK STOCK UPDATE
  // =====================================================

  const handleApplyStockUpdate = () => {
    if (!selectedItem) return;

    const newStock = Number(quickStockInput);

    if (Number.isNaN(newStock) || newStock < 0) {
      return;
    }

    const oldStock = Number(selectedItem.stock || 0);

    // Nothing changed
    if (newStock === oldStock) {
      return;
    }

    /*
      IMPORTANT:

      The actual update + movement record is handled
      by App.js.

      Example:

      20 -> 30
      IN = 10

      20 -> 15
      OUT = 5
    */

    if (onStockUpdate) {
      onStockUpdate(
        selectedItem,
        newStock
      );
    }

    setQuickStockInput(String(newStock));
    setIsDropdownOpen(false);
  };

  const closeDropdown = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        closeDropdown();
        Keyboard.dismiss();
      }}
    >
      <ScrollView
        style={styles.tabContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Inventory"
          onOpenMenu={onOpenMenu}
          onOpenProfile={onOpenProfile}
          user={user}
        />

        <View style={styles.contentPadding}>

          {/* PAGE TITLE */}

          <View style={styles.titleRow}>
            <View>
              <Text style={styles.pageTitle}>
                Inventory
              </Text>

              <Text style={styles.pageSubtitle}>
                Track stock levels
              </Text>
            </View>
          </View>

          {/* QUICK QUANTITY UPDATE */}

          <View
            style={[
              styles.quickEditCard,
              { zIndex: 100 },
            ]}
          >
            <Text style={styles.quickEditTitle}>
              QUICK QUANTITY UPDATE
            </Text>

            <TouchableOpacity
              style={styles.dropdownSelector}
              activeOpacity={0.8}
              onPress={() =>
                setIsDropdownOpen(
                  !isDropdownOpen
                )
              }
            >
              <Text
                style={[
                  styles.dropdownValueText,
                  !selectedItem &&
                    styles.placeholderText,
                ]}
              >
                {selectedItem
                  ? selectedItem.name
                  : 'Select item to update stock...'}
              </Text>

              <Text style={styles.arrowIcon}>
                {isDropdownOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>

                <TextInput
                  style={
                    styles.dropdownSearchInput
                  }
                  placeholder="Filter dropdown items..."
                  placeholderTextColor="#9CA3AF"
                  value={dropdownSearch}
                  onChangeText={
                    setDropdownSearch
                  }
                />

                <ScrollView
                  style={{ maxHeight: 160 }}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {dropdownFilteredItems.length ===
                  0 ? (
                    <View
                      style={styles.dropdownOption}
                    >
                      <Text
                        style={
                          styles.dropdownOptionText
                        }
                      >
                        No matching items
                      </Text>
                    </View>
                  ) : (
                    dropdownFilteredItems.map(
                      (item, index) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownOption,
                            index ===
                              dropdownFilteredItems.length -
                                1 && {
                              borderBottomWidth: 0,
                            },
                            selectedItemId ===
                              item.id &&
                              styles.dropdownOptionSelected,
                          ]}
                          onPress={() =>
                            handleSelectItem(
                              item
                            )
                          }
                        >
                          <Text
                            style={
                              styles.dropdownOptionText
                            }
                          >
                            {item.name} (Current:{' '}
                            {item.stock})
                          </Text>
                        </TouchableOpacity>
                      )
                    )
                  )}
                </ScrollView>
              </View>
            )}

            {selectedItem && (
              <View style={styles.stockActionRow}>

                <View
                  style={
                    styles.stockInputContainer
                  }
                >
                  <Text
                    style={
                      styles.stockInputLabel
                    }
                  >
                    New Quantity:
                  </Text>

                  <TextInput
                    style={styles.stockInput}
                    keyboardType="numeric"
                    value={quickStockInput}
                    onChangeText={
                      setQuickStockInput
                    }
                  />
                </View>

                <TouchableOpacity
                  style={styles.updateStockBtn}
                  onPress={
                    handleApplyStockUpdate
                  }
                >
                  <Text
                    style={
                      styles.updateStockBtnText
                    }
                  >
                    Save Quantity
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ANALYTICS */}

          <View style={styles.gridContainer}>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                TOTAL SKUS
              </Text>

              <Text style={styles.statNumber}>
                {safeItems.length}
              </Text>

              <Text
                style={styles.statSubtextSuccess}
              >
                Active items
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                LOW / OUT
              </Text>

              <Text style={styles.statNumber}>
                {lowStockCount}
              </Text>

              <Text
                style={styles.statSubtextWarning}
              >
                Need reorder
              </Text>
            </View>
          </View>

          {/* LOW STOCK ALERT */}

          {lowStockCount > 0 && (
            <View style={styles.alertBanner}>
              <Text
                style={styles.alertBannerText}
              >
                {lowStockCount} items below
                minimum — reorder needed.
              </Text>
            </View>
          )}

          {/* SEARCH */}

          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />

            {search.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearch('')}
              >
                <Text
                  style={styles.clearSearchText}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* INVENTORY LIST */}

          {filteredInventory.map((item) => {
            const isLow =
              Number(item.stock || 0) <=
              Number(item.minStock || 0);

            return (
              <View
                key={item.id}
                style={styles.inventoryCard}
              >

                <View
                  style={[
                    styles.stockBox,
                    {
                      backgroundColor: isLow
                        ? '#FEF3C7'
                        : '#D1FAE5',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stockBoxNumber,
                      {
                        color: isLow
                          ? COLORS.warningYellow ||
                            '#D97706'
                          : COLORS.successGreen ||
                            '#10B981',
                      },
                    ]}
                  >
                    {item.stock}
                  </Text>

                  <Text
                    style={styles.stockBoxLabel}
                  >
                    units
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text
                    style={
                      styles.inventoryItemTitle
                    }
                  >
                    {item.name}
                  </Text>

                  <View
                    style={[
                      styles.miniBadge,
                      {
                        backgroundColor: isLow
                          ? '#FEF3C7'
                          : '#D1FAE5',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniBadgeText,
                        {
                          color: isLow
                            ? COLORS.warningYellow ||
                              '#D97706'
                            : COLORS.successGreen ||
                              '#10B981',
                        },
                      ]}
                    >
                      {isLow ? 'Low' : 'OK'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionColumn}>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      onOpenEdit(item)
                    }
                  >
                    <Text
                      style={
                        styles.editButtonText
                      }
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      onDelete(item.id)
                    }
                  >
                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            );
          })}

          {filteredInventory.length === 0 && (
            <View
              style={styles.emptyContainer}
            >
              <Text style={styles.emptyText}>
                No items found matching "{search}"
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
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
    marginBottom: 12,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark || '#111827',
  },

  pageSubtitle: {
    fontSize: 12,
    color: COLORS.textLight || '#6B7280',
  },

  quickEditCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
    marginBottom: 12,
    position: 'relative',
  },

  quickEditTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLight || '#6B7280',
    marginBottom: 8,
  },

  dropdownSelector: {
    backgroundColor:
      COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownValueText: {
    fontSize: 13,
    color: COLORS.textDark || '#111827',
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  arrowIcon: {
    fontSize: 11,
    color: COLORS.textLight || '#6B7280',
  },

  dropdownMenu: {
    backgroundColor:
      COLORS.white || '#FFFFFF',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  dropdownSearchInput: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderGray || '#E5E7EB',
    backgroundColor: '#F9FAFB',
    color: COLORS.textDark || '#111827',
  },

  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderGray || '#E5E7EB',
  },

  dropdownOptionSelected: {
    backgroundColor: '#EFF6FF',
  },

  dropdownOptionText: {
    fontSize: 13,
    color: COLORS.textDark || '#111827',
  },

  stockActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  stockInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  stockInputLabel: {
    fontSize: 12,
    color: COLORS.textDark || '#111827',
    fontWeight: '600',
  },

  stockInput: {
    backgroundColor:
      COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 70,
    fontSize: 13,
    color: COLORS.textDark || '#111827',
  },

  updateStockBtn: {
    backgroundColor:
      COLORS.primaryBlue || '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },

  updateStockBtnText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  statCard: {
    width: '48%',
    backgroundColor:
      COLORS.white || '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
  },

  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLight || '#6B7280',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark || '#111827',
    marginVertical: 4,
  },

  statSubtextSuccess: {
    fontSize: 10,
    color:
      COLORS.successGreen || '#10B981',
  },

  statSubtextWarning: {
    fontSize: 10,
    color:
      COLORS.warningYellow || '#D97706',
  },

  alertBanner: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  alertBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },

  searchWrapper: {
    position: 'relative',
    marginBottom: 12,
  },

  searchInput: {
    backgroundColor:
      COLORS.white || '#FFFFFF',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 36,
    fontSize: 14,
    color: COLORS.textDark || '#111827',
  },

  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    top: 10,
  },

  clearSearchText: {
    color:
      COLORS.textLight || '#6B7280',
    fontSize: 14,
    fontWeight: 'bold',
  },

  inventoryCard: {
    backgroundColor:
      COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray || '#E5E7EB',
  },

  stockBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stockBoxNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  stockBoxLabel: {
    fontSize: 9,
    color:
      COLORS.textLight || '#6B7280',
  },

  inventoryItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color:
      COLORS.textDark || '#111827',
  },

  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  miniBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  actionColumn: {
    gap: 4,
  },

  editButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  editButtonText: {
    color:
      COLORS.primaryBlue || '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },

  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  deleteButtonText: {
    color:
      COLORS.dangerRed || '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  emptyText: {
    color:
      COLORS.textLight || '#6B7280',
    fontSize: 13,
  },
});