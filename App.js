import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';

import { COLORS } from './src/constants/theme';
import {
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
} from './src/mock/initialData';

import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import RecoverPasswordScreen from './src/screens/RecoverPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ReportsScreen from './src/screens/ReportsScreen';

import SideMenu from './src/components/SideMenu';
import ProductModal from './src/components/ProductModal';
import InventoryModal from './src/components/InventoryModal';
import ProfileModal from './src/components/ProfileModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('SIGN_IN');
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  const [salesTransactions, setSalesTransactions] = useState([]);

  const [stockTransactions, setStockTransactions] = useState([]);

  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@artech.ph',
  });

  const [profileModalVisible, setProfileModalVisible] =
    useState(false);

  // =====================================================
  // PRODUCTS + INVENTORY
  // =====================================================

  const [products, setProducts] = useState(
    INITIAL_PRODUCTS || []
  );

  const [inventoryItems, setInventoryItems] = useState(
    INITIAL_INVENTORY || []
  );

  // =====================================================
  // MODALS
  // =====================================================

  const [productModalVisible, setProductModalVisible] =
    useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  const [inventoryModalVisible, setInventoryModalVisible] =
    useState(false);

  const [editingInventory, setEditingInventory] =
    useState(null);

  // =====================================================
  // LOCAL DATE
  // =====================================================

  const getLocalDateString = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // =====================================================
  // SIGN IN
  // =====================================================

  const handleSignIn = (credentials) => {
    if (credentials?.email) {
      const email = credentials.email;

      const extractedName =
        credentials.name ||
        email.split('@')[0].toUpperCase();

      setUser({
        name: extractedName,
        email,
      });
    }

    setCurrentScreen('APP');
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    setProfileModalVisible(false);
  };

  // =====================================================
  // RECORD SALE
  // =====================================================

  const handleRecordSale = (newTx) => {
    if (!newTx) return;

    const transaction = {
      ...newTx,
      id: newTx.id || String(Date.now()),
      date: newTx.date || getLocalDateString(),
      timestamp:
        newTx.timestamp || new Date().toISOString(),
    };

    setSalesTransactions((prev) => [
      transaction,
      ...prev,
    ]);
  };

  // =====================================================
  // UPDATE INVENTORY FROM POS
  // =====================================================

  const handleUpdateInventory = (updatedInventory) => {
    setInventoryItems(updatedInventory);

    setProducts((prevProducts) =>
      (prevProducts || []).map((prod) => {
        const match = updatedInventory.find(
          (inv) => inv.id === prod.id
        );

        return match
          ? {
              ...prod,
              stock: match.stock,
            }
          : prod;
      })
    );
  };

  // =====================================================
  // RECORD STOCK MOVEMENT
  // =====================================================

  const recordStockMovement = ({
    productId,
    productName,
    quantity,
    action,
  }) => {
    const qty = Number(quantity) || 0;

    if (!qty || qty <= 0) {
      return;
    }

    const movement = {
      id: `${Date.now()}-${Math.random()}`,
      productId,
      productName,
      quantity: qty,
      action,
      date: getLocalDateString(),
      timestamp: new Date().toISOString(),
    };

    setStockTransactions((prev) => [
      movement,
      ...prev,
    ]);
  };

  // =====================================================
  // QUICK INVENTORY STOCK UPDATE
  // =====================================================

  const handleQuickStockUpdate = (item, newStock) => {
    if (!item) return;

    const oldStock = Number(item.stock) || 0;
    const updatedStock = Number(newStock) || 0;

    if (updatedStock < 0) return;

    const difference = updatedStock - oldStock;

    // Update inventory
    setInventoryItems((prev) =>
      (prev || []).map((inventoryItem) =>
        inventoryItem.id === item.id
          ? {
              ...inventoryItem,
              stock: updatedStock,
            }
          : inventoryItem
      )
    );

    // Keep Products synchronized
    setProducts((prev) =>
      (prev || []).map((product) =>
        product.id === item.id
          ? {
              ...product,
              stock: updatedStock,
            }
          : product
      )
    );

    // Record actual movement
    if (difference > 0) {
      recordStockMovement({
        productId: item.id,
        productName: item.name,
        quantity: difference,
        action: 'ADD',
      });
    }

    if (difference < 0) {
      recordStockMovement({
        productId: item.id,
        productName: item.name,
        quantity: Math.abs(difference),
        action: 'REMOVE',
      });
    }
  };

  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  const handleSaveProduct = (formData) => {
    const currentProducts = products || [];
    const currentInventory = inventoryItems || [];

    const numStock = Number(formData.stock) || 0;
    const numPrice = Number(formData.price) || 0;
    const numCost = Number(formData.costPrice) || 0;

    const formattedData = {
      ...formData,
      stock: numStock,
      price: numPrice,
      costPrice: numCost,
      profit: (numPrice - numCost).toFixed(2),
    };

    // =====================================================
    // EDIT EXISTING PRODUCT
    // =====================================================

    if (editingProduct) {
      const oldProduct = currentProducts.find(
        (p) => p.id === editingProduct.id
      );

      const oldStock = Number(oldProduct?.stock) || 0;

      const stockDifference = numStock - oldStock;

      // Update products
      setProducts(
        currentProducts.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...formattedData,
              }
            : p
        )
      );

      // Update inventory
      setInventoryItems(
        currentInventory.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                name: formData.name,
                stock: numStock,
                price: numPrice,
                costPrice: numCost,
              }
            : item
        )
      );

      // Only increase is IN
      if (stockDifference > 0) {
        recordStockMovement({
          productId: editingProduct.id,
          productName: formData.name,
          quantity: stockDifference,
          action: 'ADD',
        });
      }

      // Decrease is REMOVE
      if (stockDifference < 0) {
        recordStockMovement({
          productId: editingProduct.id,
          productName: formData.name,
          quantity: Math.abs(stockDifference),
          action: 'REMOVE',
        });
      }
    }

    // =====================================================
    // ADD NEW PRODUCT
    // =====================================================

    else {
      const newId = String(Date.now());

      // Add product
      setProducts([
        ...currentProducts,
        {
          id: newId,
          ...formattedData,
        },
      ]);

      // Add inventory
      setInventoryItems([
        ...currentInventory,
        {
          id: newId,
          name: formData.name,
          stock: numStock,
          minStock: 5,
          price: numPrice,
          costPrice: numCost,
        },
      ]);

      // IMPORTANT:
      // Initial product stock = STOCK IN
      if (numStock > 0) {
        recordStockMovement({
          productId: newId,
          productName: formData.name,
          quantity: numStock,
          action: 'ADD',
        });
      }
    }

    setProductModalVisible(false);
    setEditingProduct(null);
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDeleteProduct = (id) => {
    setProducts(
      (products || []).filter(
        (product) => product.id !== id
      )
    );

    setInventoryItems(
      (inventoryItems || []).filter(
        (item) => item.id !== id
      )
    );
  };

  // =====================================================
  // SAVE INVENTORY
  // =====================================================

  const handleSaveInventory = (formData) => {
    const currentInventory = inventoryItems || [];

    const numStock = Number(formData.stock) || 0;

    // =====================================================
    // EDIT INVENTORY
    // =====================================================

    if (editingInventory) {
      const oldItem = currentInventory.find(
        (i) => i.id === editingInventory.id
      );

      const oldStock = Number(oldItem?.stock) || 0;

      const stockDifference = numStock - oldStock;

      // Update inventory
      setInventoryItems(
        currentInventory.map((i) =>
          i.id === editingInventory.id
            ? {
                ...i,
                ...formData,
                stock: numStock,
              }
            : i
        )
      );

      // Synchronize product
      setProducts(
        (products || []).map((p) =>
          p.id === editingInventory.id
            ? {
                ...p,
                stock: numStock,
              }
            : p
        )
      );

      // Stock IN
      if (stockDifference > 0) {
        recordStockMovement({
          productId: editingInventory.id,
          productName:
            formData.name || editingInventory.name,
          quantity: stockDifference,
          action: 'ADD',
        });
      }

      // Stock OUT
      if (stockDifference < 0) {
        recordStockMovement({
          productId: editingInventory.id,
          productName:
            formData.name || editingInventory.name,
          quantity: Math.abs(stockDifference),
          action: 'REMOVE',
        });
      }
    }

    // =====================================================
    // ADD INVENTORY ITEM
    // =====================================================

    else {
      const newId = String(Date.now());

      const newItem = {
        id: newId,
        stock: numStock,
        ...formData,
      };

      setInventoryItems([
        ...currentInventory,
        newItem,
      ]);

      // Initial stock = IN
      if (numStock > 0) {
        recordStockMovement({
          productId: newId,
          productName: formData.name,
          quantity: numStock,
          action: 'ADD',
        });
      }
    }

    setInventoryModalVisible(false);
    setEditingInventory(null);
  };

  // =====================================================
  // DELETE INVENTORY
  // =====================================================

  const handleDeleteInventory = (id) => {
    setInventoryItems(
      (inventoryItems || []).filter(
        (item) => item.id !== id
      )
    );
  };

  // =====================================================
  // AUTH SCREENS
  // =====================================================

  if (currentScreen === 'SIGN_IN') {
    return (
      <SignInScreen
        onSignIn={handleSignIn}
        onNavigateSignUp={() =>
          setCurrentScreen('SIGN_UP')
        }
        onNavigateRecover={() =>
          setCurrentScreen('RECOVER_PASSWORD')
        }
      />
    );
  }

  if (currentScreen === 'SIGN_UP') {
    return (
      <SignUpScreen
        onSignUpSuccess={() =>
          setCurrentScreen('SIGN_IN')
        }
        onNavigateSignIn={() =>
          setCurrentScreen('SIGN_IN')
        }
      />
    );
  }

  if (currentScreen === 'RECOVER_PASSWORD') {
    return (
      <RecoverPasswordScreen
        onSendReset={() =>
          setCurrentScreen('SIGN_IN')
        }
        onNavigateSignIn={() =>
          setCurrentScreen('SIGN_IN')
        }
      />
    );
  }

  // =====================================================
  // MAIN APP
  // =====================================================

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.darkBlue}
      />

      {/* SIDE MENU */}

      <SideMenu
        visible={isMenuOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onClose={() => setIsMenuOpen(false)}
        onSignOut={() => {
          setIsMenuOpen(false);
          setCurrentScreen('SIGN_IN');
        }}
      />

      {/* DASHBOARD */}

      {activeTab === 'DASHBOARD' && (
        <DashboardScreen
          onOpenMenu={() =>
            setIsMenuOpen(true)
          }
          onOpenProfile={() =>
            setProfileModalVisible(true)
          }
          user={user}
          products={products || []}
          productsCount={products?.length || 0}
          inventoryItems={inventoryItems || []}
          onUpdateInventory={handleUpdateInventory}
          onRecordSale={handleRecordSale}
        />
      )}

      {/* PRODUCTS */}

      {activeTab === 'PRODUCTS' && (
        <ProductsScreen
          onOpenMenu={() =>
            setIsMenuOpen(true)
          }
          onOpenProfile={() =>
            setProfileModalVisible(true)
          }
          user={user}
          products={products || []}
          onOpenAdd={() => {
            setEditingProduct(null);
            setProductModalVisible(true);
          }}
          onOpenEdit={(product) => {
            setEditingProduct(product);
            setProductModalVisible(true);
          }}
          onDelete={handleDeleteProduct}
        />
      )}

      {/* INVENTORY */}

      {activeTab === 'INVENTORY' && (
        <InventoryScreen
          onOpenMenu={() =>
            setIsMenuOpen(true)
          }
          onOpenProfile={() =>
            setProfileModalVisible(true)
          }
          user={user}
          inventoryItems={inventoryItems || []}
          onOpenAdd={() => {
            setEditingInventory(null);
            setInventoryModalVisible(true);
          }}
          onOpenEdit={(item) => {
            setEditingInventory(item);
            setInventoryModalVisible(true);
          }}
          onDelete={handleDeleteInventory}
          onStockUpdate={handleQuickStockUpdate}
        />
      )}

      {/* REPORTS */}

      {activeTab === 'REPORTS' && (
        <ReportsScreen
          onOpenMenu={() =>
            setIsMenuOpen(true)
          }
          onOpenProfile={() =>
            setProfileModalVisible(true)
          }
          user={user}
          inventoryItems={inventoryItems || []}
          salesTransactions={salesTransactions || []}
          stockTransactions={stockTransactions || []}
        />
      )}

      {/* PROFILE */}

      <ProfileModal
        visible={profileModalVisible}
        user={user}
        onClose={() =>
          setProfileModalVisible(false)
        }
        onSave={handleUpdateProfile}
      />

      {/* PRODUCT MODAL */}

      <ProductModal
        visible={productModalVisible}
        product={editingProduct}
        onClose={() => {
          setProductModalVisible(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* INVENTORY MODAL */}

      <InventoryModal
        visible={inventoryModalVisible}
        item={editingInventory}
        onClose={() => {
          setInventoryModalVisible(false);
          setEditingInventory(null);
        }}
        onSave={handleSaveInventory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
});