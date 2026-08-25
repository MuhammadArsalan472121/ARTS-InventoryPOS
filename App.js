import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { db } from './firebaseConfig';

import { COLORS } from './src/constants/theme';


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

  // =====================================================
  // PRODUCTS
  // =====================================================

  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    console.log('🔥 loadProducts CALLED');
  try {
    const snapshot = await getDocs(
      collection(db, 'products')
    );
                                                                       
    const firebaseProducts = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    // Products
    setProducts(firebaseProducts);

    // Inventory comes from the same Firebase products
    const firebaseInventory = firebaseProducts.map((product) => ({
      id: product.id,
      name: product.name,
      stock: Number(product.stock) || 0,
      minStock: Number(product.minStock) || 5,
      price: Number(product.price) || 0,
      costPrice: Number(product.costPrice) || 0,
    }));

    setInventoryItems(firebaseInventory);

    console.log('Products loaded:', firebaseProducts);
    console.log('Inventory loaded:', firebaseInventory);

  } catch (error) {
    console.log('Error loading products:', error);
  }
};

  
  const [currentScreen, setCurrentScreen] = useState('SIGN_IN');
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  const [salesTransactions, setSalesTransactions] = useState([]);
  const loadSales = async () => {
  try {
    const snapshot = await getDocs(
      collection(db, 'sales')
    );

    const firebaseSales = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    setSalesTransactions(firebaseSales);

    console.log(
      'Sales loaded from Firebase:',
      firebaseSales
    );

  } catch (error) {
    console.log(
      'Error loading sales:',
      error
    );
  }
};

