import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function DashboardScreen({
  onOpenMenu,
  onOpenProfile,
  user,
  products = [],
  productsCount = 0,
  inventoryItems = [],
  onUpdateInventory,
  onRecordSale,
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [cart, setCart] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [showCart, setShowCart] = useState(false);

  const [showReceipt, setShowReceipt] = useState(false);

  const [completedTransaction, setCompletedTransaction] =
    useState(null);

  // Cart limit confirmation
  const [showCartLimitModal, setShowCartLimitModal] =
    useState(false);

  const [pendingCartItem, setPendingCartItem] =
    useState(null);

  // Stock limit popup
  const [showStockLimitModal, setShowStockLimitModal] =
    useState(false);

  // Sale date
  const [saleDate, setSaleDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const formatDateDisplay = (date) => {
    if (!date) {
      return '';
    }

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getSaleDateString = () => {
    return `${saleDate.getFullYear()}-${String(
      saleDate.getMonth() + 1
    ).padStart(2, '0')}-${String(
      saleDate.getDate()
    ).padStart(2, '0')}`;
  };

  const handleSaleDateChange = (
    event,
    selectedDate
  ) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setSaleDate(selectedDate);
    }
  };

  // ============================================================
  // PRICE / PROFIT
  // ============================================================

  const getUnitPrice = (item) => {
    return Number(
      item.salesPrice ?? item.price ?? 0
    );
  };

  const getUnitProfit = (item) => {
    if (
      item.profitPerItem !== undefined &&
      item.profitPerItem !== null &&
      item.profitPerItem !== ''
    ) {
      return Number(item.profitPerItem);
    }

    if (
      item.profit !== undefined &&
      item.profit !== null &&
      item.profit !== ''
    ) {
      return Number(item.profit);
    }

    const sales = getUnitPrice(item);

    const retailCost = Number(
      item.retailPrice ??
        item.costPrice ??
        0
    );

    return sales - retailCost;
  };

  // ============================================================
  // AVAILABLE PRODUCTS
  // ============================================================

  const availableItems = (
    products.length > 0
      ? products
      : inventoryItems
  ).map((prod) => {
    const invMatch = inventoryItems.find(
      (inv) => inv.id === prod.id
    );

    return {
      ...prod,

      stock: invMatch
        ? invMatch.stock
        : prod.stock ?? 0,

      unitPrice: getUnitPrice(prod),

      unitProfit: getUnitProfit(prod),
    };
  });

  // ============================================================
  // CART CALCULATIONS
  // ============================================================

  const calculateItemRevenue = (item) => {
    const qty =
      Number(item.quantity) || 1;

    return (
      getUnitPrice(item) * qty
    );
  };

  const totalRevenue = cart.reduce(
    (total, item) => {
      return (
        total +
        calculateItemRevenue(item)
      );
    },
    0
  );

  const totalProfit = cart.reduce(
    (total, item) => {
      const qty =
        Number(item.quantity) || 1;

      const profitPerUnit =
        getUnitProfit(item);

      return (
        total +
        profitPerUnit * qty
      );
    },
    0
  );

  const totalCartItems = cart.reduce(
    (total, item) => {
      return (
        total +
        Number(item.quantity || 0)
      );
    },
    0
  );

  // ============================================================
  // INVOICE
  // ============================================================

  const generateInvoiceNumber = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      now.getDate()
    ).padStart(2, '0');

    const hour = String(
      now.getHours()
    ).padStart(2, '0');

    const minute = String(
      now.getMinutes()
    ).padStart(2, '0');

    const second = String(
      now.getSeconds()
    ).padStart(2, '0');

    return `INV-${year}${month}${day}${hour}${minute}${second}`;
  };

  // ============================================================
  // CART COUNT
  // ============================================================

  const getCartProductCount = () => {
    return cart.reduce(
      (total, item) => {
        return (
          total +
          Number(item.quantity || 0)
        );
      },
      0
    );
  };

  // ============================================================
  // STOCK LIMIT POPUP
  // ============================================================

  const showNoMoreStockMessage = () => {
    setShowStockLimitModal(true);
  };

  // ============================================================
  // ACTUALLY ADD ITEM
  //
  // IMPORTANT:
  // This function DOES NOT close the product list.
  // ============================================================

  const addItemToCart = (item) => {
    const stock =
      Number(item.stock) || 0;

    setCart((prevCart) => {
      const existingIndex =
        prevCart.findIndex(
          (cartItem) =>
            cartItem.id === item.id
        );

      // Product already exists
      if (existingIndex !== -1) {
        const existingItem =
          prevCart[existingIndex];

        // No more inventory available
        if (
          Number(existingItem.quantity) >=
          stock
        ) {
          showNoMoreStockMessage();
          return prevCart;
        }

        return prevCart.map(
          (cartItem, index) => {
            if (
              index !== existingIndex
            ) {
              return cartItem;
            }

            return {
              ...cartItem,
              quantity:
                Number(cartItem.quantity) +
                1,
            };
          }
        );
      }

      // New product
      return [
        ...prevCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });

    // IMPORTANT:
    // Do NOT close the search/product list.
    // Do NOT clear searchQuery.
    // Do NOT dismiss keyboard.
  };

  // ============================================================
  // ADD FROM PRODUCT LIST
  // ============================================================

  const handleAddToCart = (item) => {
    const stock =
      Number(item.stock) || 0;

    if (stock <= 0) {
      showNoMoreStockMessage();
      return;
    }

    const currentCount =
      getCartProductCount();

    // Show warning ONLY when going from 5 to 6
    if (currentCount === 5) {
      setPendingCartItem(item);
      setShowCartLimitModal(true);
      return;
    }

    addItemToCart(item);
  };

  // ============================================================
  // CONFIRM "ADD MORE"
  // ============================================================

  const confirmAddMoreProducts = () => {
    if (!pendingCartItem) {
      setShowCartLimitModal(false);
      return;
    }

    // This means the + button inside cart
    // was used.
    if (
      pendingCartItem.isQuantityChange
    ) {
      setCart((prevCart) => {
        return prevCart.map((cartItem) => {
          if (
            cartItem.id !==
            pendingCartItem.id
          ) {
            return cartItem;
          }

          // No more inventory available
          if (
            Number(cartItem.quantity) >=
            Number(cartItem.stock)
          ) {
            showNoMoreStockMessage();
            return cartItem;
          }

          return {
            ...cartItem,
            quantity:
              Number(cartItem.quantity) +
              1,
          };
        });
      });
    } else {
      // Product-list Add to Cart button
      addItemToCart(
        pendingCartItem
      );
    }

    // Clear pending item
    setPendingCartItem(null);

    // Close ONLY the confirmation modal
    setShowCartLimitModal(false);

    // Product list remains open.
  };

  // ============================================================
  // CANCEL "ADD MORE"
  // ============================================================

  const cancelAddMoreProducts = () => {
    setPendingCartItem(null);
    setShowCartLimitModal(false);
  };

  // ============================================================
  // CHANGE QUANTITY FROM CART
  // ============================================================

  const handleQuantityChange = (
    id,
    delta
  ) => {
    const currentCount =
      getCartProductCount();

    // Only warn when trying to go
    // from exactly 5 to 6.
    if (
      delta > 0 &&
      currentCount === 5
    ) {
      setPendingCartItem({
        id: id,
        isQuantityChange: true,
      });

      setShowCartLimitModal(true);

      return;
    }

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const newQuantity =
            Number(item.quantity) +
            delta;

          // Remove item if quantity becomes 0
          if (newQuantity <= 0) {
            return null;
          }

          // Never exceed stock
          if (
            newQuantity >
            Number(item.stock)
          ) {
            showNoMoreStockMessage();
            return item;
          }

          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter(Boolean);
    });
  };

  // ============================================================
  // REMOVE ITEM
  // ============================================================

  const handleRemoveFromCart = (id) => {
    setCart((prevCart) => {
      return prevCart.filter(
        (item) => item.id !== id
      );
    });
  };

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckout = () => {
    if (cart.length === 0) {
      return;
    }

    const invoiceNumber =
      generateInvoiceNumber();

    const txData = {
      id: String(Date.now()),
      invoiceNumber: invoiceNumber,
      items: [...cart],
      totalRevenue: totalRevenue,
      totalProfit: totalProfit,
      date: getSaleDateString(),
      createdAt:
        new Date().toISOString(),
    };

    // Update inventory
    const updatedInventory =
      inventoryItems.map(
        (inventoryItem) => {
          const cartMatch =
            cart.find(
              (cartItem) =>
                cartItem.id ===
                inventoryItem.id
            );

          if (cartMatch) {
            return {
              ...inventoryItem,

              stock: Math.max(
                0,
                Number(
                  inventoryItem.stock
                ) -
                  Number(
                    cartMatch.quantity
                  )
              ),
            };
          }

          return inventoryItem;
        }
      );

    if (onUpdateInventory) {
      onUpdateInventory(
        updatedInventory
      );
    }

    // Record sale
    if (onRecordSale) {
      onRecordSale(txData);
    }

    setCompletedTransaction(
      txData
    );

    setShowCart(false);

    setShowReceipt(true);

    setCart([]);

    setPendingCartItem(null);

    setShowCartLimitModal(false);
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredItems =
    availableItems.filter(
      (item) => {
        const productName =
          item.name ||
          item.productName ||
          '';

        const sku =
          item.SKU ||
          item.sku ||
          '';

        const searchText =
          `${productName} ${sku}`.toLowerCase();

        return searchText.includes(
          searchQuery.toLowerCase()
        );
      }
    );

  // ============================================================
  // LOW STOCK
  // ============================================================

  const lowStockCount =
    availableItems.filter(
      (item) =>
        (Number(item.stock) || 0) <=
        5
    ).length;

  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios'
              ? 'interactive'
              : 'on-drag'
          }
        >
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <Header
            title="POS Dashboard"
            onOpenMenu={onOpenMenu}
            onOpenProfile={
              onOpenProfile
            }
            user={user}
          />

          <View
            style={
              styles.contentPadding
            }
          >
            {/* ================================================== */}
            {/* KPI CARDS */}
            {/* ================================================== */}

            <View
              style={styles.kpiGrid}
            >
              <View
                style={styles.kpiCard}
              >
                <Text
                  style={
                    styles.kpiLabel
                  }
                >
                  PRODUCTS
                </Text>

                <Text
                  style={
                    styles.kpiValue
                  }
                >
                  {productsCount ||
                    availableItems.length}
                </Text>
              </View>

              <View
                style={styles.kpiCard}
              >
                <Text
                  style={
                    styles.kpiLabel
                  }
                >
                  LOW STOCK
                </Text>

                <Text
                  style={[
                    styles.kpiValue,
                    styles.lowStockValue,
                  ]}
                >
                  {lowStockCount}
                </Text>
              </View>
            </View>

            {/* ================================================== */}
            {/* SALE DATE */}
            {/* ================================================== */}

            <View
              style={
                styles.saleDateContainer
              }
            >
              <Text
                style={
                  styles.saleDateLabel
                }
              >
                SALE DATE
              </Text>

              <TouchableOpacity
                style={
                  styles.saleDateButton
                }
                onPress={() =>
                  setShowDatePicker(true)
                }
              >
                <Text
                  style={
                    styles.saleDateText
                  }
                >
                  📅{' '}
                  {formatDateDisplay(
                    saleDate
                  )}
                </Text>

                <Text
                  style={
                    styles.changeDateText
                  }
                >
                  Change Date
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={saleDate}
                  mode="date"
                  display={
                    Platform.OS === 'ios'
                      ? 'compact'
                      : 'calendar'
                  }
                  onChange={
                    handleSaleDateChange
                  }
                />
              )}
            </View>

            {/* ================================================== */}
            {/* QUICK ITEM SEARCH */}
            {/* ================================================== */}

            <View
              style={
                styles.quickSearchCard
              }
            >
              {/* HEADER */}

              <View
                style={
                  styles.quickSearchHeader
                }
              >
                <View
                  style={
                    styles.quickSearchTitleArea
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Quick Item Search
                  </Text>

                  <Text
                    style={
                      styles.quickSearchSubtitle
                    }
                  >
                    Search products and add
                    them to the current sale
                  </Text>
                </View>

                {/* CART */}

                <TouchableOpacity
                  style={
                    styles.headerCartButton
                  }
                  activeOpacity={0.7}
                  onPress={() =>
                    setShowCart(true)
                  }
                >
                  <Text
                    style={
                      styles.headerCartIcon
                    }
                  >
                    🛒
                  </Text>

                  <View
                    style={
                      styles.cartCountBadge
                    }
                  >
                    <Text
                      style={
                        styles.cartCountText
                      }
                    >
                      {totalCartItems}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* SEARCH INPUT */}

              <View
                style={
                  styles.searchInputWrapper
                }
              >
                <Text
                  style={
                    styles.searchIcon
                  }
                >
                  🔍
                </Text>

                <TextInput
                  style={
                    styles.searchInput
                  }
                  placeholder="Search product name or SKU..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onFocus={() =>
                    setIsDropdownOpen(
                      true
                    )
                  }
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setIsDropdownOpen(
                      true
                    );
                  }}
                />

                {searchQuery.length >
                  0 && (
                  <TouchableOpacity
                    style={
                      styles.clearSearchButton
                    }
                    onPress={() =>
                      setSearchQuery('')
                    }
                  >
                    <Text
                      style={
                        styles.clearSearchText
                      }
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* PRODUCT LIST */}

              {isDropdownOpen && (
                <View
                  style={
                    styles.productListContainer
                  }
                >
                  <View
                    style={
                      styles.listHeader
                    }
                  >
                    <Text
                      style={
                        styles.listHeaderText
                      }
                    >
                      AVAILABLE PRODUCTS
                    </Text>

                    <Text
                      style={
                        styles.listCountText
                      }
                    >
                      {filteredItems.length}{' '}
                      items
                    </Text>
                  </View>

                  {filteredItems.length ===
                  0 ? (
                    <View
                      style={
                        styles.noProductsContainer
                      }
                    >
                      <Text
                        style={
                          styles.noProductsIcon
                        }
                      >
                        🔍
                      </Text>

                      <Text
                        style={
                          styles.noProductsTitle
                        }
                      >
                        No products found
                      </Text>

                      <Text
                        style={
                          styles.noProductsText
                        }
                      >
                        Try another product
                        name or SKU.
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={
                        styles.productList
                      }
                    >
                      {filteredItems.map(
                        (item) => {
                          const stock =
                            Number(
                              item.stock
                            ) || 0;

                          const price =
                            getUnitPrice(
                              item
                            );

                          const isOutOfStock =
                            stock <= 0;

                          const productName =
                            item.name ||
                            item.productName ||
                            'Unnamed Product';

                          const sku =
                            item.SKU ||
                            item.sku ||
                            '';

                          return (
                            <View
                              key={
                                item.id
                              }
                              style={[
                                styles.productRow,
                                isOutOfStock &&
                                  styles.outOfStockRow,
                              ]}
                            >
                              <View
                                style={
                                  styles.productInfo
                                }
                              >
                                <Text
                                  style={
                                    styles.productName
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {
                                    productName
                                  }
                                </Text>

                                {sku ? (
                                  <Text
                                    style={
                                      styles.productSku
                                    }
                                  >
                                    SKU: {sku}
                                  </Text>
                                ) : null}

                                <View
                                  style={
                                    styles.productMeta
                                  }
                                >
                                  <Text
                                    style={
                                      styles.productPrice
                                    }
                                  >
                                    PKR{' '}
                                    {price.toFixed(
                                      2
                                    )}
                                  </Text>

                                  <View
                                    style={[
                                      styles.stockBadge,
                                      stock <=
                                        5 &&
                                        stock >
                                          0 &&
                                        styles.lowStockBadge,
                                      isOutOfStock &&
                                        styles.outOfStockBadge,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.stockBadgeText,
                                        isOutOfStock &&
                                          styles.outOfStockBadgeText,
                                      ]}
                                    >
                                      {isOutOfStock
                                        ? 'Out of stock'
                                        : `${stock} in stock`}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              <TouchableOpacity
                                style={[
                                  styles.addToCartButton,
                                  isOutOfStock &&
                                    styles.disabledAddToCartButton,
                                ]}
                                activeOpacity={
                                  0.7
                                }
                                disabled={
                                  isOutOfStock
                                }
                                onPress={() =>
                                  handleAddToCart(
                                    item
                                  )
                                }
                              >
                                <Text
                                  style={
                                    styles.addToCartIcon
                                  }
                                >
                                  🛒
                                </Text>

                                <Text
                                  style={
                                    styles.addToCartText
                                  }
                                >
                                  {isOutOfStock
                                    ? 'Unavailable'
                                    : 'Add to Cart'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* ================================================== */}
          {/* CART MODAL */}
          {/* ================================================== */}

          <Modal
            visible={showCart}
            transparent={true}
            animationType="slide"
            onRequestClose={() =>
              setShowCart(false)
            }
          >
            <View
              style={
                styles.cartModalOverlay
              }
            >
              <View
                style={
                  styles.cartModalCard
                }
              >
                <View
                  style={
                    styles.cartModalHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.cartModalTitle
                      }
                    >
                      Current Cart
                    </Text>

                    <Text
                      style={
                        styles.cartModalSubtitle
                      }
                    >
                      {totalCartItems}{' '}
                      item
                      {totalCartItems !==
                      1
                        ? 's'
                        : ''}{' '}
                      in this sale
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.closeCartButton
                    }
                    onPress={() =>
                      setShowCart(false)
                    }
                  >
                    <Text
                      style={
                        styles.closeCartText
                      }
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                {cart.length === 0 ? (
                  <View
                    style={
                      styles.emptyCartContainer
                    }
                  >
                    <Text
                      style={
                        styles.emptyCartIcon
                      }
                    >
                      🛒
                    </Text>

                    <Text
                      style={
                        styles.emptyCartTitle
                      }
                    >
                      Your cart is empty
                    </Text>

                    <Text
                      style={
                        styles.emptyCartText
                      }
                    >
                      Add products from the
                      Quick Item Search
                      section.
                    </Text>

                    <TouchableOpacity
                      style={
                        styles.continueShoppingButton
                      }
                      onPress={() =>
                        setShowCart(false)
                      }
                    >
                      <Text
                        style={
                          styles.continueShoppingText
                        }
                      >
                        Continue Shopping
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <ScrollView
                      style={
                        styles.cartItemsList
                      }
                      showsVerticalScrollIndicator={
                        false
                      }
                    >
                      {cart.map(
                        (item) => {
                          const price =
                            getUnitPrice(
                              item
                            );

                          const itemTotal =
                            calculateItemRevenue(
                              item
                            );

                          return (
                            <View
                              key={
                                item.id
                              }
                              style={
                                styles.cartModalItem
                              }
                            >
                              <View
                                style={
                                  styles.cartModalItemInfo
                                }
                              >
                                <Text
                                  style={
                                    styles.cartModalItemName
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {item.name ||
                                    item.productName}
                                </Text>

                                <Text
                                  style={
                                    styles.cartModalItemPrice
                                  }
                                >
                                  PKR{' '}
                                  {price.toFixed(
                                    2
                                  )}{' '}
                                  ×{' '}
                                  {
                                    item.quantity
                                  }
                                </Text>

                                <Text
                                  style={
                                    styles.cartModalItemTotal
                                  }
                                >
                                  PKR{' '}
                                  {itemTotal.toFixed(
                                    2
                                  )}
                                </Text>
                              </View>

                              <View
                                style={
                                  styles.quantityContainer
                                }
                              >
                                <TouchableOpacity
                                  style={
                                    styles.quantityButton
                                  }
                                  onPress={() =>
                                    handleQuantityChange(
                                      item.id,
                                      -1
                                    )
                                  }
                                >
                                  <Text
                                    style={
                                      styles.quantityButtonText
                                    }
                                  >
                                    −
                                  </Text>
                                </TouchableOpacity>

                                <Text
                                  style={
                                    styles.quantityText
                                  }
                                >
                                  {
                                    item.quantity
                                  }
                                </Text>

                                <TouchableOpacity
                                  style={
                                    styles.quantityButton
                                  }
                                  onPress={() =>
                                    handleQuantityChange(
                                      item.id,
                                      1
                                    )
                                  }
                                >
                                  <Text
                                    style={
                                      styles.quantityButtonText
                                    }
                                  >
                                    +
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <TouchableOpacity
                                style={
                                  styles.removeItemButton
                                }
                                onPress={() =>
                                  handleRemoveFromCart(
                                    item.id
                                  )
                                }
                              >
                                <Text
                                  style={
                                    styles.removeItemText
                                  }
                                >
                                  ×
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                      )}
                    </ScrollView>

                    <View
                      style={
                        styles.cartTotalContainer
                      }
                    >
                      <View
                        style={
                          styles.cartTotalRow
                        }
                      >
                        <Text
                          style={
                            styles.cartTotalLabel
                          }
                        >
                          Total Sales Amount
                        </Text>

                        <Text
                          style={
                            styles.cartTotalValue
                          }
                        >
                          PKR{' '}
                          {totalRevenue.toFixed(
                            2
                          )}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={
                          styles.checkoutButton
                        }
                        onPress={
                          handleCheckout
                        }
                      >
                        <Text
                          style={
                            styles.checkoutButtonText
                          }
                        >
                          Complete Sale
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>

          {/* ================================================== */}
          {/* CART LIMIT MODAL */}
          {/* ================================================== */}

          <Modal
            visible={
              showCartLimitModal
            }
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={
              cancelAddMoreProducts
            }
          >
            <View
              style={
                styles.cartLimitOverlay
              }
            >
              <View
                style={
                  styles.cartLimitModal
                }
              >
                <View
                  style={
                    styles.cartLimitIconContainer
                  }
                >
                  <Text
                    style={
                      styles.cartLimitIcon
                    }
                  >
                    🛒
                  </Text>
                </View>

                <Text
                  style={
                    styles.cartLimitTitle
                  }
                >
                  Cart Limit
                </Text>

                <Text
                  style={
                    styles.cartLimitMessage
                  }
                >
                  Are you sure you want to
                  add more than 5 products?
                </Text>

                <View
                  style={
                    styles.cartLimitButtons
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.cartLimitCancelButton
                    }
                    activeOpacity={0.7}
                    onPress={
                      cancelAddMoreProducts
                    }
                  >
                    <Text
                      style={
                        styles.cartLimitCancelText
                      }
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.cartLimitConfirmButton
                    }
                    activeOpacity={0.7}
                    onPress={
                      confirmAddMoreProducts
                    }
                  >
                    <Text
                      style={
                        styles.cartLimitConfirmText
                      }
                    >
                      Add More
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ================================================== */}
          {/* STOCK LIMIT MODAL */}
          {/* ================================================== */}

          <Modal
            visible={
              showStockLimitModal
            }
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={() =>
              setShowStockLimitModal(false)
            }
          >
            <View
              style={
                styles.stockLimitOverlay
              }
            >
              <View
                style={
                  styles.stockLimitModal
                }
              >
                <View
                  style={
                    styles.stockLimitIconContainer
                  }
                >
                  <Text
                    style={
                      styles.stockLimitIcon
                    }
                  >
                    📦
                  </Text>
                </View>

                <Text
                  style={
                    styles.stockLimitTitle
                  }
                >
                  Stock Limit Reached
                </Text>

                <Text
                  style={
                    styles.stockLimitMessage
                  }
                >
                  There are no more products
                  in inventory available to
                  add.
                </Text>

                <TouchableOpacity
                  style={
                    styles.stockLimitButton
                  }
                  activeOpacity={0.7}
                  onPress={() =>
                    setShowStockLimitModal(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.stockLimitButtonText
                    }
                  >
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ================================================== */}
          {/* RECEIPT MODAL */}
          {/* ================================================== */}

          <Modal
            visible={showReceipt}
            transparent={true}
            animationType="slide"
            onRequestClose={() =>
              setShowReceipt(false)
            }
          >
            <View
              style={
                styles.modalOverlay
              }
            >
              <View
                style={
                  styles.receiptCard
                }
              >
                <Text
                  style={
                    styles.receiptTitle
                  }
                >
                  OFFICIAL SALES RECEIPT
                </Text>

                <Text
                  style={
                    styles.receiptInvoice
                  }
                >
                  Invoice No:{' '}
                  {
                    completedTransaction?.invoiceNumber
                  }
                </Text>

                <Text
                  style={
                    styles.receiptDate
                  }
                >
                  Sale Date:{' '}
                  {
                    completedTransaction?.date
                  }
                </Text>

                <ScrollView
                  style={
                    styles.receiptList
                  }
                >
                  {completedTransaction?.items?.map(
                    (item) => {
                      const lineTotal =
                        calculateItemRevenue(
                          item
                        );

                      return (
                        <View
                          key={
                            item.id
                          }
                          style={
                            styles.receiptRow
                          }
                        >
                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.receiptItemName
                              }
                            >
                              {item.name ||
                                item.productName}
                            </Text>

                            <Text
                              style={
                                styles.receiptItemSub
                              }
                            >
                              Qty Sold:{' '}
                              {
                                item.quantity
                              }
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.receiptItemPrice
                            }
                          >
                            PKR{' '}
                            {lineTotal.toFixed(
                              2
                            )}
                          </Text>
                        </View>
                      );
                    }
                  )}
                </ScrollView>

                <View
                  style={
                    styles.receiptSummary
                  }
                >
                  <View
                    style={
                      styles.totalRow
                    }
                  >
                    <Text
                      style={
                        styles.receiptSummaryLabel
                      }
                    >
                      TOTAL:
                    </Text>

                    <Text
                      style={
                        styles.totalValue
                      }
                    >
                      PKR{' '}
                      {completedTransaction?.totalRevenue?.toFixed(
                        2
                      )}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={
                    styles.closeReceiptBtn
                  }
                  onPress={() =>
                    setShowReceipt(false)
                  }
                >
                  <Text
                    style={
                      styles.closeReceiptText
                    }
                  >
                    Close & Return to Dashboard
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  contentPadding: {
    padding: 16,
  },

  // ============================================================
  // KPI
  // ============================================================

  kpiGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  kpiLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },

  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },

  lowStockValue: {
    color: '#EF4444',
  },

  // ============================================================
  // SALE DATE
  // ============================================================

  saleDateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  saleDateLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
    marginBottom: 6,
  },

  saleDateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  saleDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  changeDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // ============================================================
  // QUICK SEARCH
  // ============================================================

  quickSearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },

  quickSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 12,
  },

  quickSearchTitleArea: {
    flex: 1,
    paddingRight: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  quickSearchSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  // ============================================================
  // CART HEADER
  // ============================================================

  headerCartButton: {
    width: 48,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  headerCartIcon: {
    fontSize: 22,
  },

  cartCountBadge: {
    position: 'absolute',
    right: -4,
    top: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  cartCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  // ============================================================
  // SEARCH
  // ============================================================

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },

  searchIcon: {
    fontSize: 17,
    marginLeft: 13,
    marginRight: 6,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 5,
    fontSize: 14,
    color: '#111827',
  },

  clearSearchButton: {
    width: 32,
    height: 32,
    marginRight: 7,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  clearSearchText: {
    fontSize: 22,
    lineHeight: 22,
    color: '#6B7280',
  },

  // ============================================================
  // PRODUCT LIST
  // ============================================================

  productListContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  productList: {
    backgroundColor: '#FFFFFF',
  },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },

  listHeaderText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6B7280',
    letterSpacing: 0.5,
  },

  listCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },

  productRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },

  outOfStockRow: {
    backgroundColor: '#FAFAFA',
  },

  productInfo: {
    flex: 1,
    paddingRight: 10,
  },

  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  productSku: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 3,
  },

  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  productPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563EB',
    marginRight: 8,
  },

  stockBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },

  lowStockBadge: {
    backgroundColor: '#FEF3C7',
  },

  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
  },

  stockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },

  outOfStockBadgeText: {
    color: '#B91C1C',
  },

  // ============================================================
  // ADD BUTTON
  // ============================================================

  addToCartButton: {
    minWidth: 108,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addToCartIcon: {
    fontSize: 14,
    marginRight: 5,
  },

  addToCartText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  disabledAddToCartButton: {
    backgroundColor: '#9CA3AF',
  },

  // ============================================================
  // NO PRODUCTS
  // ============================================================

  noProductsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
  },

  noProductsIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  noProductsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },

  noProductsText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },

  // ============================================================
  // CART MODAL
  // ============================================================

  cartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  cartModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '85%',
    minHeight: '45%',
    paddingTop: 18,
  },

  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  cartModalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111827',
  },

  cartModalSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  closeCartButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeCartText: {
    fontSize: 25,
    lineHeight: 25,
    color: '#374151',
  },

  // ============================================================
  // EMPTY CART
  // ============================================================

  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },

  emptyCartIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyCartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  emptyCartText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },

  continueShoppingButton: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },

  continueShoppingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // ============================================================
  // CART ITEMS
  // ============================================================

  cartItemsList: {
    paddingHorizontal: 18,
  },

  cartModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  cartModalItemInfo: {
    flex: 1,
    paddingRight: 8,
  },

  cartModalItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },

  cartModalItemPrice: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 3,
  },

  cartModalItemTotal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563EB',
    marginTop: 3,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  quantityText: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },

  removeItemButton: {
    width: 27,
    height: 27,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeItemText: {
    fontSize: 19,
    lineHeight: 20,
    fontWeight: '700',
    color: '#DC2626',
  },

  // ============================================================
  // CART TOTAL
  // ============================================================

  cartTotalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },

  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  cartTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },

  cartTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },

  checkoutButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 9,
    alignItems: 'center',
  },

  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  // ============================================================
  // CART LIMIT MODAL
  // ============================================================

  cartLimitOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  cartLimitModal: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 5,
    borderTopColor:
      COLORS.accentYellow ||
      '#FACC15',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  cartLimitIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor:
      COLORS.accentYellow ||
      '#FACC15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  cartLimitIcon: {
    fontSize: 25,
  },

  cartLimitTitle: {
    fontSize: 20,
    fontWeight: '800',
    color:
      COLORS.darkBlue ||
      '#0F172A',
    marginBottom: 8,
  },

  cartLimitMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 22,
  },

  cartLimitButtons: {
    width: '100%',
    flexDirection: 'row',
  },

  cartLimitCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },

  cartLimitCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },

  cartLimitConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  cartLimitConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ============================================================
  // STOCK LIMIT MODAL
  // ============================================================

  stockLimitOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  stockLimitModal: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 5,
    borderTopColor:
      COLORS.accentYellow ||
      '#FACC15',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  stockLimitIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor:
      COLORS.accentYellow ||
      '#FACC15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  stockLimitIcon: {
    fontSize: 25,
  },

  stockLimitTitle: {
    fontSize: 20,
    fontWeight: '800',
    color:
      COLORS.darkBlue ||
      '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },

  stockLimitMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 22,
  },

  stockLimitButton: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  stockLimitButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ============================================================
  // RECEIPT
  // ============================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
  },

  receiptTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  receiptInvoice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 5,
  },

  receiptDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 5,
    marginBottom: 12,
  },

  receiptList: {
    maxHeight: 220,
  },

  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  receiptItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  receiptItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  receiptItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 10,
  },

  receiptSummary: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  receiptSummaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },

  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },

  closeReceiptBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },

  closeReceiptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});