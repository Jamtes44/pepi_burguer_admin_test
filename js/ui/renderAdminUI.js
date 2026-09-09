import { formatCurrency } from '../utils/formatters.js';
import { updateProductStatus, updateProductPrices } from '../services/firebaseService.js';

let currentEditingProduct = null;

/**
 * Muestra el Toast flotante de sincronización con Firebase.
 */
export function showFirebaseToast(message) {
  const toast = document.getElementById('firebase-toast');
  const toastText = document.getElementById('toast-text');
  if (!toast || !toastText) return;

  toastText.textContent = message || "Cambios guardados automáticamente en Firebase Cloud Firestore";
  
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 3200);
}

/**
 * Calcula y actualiza en tiempo real las métricas superiores basándose en VENTAS REALES
 * @param {Array} orders - Lista de pedidos/comandas desde la colección 'orders' de Firestore
 */
export function updateSalesMetricsUI(orders = []) {
  const elTotalSales = document.getElementById('metric-total-sales');
  const elTotalOrders = document.getElementById('metric-total-orders');
  const elAverageTicket = document.getElementById('metric-average-ticket');

  const totalOrdersCount = orders.length;

  // 1. Sumatoria real de ventas ($)
  const totalSalesAmount = orders.reduce((acc, order) => {
    const orderTotal = parseInt(order.total || order.totalAmount || 0, 10);
    return acc + orderTotal;
  }, 0);

  // 2. Cálculo del Ticket Promedio ($)
  const averageTicket = totalOrdersCount > 0 ? Math.round(totalSalesAmount / totalOrdersCount) : 0;

  if (elTotalSales) elTotalSales.textContent = formatCurrency(totalSalesAmount);
  if (elTotalOrders) elTotalOrders.textContent = totalOrdersCount;
  if (elAverageTicket) elAverageTicket.textContent = formatCurrency(averageTicket);
}

/**
 * Renderiza la lista de productos en el panel administrador.
 */