const loadStockMovements = async () => {
  try {
    const snapshot = await getDocs(
      collection(db, 'stockMovements')
    );

    const firebaseMovements = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    setStockTransactions(firebaseMovements);

    console.log(
      'Stock movements loaded from Firebase:',
      firebaseMovements
    );

  } catch (error) {
    console.log(
      'Error loading stock movements:',
      error
    );
  }
};

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

  

  const [inventoryItems, setInventoryItems] = useState([]);

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

  const handleSignIn = async (credentials) => {
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

  // Load Firebase data in parallel
  try {
  await Promise.all([
    loadProducts(),
    loadSales(),
    loadStockMovements(),
  ]);
} catch (error) {
  console.log('Error loading app data:', error);
}
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

  const handleRecordSale = async (newTx) => {
  if (!newTx) return;

  try {
    const transaction = {
      ...newTx,
      id: newTx.id || String(Date.now()),
      date: newTx.date || getLocalDateString(),
      timestamp:
        newTx.timestamp || new Date().toISOString(),
    };

    // Save sale to Firebase
    const docRef = await addDoc(
      collection(db, 'sales'),
      transaction
    );

    // Add Firebase ID to local state
    const firebaseTransaction = {
      ...transaction,
      id: docRef.id,
    };

    setSalesTransactions((prev) => [
      firebaseTransaction,
      ...prev,
    ]);

    console.log(
      'Sale saved to Firebase:',
      firebaseTransaction
    );

  } catch (error) {
    console.log(
      'Firebase sale error:',
      error
    );

    Alert.alert(
      'Error',
      'Unable to save sale.'
    );
  }
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

  const recordStockMovement = async ({
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
    productId,
    productName,
    quantity: qty,
    action,
    date: getLocalDateString(),
    timestamp: new Date().toISOString(),
  };

  try {
    // Save permanently in Firebase
    const docRef = await addDoc(
      collection(db, 'stockMovements'),
      movement
    );

    const firebaseMovement = {
      id: docRef.id,
      ...movement,
    };

    // Keep local state updated immediately
    setStockTransactions((prev) => [
      firebaseMovement,
      ...prev,
    ]);

    console.log(
      'Stock movement saved:',
      firebaseMovement
    );

  } catch (error) {
    console.log(
      'Firebase stock movement error:',
      error
    );
  }
};

  // =====================================================
  // QUICK INVENTORY STOCK UPDATE
  // =====================================================

  const handleQuickStockUpdate = async (item, newStock) => {
  if (!item) return;

  const updatedStock = Number(newStock) || 0;

  if (updatedStock < 0) return;

  try {
    // Update Firebase
    await updateDoc(
      doc(db, 'products', item.id),
      {
        stock: updatedStock,
      }
    );

    // Update Products state
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

    // Update Inventory state
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

    console.log('Stock updated in Firebase');

  } catch (error) {
    console.log('Firebase stock update error:', error);

    Alert.alert(
      'Error',
      'Unable to update stock.'
    );
  }
};

  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  const handleSaveProduct = async (formData) => {
  try {
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
      const productRef = doc(
        db,
        'products',
        editingProduct.id
      );

      await updateDoc(productRef, formattedData);

      const updatedProduct = {
        ...editingProduct,
        ...formattedData,
      };

      setProducts(
        currentProducts.map((p) =>
          p.id === editingProduct.id
            ? updatedProduct
            : p
        )
      );

      // Update inventory locally
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

      Alert.alert(
        'Success',
        'Product updated successfully.'
      );
    }

    // =====================================================
    // ADD NEW PRODUCT
    // =====================================================

    else {
      const docRef = await addDoc(
        collection(db, 'products'),
        formattedData
      );

      const newProduct = {
        id: docRef.id,
        ...formattedData,
      };

      // Add to React state
      setProducts((prev) => [
        ...prev,
        newProduct,
      ]);

      // Add inventory locally
      setInventoryItems((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: formData.name,
          stock: numStock,
          minStock: 5,
          price: numPrice,
          costPrice: numCost,
        },
      ]);

      if (numStock > 0) {
        recordStockMovement({
          productId: docRef.id,
          productName: formData.name,
          quantity: numStock,
          action: 'ADD',
        });
      }

      Alert.alert(
        'Success',
        'Product added successfully.'
      );
    }

    setProductModalVisible(false);
    setEditingProduct(null);

  } catch (error) {
    console.log(
      'Firebase product save error:',
      error
    );

    Alert.alert(
      'Error',
      'Unable to save product. Please try again.'
    );
  }
};

  

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

 const handleDeleteProduct = async (id) => {
  try {
    await deleteDoc(
      doc(db, 'products', id)
    );

    setProducts((prev) =>
      (prev || []).filter(
        (product) => product.id !== id
      )
    );

    setInventoryItems((prev) =>
      (prev || []).filter(
        (item) => item.id !== id
      )
    );

    Alert.alert(
      'Success',
      'Product deleted successfully.'
    );

  } catch (error) {
    console.log(
      'Firebase product delete error:',
      error
    );

    Alert.alert(
      'Error',
      'Unable to delete product.'
    );
  }
};
  // =====================================================
  // SAVE INVENTORY
  // =====================================================

  const handleSaveInventory = async (formData) => {
  const currentInventory = inventoryItems || [];
  const numStock = Number(formData.stock) || 0;

  try {
    // =====================================================
    // EDIT INVENTORY
    // =====================================================

    if (editingInventory) {
      const oldItem = currentInventory.find(
        (i) => i.id === editingInventory.id
      );

      const oldStock = Number(oldItem?.stock) || 0;
      const stockDifference = numStock - oldStock;

      // Update Firebase
      await updateDoc(
        doc(db, 'products', editingInventory.id),
        {
          ...formData,
          stock: numStock,
        }
      );

      // Update Inventory state
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

      // Update Products state
      setProducts((prev) =>
        (prev || []).map((p) =>
          p.id === editingInventory.id
            ? {
                ...p,
                ...formData,
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

      Alert.alert(
        'Success',
        'Inventory updated successfully.'
      );
    }

    // =====================================================
    // ADD INVENTORY ITEM
    // =====================================================

    else {
      // IMPORTANT:
      // Inventory should normally belong to a product.
      // So for now, do NOT create a separate Firebase
      // inventory document here.
      Alert.alert(
        'Info',
        'Add a new product from the Products screen. Its inventory will be created automatically.'
      );

      return;
    }

    setInventoryModalVisible(false);
    setEditingInventory(null);

  } catch (error) {
    console.log(
      'Firebase inventory save error:',
      error
    );

    Alert.alert(
      'Error',
      'Unable to save inventory. Please try again.'
    );
  }
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