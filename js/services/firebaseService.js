import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  onSnapshot, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAtcUqZIb03T5J4NJo40tQRrmqaFeifdA",
  authDomain: "pepi-burguer.firebaseapp.com",
  projectId: "pepi-burguer",
  storageBucket: "pepi-burguer.firebasestorage.app",
  messagingSenderId: "635420478260",
  appId: "1:635420478260:web:04912dda724aa329f47361"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Escucha la lista de productos en tiempo real desde Firestore.
 */
export function subscribeToProducts(callback) {
  return onSnapshot(collection(db, "products"), (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(products);
  });
}

/**
 * Escucha en tiempo real la colección de órdenes / ventas reales.
 */
export function subscribeToOrders(callback) {
  return onSnapshot(collection(db, "orders"), (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
}

/**
 * Obtiene la información de un solo producto por su ID.
 */
export async function getProductById(productId) {
  const docRef = doc(db, "products", productId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

/**
 * Actualiza la disponibilidad (En Menú / Agotado) de un producto.
 */
export async function updateProductStatus(productId, isAvailable) {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { isAvailable });
}

/**
 * Actualiza los precios solo y combo de un producto.
 */
export async function updateProductPrices(productId, priceSolo, priceCombo) {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { priceSolo, priceCombo });
}

/**
 * Guarda todos los detalles editados de un producto existente.
 */
export async function saveProductDetails(productId, data) {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, data);
}

/**
 * Crea un nuevo producto en la colección "products"
 */
export async function addNewProduct(productData) {
  const docRef = await addDoc(collection(db, "products"), productData);
  return docRef.id;
}

/**
 * Escucha en tiempo real el estado de la tienda (Abierto / Cerrado)
 */
export function subscribeToStoreStatus(callback) {
  const storeRef = doc(db, "settings", "store");
  return onSnapshot(storeRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().isOpen);
    } else {
      callback(true); // Abierto por defecto
    }
  });
}

/**
 * Guarda el estado operativo de la tienda en Firestore
 */
export async function updateStoreStatus(isOpen) {
  const storeRef = doc(db, "settings", "store");
  await setDoc(storeRef, { isOpen }, { merge: true });
}