import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

import { COLORS } from './src/constants/theme';
import { INITIAL_PRODUCTS, INITIAL_INVENTORY } from './src/mock/initialData';

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

  // 👤 Dynamic User State
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@artech.ph',
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const [products, setProducts] = useState(INITIAL_PRODUCTS || []);
  const [inventoryItems, setInventoryItems] = useState(INITIAL_INVENTORY || []);

  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);

  // Handle Login
  const handleSignIn = (credentials) => {
    if (credentials?.email) {
      const email = credentials.email;
      const extractedName = credentials.name || email.split('@')[0].toUpperCase();
      setUser({ name: extractedName, email: email });
    }
    setCurrentScreen('APP');
  };

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    setProfileModalVisible(false);
  };

  // Product Actions (Syncs with Inventory)
  const handleSaveProduct = (formData) => {
    const currentProducts = products || [];
    const currentInventory = inventoryItems || [];

    if (editingProduct) {
      setProducts(currentProducts.map((p) => (p.id === editingProduct.id ? { ...p, ...formData } : p)));
      setInventoryItems(
        currentInventory.map((item) =>
          item.id === editingProduct.id ? { ...item, name: formData.name, stock: Number(formData.stock) || 0 } : item
        )
      );
    } else {
      const newId = String(Date.now());
      setProducts([...currentProducts, { id: newId, ...formData }]);
      setInventoryItems([
        ...currentInventory,
        { id: newId, name: formData.name, stock: Number(formData.stock) || 0, minStock: 5 },
      ]);
    }
    setProductModalVisible(false);
  };

  const handleDeleteProduct = (id) => {
    setProducts((products || []).filter((p) => p.id !== id));
    setInventoryItems((inventoryItems || []).filter((i) => i.id !== id));
  };

  const handleSaveInventory = (formData) => {
    const currentInventory = inventoryItems || [];
    if (editingInventory) {
      setInventoryItems(currentInventory.map((i) => (i.id === editingInventory.id ? { ...i, ...formData } : i)));
      setProducts((products || []).map((p) => (p.id === editingInventory.id ? { ...p, stock: Number(formData.stock) || 0 } : p)));
    } else {
      setInventoryItems([...currentInventory, { id: String(Date.now()), ...formData }]);
    }
    setInventoryModalVisible(false);
  };

  const handleDeleteInventory = (id) => {
    setInventoryItems((inventoryItems || []).filter((i) => i.id !== id));
  };

  if (currentScreen === 'SIGN_IN') {
    return (
      <SignInScreen
        onSignIn={handleSignIn}
        onNavigateSignUp={() => setCurrentScreen('SIGN_UP')}
        onNavigateRecover={() => setCurrentScreen('RECOVER_PASSWORD')}
      />
    );
  }

  if (currentScreen === 'SIGN_UP') {
    return (
      <SignUpScreen
        onSignUpSuccess={() => setCurrentScreen('SIGN_IN')}
        onNavigateSignIn={() => setCurrentScreen('SIGN_IN')}
      />
    );
  }

  if (currentScreen === 'RECOVER_PASSWORD') {
    return (
      <RecoverPasswordScreen
        onSendReset={() => setCurrentScreen('SIGN_IN')}
        onNavigateSignIn={() => setCurrentScreen('SIGN_IN')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />

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

      {activeTab === 'DASHBOARD' && (
        <DashboardScreen
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          user={user}
          productsCount={products?.length || 0}
          inventoryItems={inventoryItems || []}
        />
      )}

      {activeTab === 'PRODUCTS' && (
        <ProductsScreen
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          user={user}
          products={products || []}
          onOpenAdd={() => {
            setEditingProduct(null);
            setProductModalVisible(true);
          }}
          onOpenEdit={(p) => {
            setEditingProduct(p);
            setProductModalVisible(true);
          }}
          onDelete={handleDeleteProduct}
        />
      )}

      {activeTab === 'INVENTORY' && (
        <InventoryScreen
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
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
        />
      )}

      {activeTab === 'REPORTS' && (
        <ReportsScreen
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          user={user}
          inventoryItems={inventoryItems || []}
        />
      )}

      {/* Modals */}
      <ProfileModal
        visible={profileModalVisible}
        user={user}
        onClose={() => setProfileModalVisible(false)}
        onSave={handleUpdateProfile}
      />

      <ProductModal
        visible={productModalVisible}
        product={editingProduct}
        onClose={() => setProductModalVisible(false)}
        onSave={handleSaveProduct}
      />

      <InventoryModal
        visible={inventoryModalVisible}
        item={editingInventory}
        onClose={() => setInventoryModalVisible(false)}
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