export function renderCatalogList(products = [], orders = []) {
  const catalogList = document.getElementById('catalog-list');
  if (!catalogList) return;

  // Actualizar métricas de ventas reales
  updateSalesMetricsUI(orders);

  if (!products || products.length === 0) {
    catalogList.innerHTML = `<p class="text-center text-on-surface-variant py-8 font-medium">No se encontraron productos en el catálogo.</p>`;
    return;
  }

  catalogList.innerHTML = products.map(product => {
    const isPaused = !product.isAvailable;
    const badgeClass = isPaused 
      ? "bg-surface-container-high text-on-surface-variant" 
      : "bg-emerald-100 text-emerald-800";
    const statusText = isPaused ? "Pausado" : "Activo";

    // Conteo de cuántas veces se ha vendido este producto en las órdenes reales
    const unitsSold = orders.reduce((acc, order) => {
      const items = order.items || [];
      const productItem = items.find(item => item.id === product.id);
      return acc + (productItem ? (parseInt(productItem.quantity, 10) || 1) : 0);
    }, 0);

    const totalRevenueGenerated = unitsSold * (parseInt(product.priceSolo, 10) || 0);

    return `
      <div class="product-item bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col gap-space-xs transition-opacity ${isPaused ? 'opacity-50' : ''}" data-category="${product.category}" data-name="${product.name}" data-id="${product.id}">
        <div class="flex gap-space-xs items-start">
          <div class="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container">
            <img class="w-full h-full object-cover" src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1000';" />
            <span class="absolute bottom-1 left-1 bg-surface-container-highest/90 text-on-surface font-label-caps text-[9px] px-1.5 py-0.5 rounded font-bold">#${product.id}</span>
          </div>
          <div class="flex flex-col flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <h3 class="font-title-menu-item text-title-menu-item text-on-surface truncate">${product.name}</h3>
              <span class="status-indicator-badge font-label-caps text-label-caps px-2 py-0.5 rounded-full ${badgeClass} font-bold shrink-0">${statusText}</span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">${product.description || ''}</p>
            
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <div class="flex items-baseline gap-1 bg-surface-container-low px-2 py-1 rounded-md">
                <span class="font-label-caps text-[10px] uppercase text-on-surface-variant font-bold">Precio:</span>
                <span class="font-price-badge text-[13px] text-on-surface font-bold">${formatCurrency(product.priceSolo)}</span>
              </div>
              <div class="flex items-baseline gap-1 bg-emerald-50 border border-emerald-200/60 px-2 py-1 rounded-md">
                <span class="font-label-caps text-[10px] uppercase text-emerald-800 font-bold">Vendido:</span>
                <span class="font-price-badge text-[13px] text-emerald-700 font-extrabold">${unitsSold} und (${formatCurrency(totalRevenueGenerated)})</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Controles Administrativos -->
        <div class="flex items-center justify-between pt-space-xs bg-surface-container-low/60 rounded-lg px-2.5 py-1.5">
          <label class="font-body-sm text-body-sm text-on-surface font-semibold flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" class="item-toggle-stock accent-primary w-4 h-4 rounded cursor-pointer" data-id="${product.id}" ${product.isAvailable ? 'checked' : ''}>
            <span>En Menú</span>
          </label>
          <div class="flex items-center gap-1.5">
            <button type="button" class="btn-quick-price inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-semibold hover:bg-surface-variant active:scale-95 transition-transform" data-id="${product.id}" data-name="${product.name}" data-solo="${product.priceSolo}" data-combo="${product.priceCombo || ''}">
              <span class="material-symbols-outlined text-[15px]">payments</span>
              <span>Precios</span>
            </button>
            <a href="edit-product.html?id=${product.id}" class="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary">
              <span class="material-symbols-outlined text-[16px]">edit</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Vincular eventos de Toggle Stock
  document.querySelectorAll('.item-toggle-stock').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const status = e.target.checked;
      await updateProductStatus(id, status);
      showFirebaseToast(`Estado de producto #${id} actualizado.`);
    });
  });

  // Vincular eventos de Precios
  document.querySelectorAll('.btn-quick-price').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      openQuickPriceModal(
        target.dataset.id,
        target.dataset.name,
        parseInt(target.dataset.solo, 10),
        target.dataset.combo ? parseInt(target.dataset.combo, 10) : null
      );
    });
  });
}

export function openQuickPriceModal(id, name, priceSolo, priceCombo) {
  currentEditingProduct = { id, name, priceSolo, priceCombo };
  
  const priceModal = document.getElementById('price-modal');
  const modalProductName = document.getElementById('modal-product-name');
  const modalPriceSingle = document.getElementById('modal-price-single');
  const modalPriceCombo = document.getElementById('modal-price-combo');
  const modalComboContainer = document.getElementById('modal-combo-container');

  if (!priceModal) return;

  modalProductName.textContent = name;
  modalPriceSingle.value = priceSolo;

  if (priceCombo !== null && !isNaN(priceCombo)) {
    modalComboContainer.classList.remove('hidden');
    modalPriceCombo.value = priceCombo;
  } else {
    modalComboContainer.classList.add('hidden');
    modalPriceCombo.value = '';
  }

  priceModal.classList.remove('hidden');
}

export function closeQuickPriceModal() {
  const priceModal = document.getElementById('price-modal');
  if (priceModal) priceModal.classList.add('hidden');
  currentEditingProduct = null;
}

export async function saveQuickPriceChanges() {
  if (!currentEditingProduct) return;

  const modalPriceSingle = document.getElementById('modal-price-single');
  const modalPriceCombo = document.getElementById('modal-price-combo');

  const newSolo = parseInt(modalPriceSingle.value, 10) || 0;
  const newCombo = modalPriceCombo.value ? parseInt(modalPriceCombo.value, 10) : null;

  await updateProductPrices(currentEditingProduct.id, newSolo, newCombo);
  closeQuickPriceModal();
  showFirebaseToast(`Precios de "${currentEditingProduct.name}" actualizados.`);
}