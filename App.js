
import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

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

  const [productNotice, setProductNotice] = useState(null);
  const [products, setProducts] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [productBusy, setProductBusy] = useState(false);

  const loadProducts = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, 'products')
      );

      const firebaseProducts = snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data(),
        })
      );

      setProducts(firebaseProducts);

      const firebaseInventory =
        firebaseProducts.map((product) => ({
          id: product.id,
          name: product.name,
          stock: Number(product.stock) || 0,
          minStock:
            Number(product.minStock) || 5,
          price: Number(product.price) || 0,
          costPrice:
            Number(product.costPrice) || 0,
        }));

      setInventoryItems(
        firebaseInventory
      );

    } catch (error) {
      console.log(
        'Error loading products:',
        error
      );
    }
  };

  // =====================================================
  // SCREEN / MENU
  // =====================================================

  const [currentScreen, setCurrentScreen] =
    useState('SIGN_IN');

  const [activeTab, setActiveTab] =
    useState('DASHBOARD');

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  const [salesTransactions, setSalesTransactions] =
    useState([]);

  const [stockTransactions, setStockTransactions] =
    useState([]);

  const loadSales = async () => {
  try {
    const snapshot = await getDocs(
      collection(db, 'sales')
    );

    const firebaseSales =
      snapshot.docs.map(
        (document) => ({
          ...document.data(),
          id: document.id,
        })
      );

    setSalesTransactions(
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
        collection(
          db,
          'stockMovements'
        )
      );

      const firebaseMovements =
        snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

      setStockTransactions(
        firebaseMovements
      );

    } catch (error) {
      console.log(
        'Error loading stock movements:',
        error
      );
    }
  };

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
  // INVENTORY
  // =====================================================

  const [inventoryItems, setInventoryItems] =
    useState([]);

  // =====================================================
  // MODALS
  // =====================================================

  const [productModalVisible, setProductModalVisible] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [inventoryModalVisible, setInventoryModalVisible] =
    useState(false);

  const [editingInventory, setEditingInventory] =
    useState(null);

  // =====================================================
  // LOCAL DATE
  // =====================================================

  const getLocalDateString = () => {
    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        now.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // =====================================================
  // SIGN IN
  // =====================================================

  const handleSignIn = async (
    credentials
  ) => {

    if (credentials?.email) {

      const email =
        credentials.email;

      const extractedName =
        credentials.name ||
        email
          .split('@')[0]
          .toUpperCase();

      setUser({
        name: extractedName,
        email,
      });
    }

    setCurrentScreen('APP');

    try {

      await Promise.all([
        loadProducts(),
        loadSales(),
        loadStockMovements(),
      ]);

    } catch (error) {

      console.log(
        'Error loading app data:',
        error
      );
    }
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const handleUpdateProfile = (
    updatedUser
  ) => {

    setUser(updatedUser);

    setProfileModalVisible(
      false
    );
  };

  // =====================================================
  // RECORD SALE FROM POS
  // =====================================================

  const handleRecordSale = async (
    newTx
  ) => {

    if (!newTx) return;

    try {

      const transaction = {
        ...newTx,

        id:
          newTx.id ||
          String(Date.now()),

        date:
          newTx.date ||
          getLocalDateString(),

        timestamp:
          newTx.timestamp ||
          new Date().toISOString(),
      };

      const docRef =
        await addDoc(
          collection(db, 'sales'),
          transaction
        );

      const firebaseTransaction = {
        ...transaction,
        id: docRef.id,
      };

      setSalesTransactions(
        (prev) => [
          firebaseTransaction,
          ...prev,
        ]
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
  // REPORT SALES MANAGEMENT
  // =====================================================

  const handleAddReportSale = async (
    saleData
  ) => {

    try {

      const items =
        Array.isArray(
          saleData.items
        )
          ? saleData.items
          : [];

      if (!items.length) {
        return false;
      }

      // -------------------------------------------------
      // CHECK CURRENT STOCK
      // -------------------------------------------------

      for (const item of items) {

        const inventoryItem =
          (inventoryItems || []).find(
            (inventory) =>
              inventory.id ===
              item.productId
          );

        if (!inventoryItem) {
          Alert.alert(
            'Product Not Found',
            `${item.productName} is no longer available in Inventory.`
          );

          return false;
        }

        const currentStock =
          Number(
            inventoryItem.stock
          ) || 0;

        const requestedQuantity =
          Number(
            item.quantity
          ) || 0;

        if (
          requestedQuantity >
          currentStock
        ) {

          Alert.alert(
            'Insufficient Stock',
            `${item.productName} has only ${currentStock} item(s) available.`
          );

          return false;
        }
      }

      // -------------------------------------------------
      // CREATE SALE
      // -------------------------------------------------

      const sale = {
        date:
          saleData.date,

        items:
          items.map((item) => ({
            productId:
              item.productId,

            productName:
              item.productName,

            quantity:
              Number(
                item.quantity
              ) || 0,

            price:
              Number(
                item.price
              ) || 0,

            costPrice:
              Number(
                item.costPrice
              ) || 0,
          })),

        totalRevenue:
          Number(
            saleData.totalRevenue
          ) || 0,

        totalProfit:
          Number(
            saleData.totalProfit
          ) || 0,

        timestamp:
          saleData.timestamp ||
          new Date().toISOString(),
      };

      // -------------------------------------------------
      // SAVE SALE TO FIREBASE
      // -------------------------------------------------

      const docRef =
        await addDoc(
          collection(db, 'sales'),
          sale
        );

      const firebaseSale = {
        id: docRef.id,
        ...sale,
      };

      // -------------------------------------------------
      // UPDATE FIREBASE INVENTORY
      // -------------------------------------------------

      for (const item of items) {

        const inventoryItem =
          (inventoryItems || []).find(
            (inventory) =>
              inventory.id ===
              item.productId
          );

        if (!inventoryItem) {
          continue;
        }

        const oldStock =
          Number(
            inventoryItem.stock
          ) || 0;

        const quantitySold =
          Number(
            item.quantity
          ) || 0;

        const newStock =
          oldStock -
          quantitySold;

        await updateDoc(
          doc(
            db,
            'products',
            item.productId
          ),
          {
            stock: newStock,
          }
        );
      }

      // -------------------------------------------------
      // UPDATE LOCAL INVENTORY
      // -------------------------------------------------

      setInventoryItems(
        (prev) =>
          (prev || []).map(
            (inventoryItem) => {

              const soldItem =
                items.find(
                  (item) =>
                    item.productId ===
                    inventoryItem.id
                );

              if (!soldItem) {
                return inventoryItem;
              }

              return {
                ...inventoryItem,

                stock:
                  (Number(
                    inventoryItem.stock
                  ) || 0) -
                  (Number(
                    soldItem.quantity
                  ) || 0),
              };
            }
          )
      );

      // -------------------------------------------------
      // UPDATE LOCAL PRODUCTS
      // -------------------------------------------------

      setProducts(
        (prev) =>
          (prev || []).map(
            (product) => {

              const soldItem =
                items.find(
                  (item) =>
                    item.productId ===
                    product.id
                );

              if (!soldItem) {
                return product;
              }

              return {
                ...product,

                stock:
                  (Number(
                    product.stock
                  ) || 0) -
                  (Number(
                    soldItem.quantity
                  ) || 0),
              };
            }
          )
      );

      // -------------------------------------------------
      // CREATE STOCK MOVEMENTS
      // -------------------------------------------------

      for (const item of items) {

        const quantitySold =
          Number(
            item.quantity
          ) || 0;

        if (
          quantitySold <= 0
        ) {
          continue;
        }

        const movement = {
          productId:
            item.productId,

          productName:
            item.productName,

          quantity:
            quantitySold,

          action: 'REMOVE',

          date:
            saleData.date,

          timestamp:
            new Date().toISOString(),
        };

        const movementRef =
          await addDoc(
            collection(
              db,
              'stockMovements'
            ),
            movement
          );

        setStockTransactions(
          (prev) => [
            {
              id:
                movementRef.id,
              ...movement,
            },
            ...(prev || []),
          ]
        );
      }

      // -------------------------------------------------
      // UPDATE SALES
      // -------------------------------------------------

      setSalesTransactions(
        (prev) => [
          firebaseSale,
          ...(prev || []),
        ]
      );

      console.log(
        'Report sale added:',
        firebaseSale
      );

      return true;

    } catch (error) {

      console.log(
        'Firebase report sale add error:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to save the sales record.'
      );

      return false;
    }
  };

  // =====================================================
  // EDIT REPORT SALE
  // =====================================================
// =====================================================
// EDIT REPORT SALE
// =====================================================

const handleEditReportSale = async (
  id,
  saleData
) => {

  try {

    console.log(
      'Editing sale:',
      id,
      saleData
    );

    if (!id) {

      Alert.alert(
        'Error',
        'Sales record ID is missing.'
      );

      return false;
    }

    const updatedSale = {
      date:
        saleData.date,

      totalRevenue:
        Number(
          saleData.totalRevenue
        ) || 0,

      totalProfit:
        Number(
          saleData.totalProfit
        ) || 0,

      items:
        Array.isArray(
          saleData.items
        )
          ? saleData.items
          : [],
    };

    await updateDoc(
      doc(
        db,
        'sales',
        id
      ),
      updatedSale
    );

    setSalesTransactions(
      (prev) =>
        (prev || []).map(
          (sale) =>
            sale.id === id
              ? {
                  ...sale,
                  ...updatedSale,
                }
              : sale
        )
    );

    console.log(
      'Sale edited successfully:',
      id
    );

    return true;

  } catch (error) {

    console.log(
      'Firebase report sale edit error:',
      error
    );

    Alert.alert(
      'Edit Sale Error',
      error?.message ||
        'Unable to edit the sales record.'
    );

    return false;
  }
};

  // =====================================================
  // DELETE REPORT SALE
  // =====================================================

  const handleDeleteReportSale = async (
    id
  ) => {

    try {

      await deleteDoc(
        doc(db, 'sales', id)
      );

      setSalesTransactions(
        (prev) =>
          (prev || []).filter(
            (sale) =>
              sale.id !== id
          )
      );

      return true;

    } catch (error) {

      console.log(
        'Firebase report sale delete error:',
        error
      );

      return false;
    }
  };

  // =====================================================
  // UPDATE INVENTORY FROM POS
  // =====================================================

  const handleUpdateInventory = (
    updatedInventory
  ) => {

    setInventoryItems(
      updatedInventory
    );

    setProducts(
      (prevProducts) =>
        (prevProducts || []).map(
          (prod) => {

            const match =
              updatedInventory.find(
                (inv) =>
                  inv.id ===
                  prod.id
              );

            return match
              ? {
                  ...prod,
                  stock:
                    match.stock,
                }
              : prod;
          }
        )
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

    const qty =
      Number(quantity) || 0;

    if (
      !qty ||
      qty <= 0
    ) {
      return;
    }

    const movement = {
      productId,
      productName,
      quantity: qty,
      action,
      date:
        getLocalDateString(),
      timestamp:
        new Date().toISOString(),
    };

    try {

      const docRef =
        await addDoc(
          collection(
            db,
            'stockMovements'
          ),
          movement
        );

      const firebaseMovement = {
        id: docRef.id,
        ...movement,
      };

      setStockTransactions(
        (prev) => [
          firebaseMovement,
          ...prev,
        ]
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

  const handleQuickStockUpdate = async (
    item,
    newStock
  ) => {

    if (!item) return;

    const updatedStock =
      Number(newStock) || 0;

    if (
      updatedStock < 0
    ) {
      return;
    }

    try {

      await updateDoc(
        doc(
          db,
          'products',
          item.id
        ),
        {
          stock:
            updatedStock,
        }
      );

      setProducts(
        (prev) =>
          (prev || []).map(
            (product) =>
              product.id === item.id
                ? {
                    ...product,
                    stock:
                      updatedStock,
                  }
                : product
          )
      );

      setInventoryItems(
        (prev) =>
          (prev || []).map(
            (inventoryItem) =>
              inventoryItem.id ===
              item.id
                ? {
                    ...inventoryItem,
                    stock:
                      updatedStock,
                  }
                : inventoryItem
          )
      );

    } catch (error) {

      console.log(
        'Firebase stock update error:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to update stock.'
      );
    }
  };

  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  const handleSaveProduct = async (
    formData
  ) => {

    if (productBusy) return;

    const numStock =
      Number(formData.stock) || 0;

    const numPrice =
      Number(formData.price) || 0;

    const numCost =
      Number(
        formData.costPrice
      ) || 0;

    const formattedData = {
      ...formData,

      stock:
        numStock,

      price:
        numPrice,

      costPrice:
        numCost,

      profit:
        (
          numPrice -
          numCost
        ).toFixed(2),
    };

    setProductBusy(true);

    if (editingProduct) {

      const oldProduct =
        editingProduct;

      setProducts(
        (prev) =>
          prev.map(
            (p) =>
              p.id ===
              editingProduct.id
                ? {
                    ...p,
                    ...formattedData,
                  }
                : p
          )
      );

      setInventoryItems(
        (prev) =>
          prev.map(
            (item) =>
              item.id ===
              editingProduct.id
                ? {
                    ...item,
                    name:
                      formData.name,
                    stock:
                      numStock,
                    price:
                      numPrice,
                    costPrice:
                      numCost,
                  }
                : item
          )
      );

      setProductModalVisible(
        false
      );

      setEditingProduct(
        null
      );

      setProductNotice({
        type: 'loading',
        message:
          'Updating product...',
      });

      try {

        await updateDoc(
          doc(
            db,
            'products',
            editingProduct.id
          ),
          formattedData
        );

        setProductNotice({
          type: 'success',
          message:
            'Product updated successfully.',
        });

        setTimeout(() => {
          setProductNotice(null);
        }, 2500);

      } catch (error) {

        setProducts(
          (prev) =>
            prev.map(
              (p) =>
                p.id ===
                oldProduct.id
                  ? oldProduct
                  : p
            )
        );

        setProductNotice({
          type: 'error',
          message:
            'Update failed. Please try again.',
        });

        setTimeout(() => {
          setProductNotice(null);
        }, 3000);

        console.log(
          'Firebase product update error:',
          error
        );

      } finally {

        setProductBusy(false);
      }

      return;
    }

    const temporaryId =
      `temp-${Date.now()}`;

    const optimisticProduct = {
      id: temporaryId,
      ...formattedData,
    };

    setProducts(
      (prev) => [
        ...prev,
        optimisticProduct,
      ]
    );

    setInventoryItems(
      (prev) => [
        ...prev,
        {
          id: temporaryId,
          name:
            formData.name,
          stock:
            numStock,
          minStock: 5,
          price:
            numPrice,
          costPrice:
            numCost,
        },
      ]
    );

    setProductModalVisible(
      false
    );

    setEditingProduct(
      null
    );

    setProductNotice({
      type: 'loading',
      message:
        'Adding product...',
    });

    try {

      const docRef =
        await addDoc(
          collection(
            db,
            'products'
          ),
          formattedData
        );

      setProducts(
        (prev) =>
          prev.map(
            (p) =>
              p.id === temporaryId
                ? {
                    ...p,
                    id:
                      docRef.id,
                  }
                : p
          )
      );

      setInventoryItems(
        (prev) =>
          prev.map(
            (item) =>
              item.id ===
              temporaryId
                ? {
                    ...item,
                    id:
                      docRef.id,
                  }
                : item
          )
      );

      if (
        numStock > 0
      ) {

        recordStockMovement({
          productId:
            docRef.id,

          productName:
            formData.name,

          quantity:
            numStock,

          action: 'ADD',
        });
      }

      setProductNotice({
        type: 'success',
        message:
          'Product added successfully.',
      });

      setTimeout(() => {
        setProductNotice(null);
      }, 2500);

    } catch (error) {

      setProducts(
        (prev) =>
          prev.filter(
            (p) =>
              p.id !==
              temporaryId
          )
      );

      setInventoryItems(
        (prev) =>
          prev.filter(
            (item) =>
              item.id !==
              temporaryId
          )
      );

      setProductNotice({
        type: 'error',
        message:
          'Product was not saved. Please try again.',
      });

      setTimeout(() => {
        setProductNotice(null);
      }, 3000);

      console.log(
        'Firebase product save error:',
        error
      );

    } finally {

      setProductBusy(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDeleteProduct = async (
    id
  ) => {

    if (productBusy) return;

    setProductBusy(true);

    setProductNotice({
      type: 'loading',
      message:
        'Deleting product...',
    });

    try {

      await deleteDoc(
        doc(
          db,
          'products',
          id
        )
      );

      setProducts(
        (prev) =>
          (prev || []).filter(
            (product) =>
              product.id !== id
          )
      );

      setInventoryItems(
        (prev) =>
          (prev || []).filter(
            (item) =>
              item.id !== id
          )
      );

      setProductNotice({
        type: 'success',
        message:
          'Product deleted successfully.',
      });

      setTimeout(() => {
        setProductNotice(null);
      }, 2500);

    } catch (error) {

      console.log(
        'Firebase product delete error:',
        error
      );

      setProductNotice({
        type: 'error',
        message:
          'Delete failed. Please try again.',
      });

      setTimeout(() => {
        setProductNotice(null);
      }, 3000);

    } finally {

      setProductBusy(false);
    }
  };

 // =====================================================
// SAVE INVENTORY
// =====================================================

const handleSaveInventory = async (formData) => {

  const currentInventory =
    inventoryItems || [];

  const numStock =
    Number(formData.stock) || 0;

  if (!editingInventory) {

    setProductNotice({
      type: 'loading',
      message:
        'Add a new product from the Products screen. Its inventory will be created automatically.',
    });

    setTimeout(() => {
      setProductNotice(null);
    }, 3000);

    return;
  }

  const oldItem =
    currentInventory.find(
      (i) =>
        i.id === editingInventory.id
    );

  const oldStock =
    Number(oldItem?.stock) || 0;

  const stockDifference =
    numStock - oldStock;

  // Save old data for rollback
  const oldInventoryItems =
    currentInventory;

  const oldProducts =
    products || [];

  // ===================================================
  // OPTIMISTIC UI UPDATE
  // ===================================================

  setInventoryItems(
    currentInventory.map(
      (i) =>
        i.id === editingInventory.id
          ? {
              ...i,
              ...formData,
              stock: numStock,
            }
          : i
    )
  );

  setProducts(
    (prev) =>
      (prev || []).map(
        (p) =>
          p.id === editingInventory.id
            ? {
                ...p,
                ...formData,
                stock: numStock,
              }
            : p
      )
  );

  // Close modal immediately
  setInventoryModalVisible(false);
  setEditingInventory(null);

  // Show notification immediately
  setProductNotice({
    type: 'loading',
    message: 'Updating inventory...',
  });

  try {

    // =================================================
    // FIREBASE UPDATE
    // =================================================

    await updateDoc(
      doc(
        db,
        'products',
        editingInventory.id
      ),
      {
        ...formData,
        stock: numStock,
      }
    );

    // =================================================
    // STOCK MOVEMENT
    // =================================================

    if (stockDifference > 0) {

      recordStockMovement({
        productId:
          editingInventory.id,

        productName:
          formData.name ||
          editingInventory.name,

        quantity:
          stockDifference,

        action: 'ADD',
      });
    }

    if (stockDifference < 0) {

      recordStockMovement({
        productId:
          editingInventory.id,

        productName:
          formData.name ||
          editingInventory.name,

        quantity:
          Math.abs(stockDifference),

        action: 'REMOVE',
      });
    }

    // =================================================
    // SUCCESS
    // =================================================

    setProductNotice({
      type: 'success',
      message:
        'Inventory updated successfully.',
    });

    setTimeout(() => {
      setProductNotice(null);
    }, 2500);

  } catch (error) {

    // =================================================
    // ROLLBACK IF FIREBASE FAILS
    // =================================================

    setInventoryItems(
      oldInventoryItems
    );

    setProducts(
      oldProducts
    );

    setProductNotice({
      type: 'error',
      message:
        'Update failed. Please try again.',
    });

    setTimeout(() => {
      setProductNotice(null);
    }, 3000);

    console.log(
      'Firebase inventory save error:',
      error
    );
  }
};

  // =====================================================
  // DELETE INVENTORY
  // =====================================================

  // =====================================================
// DELETE INVENTORY
// =====================================================

// =====================================================
// DELETE INVENTORY
// =====================================================

const handleDeleteInventory = async (id) => {

  const oldInventoryItems =
    inventoryItems || [];

  const oldProducts =
    products || [];

  // ===================================================
  // OPTIMISTIC UI UPDATE
  // ===================================================

  setInventoryItems(
    oldInventoryItems.filter(
      (item) =>
        item.id !== id
    )
  );

  setProducts(
    oldProducts.filter(
      (product) =>
        product.id !== id
    )
  );

  // Show immediately
  setProductNotice({
    type: 'loading',
    message:
      'Deleting inventory item...',
  });

  try {

    // =================================================
    // FIREBASE DELETE
    // =================================================

    await deleteDoc(
      doc(
        db,
        'products',
        id
      )
    );

    // =================================================
    // SUCCESS
    // =================================================

    setProductNotice({
      type: 'success',
      message:
        'Inventory item deleted successfully.',
    });

    setTimeout(() => {
      setProductNotice(null);
    }, 2500);

  } catch (error) {

    // =================================================
    // ROLLBACK
    // =================================================

    setInventoryItems(
      oldInventoryItems
    );

    setProducts(
      oldProducts
    );

    setProductNotice({
      type: 'error',
      message:
        'Delete failed. Please try again.',
    });

    setTimeout(() => {
      setProductNotice(null);
    }, 3000);

    console.log(
      'Firebase inventory delete error:',
      error
    );
  }
};

  // =====================================================
  // SCREEN CONTENT
  // =====================================================

  let screenContent = null;

  if (
    currentScreen ===
    'SIGN_IN'
  ) {

    screenContent = (
      <SignInScreen
        onSignIn={
          handleSignIn
        }

        onNavigateSignUp={() =>
          setCurrentScreen(
            'SIGN_UP'
          )
        }

        onNavigateRecover={() =>
          setCurrentScreen(
            'RECOVER_PASSWORD'
          )
        }
      />
    );

  } else if (
    currentScreen ===
    'SIGN_UP'
  ) {

    screenContent = (
      <SignUpScreen

        onSignUpSuccess={() =>
          setCurrentScreen(
            'SIGN_IN'
          )
        }

        onNavigateSignIn={() =>
          setCurrentScreen(
            'SIGN_IN'
          )
        }

      />
    );

  } else if (
    currentScreen ===
    'RECOVER_PASSWORD'
  ) {

    screenContent = (
      <RecoverPasswordScreen

        onSendReset={() =>
          setCurrentScreen(
            'SIGN_IN'
          )
        }

        onNavigateSignIn={() =>
          setCurrentScreen(
            'SIGN_IN'
          )
        }

      />
    );

  } else {

    screenContent = (
      <View
        style={
          styles.mainContainer
        }
      >

        {productNotice && (
          <View
            style={[
              styles.productNotice,

              productNotice.type ===
                'success' &&
                styles.productNoticeSuccess,

              productNotice.type ===
                'error' &&
                styles.productNoticeError,
            ]}
          >
            <Text
              style={
                styles.productNoticeTitle
              }
            >
              {productNotice.type ===
              'loading'
                ? 'Please wait'
                : productNotice.type ===
                  'success'
                ? 'Success'
                : 'Something went wrong'}
            </Text>

            <Text
              style={
                styles.productNoticeText
              }
            >
              {
                productNotice.message
              }
            </Text>
          </View>
        )}

        <SideMenu
          visible={
            isMenuOpen
          }

          activeTab={
            activeTab
          }

          setActiveTab={
            setActiveTab
          }

          user={user}

          onClose={() =>
            setIsMenuOpen(
              false
            )
          }

          onSignOut={() => {
            setIsMenuOpen(
              false
            );

            setCurrentScreen(
              'SIGN_IN'
            );
          }}
        />

        {activeTab ===
          'DASHBOARD' && (

          <DashboardScreen

            onOpenMenu={() =>
              setIsMenuOpen(
                true
              )
            }

            onOpenProfile={() =>
              setProfileModalVisible(
                true
              )
            }

            user={user}

            products={
              products || []
            }

            productsCount={
              products?.length ||
              0
            }

            inventoryItems={
              inventoryItems ||
              []
            }

            onUpdateInventory={
              handleUpdateInventory
            }

            onRecordSale={
              handleRecordSale
            }

          />
        )}

        {activeTab ===
          'PRODUCTS' && (

          <ProductsScreen

            onOpenMenu={() =>
              setIsMenuOpen(
                true
              )
            }

            onOpenProfile={() =>
              setProfileModalVisible(
                true
              )
            }

            user={user}

            products={
              products || []
            }

            customCategories={
              customCategories
            }

            setCustomCategories={
              setCustomCategories
            }

            productBusy={
              productBusy
            }

            onOpenAdd={() => {

              if (
                productBusy
              ) {
                return;
              }

              setEditingProduct(
                null
              );

              setProductModalVisible(
                true
              );
            }}

            onOpenEdit={(product) => {

              if (
                productBusy
              ) {
                return;
              }

              setEditingProduct(
                product
              );

              setProductModalVisible(
                true
              );
            }}

            onDelete={
              handleDeleteProduct
            }

          />
        )}

        {activeTab ===
          'INVENTORY' && (

          <InventoryScreen

            onOpenMenu={() =>
              setIsMenuOpen(
                true
              )
            }

            onOpenProfile={() =>
              setProfileModalVisible(
                true
              )
            }

            user={user}

            inventoryItems={
              inventoryItems ||
              []
            }

            onOpenAdd={() => {

              setEditingInventory(
                null
              );

              setInventoryModalVisible(
                true
              );
            }}

            onOpenEdit={(item) => {

              setEditingInventory(
                item
              );

              setInventoryModalVisible(
                true
              );
            }}

            onDelete={
              handleDeleteInventory
            }

            onStockUpdate={
              handleQuickStockUpdate
            }

          />
        )}

        {activeTab ===
          'REPORTS' && (

          <ReportsScreen

            onOpenMenu={() =>
              setIsMenuOpen(
                true
              )
            }

            onOpenProfile={() =>
              setProfileModalVisible(
                true
              )
            }

            user={user}

            salesTransactions={
              salesTransactions ||
              []
            }

            stockTransactions={
              stockTransactions ||
              []
            }

            inventoryItems={
              inventoryItems ||
              []
            }

            onAddSale={
              handleAddReportSale
            }

            onEditSale={
              handleEditReportSale
            }

            onDeleteSale={
              handleDeleteReportSale
            }

          />
        )}

        <ProfileModal

          visible={
            profileModalVisible
          }

          user={user}

          onClose={() =>
            setProfileModalVisible(
              false
            )
          }

          onSave={
            handleUpdateProfile
          }

        />

        <ProductModal

          visible={
            productModalVisible
          }

          product={
            editingProduct
          }

          customCategories={
            customCategories
          }

          productBusy={
            productBusy
          }

          onClose={() => {

            setProductModalVisible(
              false
            );

            setEditingProduct(
              null
            );
          }}

          onSave={
            handleSaveProduct
          }

        />

        <InventoryModal

          visible={
            inventoryModalVisible
          }

          item={
            editingInventory
          }

          onClose={() => {

            setInventoryModalVisible(
              false
            );

            setEditingInventory(
              null
            );
          }}

          onSave={
            handleSaveInventory
          }

        />

      </View>
    );
  }

  return (
    <SafeAreaProvider>

      <StatusBar
        barStyle="light-content"
        backgroundColor={
          COLORS.darkBlue
        }
      />

      {screenContent}

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  mainContainer: {
    flex: 1,
    backgroundColor:
      COLORS.lightBackground,
  },

  productNotice: {
    position: 'absolute',
    top: 55,
    left: 20,
    right: 20,
    zIndex: 9999,

    backgroundColor:
      COLORS.white ||
      '#FFFFFF',

    borderRadius: 12,

    padding: 14,

    elevation: 8,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.2,

    shadowRadius: 6,

    borderLeftWidth: 5,

    borderLeftColor:
      COLORS.accentYellow ||
      '#FBBF24',
  },

  productNoticeSuccess: {
    borderLeftColor:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  productNoticeError: {
    borderLeftColor:
      COLORS.dangerRed ||
      '#EF4444',
  },

  productNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',

    color:
      COLORS.textDark ||
      '#111827',

    marginBottom: 2,
  },

  productNoticeText: {
    fontSize: 12,

    color:
      COLORS.textLight ||
      '#6B7280',
  },

});

