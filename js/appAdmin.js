import { 
  subscribeToProducts, 
  subscribeToOrders, 
  subscribeToStoreStatus, 
  updateStoreStatus 
} from './services/firebaseService.js';

import { 
  renderCatalogList, 
  closeQuickPriceModal, 
  saveQuickPriceChanges 
} from './ui/renderAdminUI.js';

// Variables de estado en memoria
let currentProducts = [];
let currentOrders = [];
let activeCategory = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initStoreStatusToggle();
  initSearchAndFilterListeners();
  initModalListeners();

  // 1. Escuchar la lista de productos en tiempo real
  subscribeToProducts((products) => {
    currentProducts = products;
    applyFiltersAndRender();
  });

  // 2. Escuchar la colección de órdenes (ventas reales)
  subscribeToOrders((orders) => {
    currentOrders = orders;
    applyFiltersAndRender();
  });
});

/**
 * Aplica los filtros de búsqueda y categoría activa, y actualiza el DOM
 */
function applyFiltersAndRender() {
  let filtered = [...currentProducts];

  // Filtro por categoría
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase());
  }

  // Filtro por texto en la barra de búsqueda
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.description || '').toLowerCase().includes(q) ||
      (p.id || '').toString().includes(q)
    );
  }

  // Renderizar la lista e integrar las ventas reales
  renderCatalogList(filtered, currentOrders);
}

/**
 * Inicializa el buscador y los botones de categorías
 */
function initSearchAndFilterListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFiltersAndRender();
    });
  }

  const categoryButtons = document.querySelectorAll('.category-pill');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryButtons.forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary', 'active');
        b.classList.add('bg-surface-container-lowest', 'text-on-surface-variant');
      });

      const target = e.currentTarget;
      target.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant');
      target.classList.add('bg-primary', 'text-on-primary', 'active');

      activeCategory = target.dataset.category || 'all';
      applyFiltersAndRender();
    });
  });
}

/**
 * Control del Switch de Estado Operativo de la tienda (Abierto / Cerrado)
 */
function initStoreStatusToggle() {
  const storeToggleBtn = document.getElementById('store-toggle-btn');
  const storeStatusText = document.getElementById('store-status-text');
  const toggleThumb = document.getElementById('toggle-thumb');
  const statusPulseRing = document.getElementById('status-pulse-ring');
  const statusDot = document.getElementById('status-dot');

  if (!storeToggleBtn) return;

  // Escuchar cambio en tiempo real del estado de la tienda
  subscribeToStoreStatus((isOpen) => {
    updateStoreStatusUI(isOpen);
  });

  // Evento de clic en el switch
  storeToggleBtn.addEventListener('click', async () => {
    const isCurrentlyOpen = storeStatusText?.textContent.includes('ABIERTO');
    const newStatus = !isCurrentlyOpen;

    updateStoreStatusUI(newStatus);
    await updateStoreStatus(newStatus);
  });

  function updateStoreStatusUI(isOpen) {
    if (!storeStatusText || !toggleThumb) return;

    if (isOpen) {
      storeStatusText.textContent = 'ABIERTO (Recibiendo pedidos)';
      storeStatusText.className = 'font-headline-sm text-headline-sm text-on-surface';
      toggleThumb.classList.remove('translate-x-0');
      toggleThumb.classList.add('translate-x-6');
      storeToggleBtn.className = 'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full bg-primary-container p-1 transition-colors duration-300';
      if (statusPulseRing) statusPulseRing.className = 'absolute w-6 h-6 rounded-full bg-emerald-500 opacity-75 animate-ping';
      if (statusDot) statusDot.className = 'relative w-3.5 h-3.5 rounded-full bg-emerald-500';
    } else {
      storeStatusText.textContent = 'CERRADO (No recibe pedidos)';
      storeStatusText.className = 'font-headline-sm text-headline-sm text-error';
      toggleThumb.classList.remove('translate-x-6');
      toggleThumb.classList.add('translate-x-0');
      storeToggleBtn.className = 'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full bg-surface-container-highest p-1 transition-colors duration-300';
      if (statusPulseRing) statusPulseRing.className = 'hidden';
      if (statusDot) statusDot.className = 'relative w-3.5 h-3.5 rounded-full bg-error';
    }
  }
}

/**
 * Asigna los eventos de los botones del modal de edición rápida de precios
 */
function initModalListeners() {
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const saveBtn = document.getElementById('save-modal-btn');

  if (closeBtn) closeBtn.addEventListener('click', closeQuickPriceModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeQuickPriceModal);
  if (saveBtn) saveBtn.addEventListener('click', saveQuickPriceChanges);
}