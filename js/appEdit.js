import { initEditUI, triggerSaveNotification } from './ui/renderEditUI.js';
import { getProductById, saveProductDetails, addNewProduct } from './services/firebaseService.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inicializar la lógica interactiva de la vista
  initEditUI();

  // 2. Obtener el ID del producto desde la URL (?id=...)
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  // Si existe un ID en la URL, se cargan los datos desde Firestore para edición
  if (productId) {
    try {
      const product = await getProductById(productId);
      if (product) {
        populateForm(product);
      }
    } catch (error) {
      console.error("Error al cargar el producto de Firestore:", error);
    }
  }

  // 3. Event Listener del botón de Guardar (Soporta Crear y Actualizar)
  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const formData = gatherFormData();

      if (!formData.name) {
        alert("Por favor ingresa al menos el nombre del producto.");
        return;
      }

      try {
        if (productId) {
          // Modo Actualización
          await saveProductDetails(productId, formData);
          triggerSaveNotification('¡Producto actualizado en Firestore!');
        } else {
          // Modo Creación
          await addNewProduct(formData);
          triggerSaveNotification('¡Nuevo producto creado en Firestore!');
          
          setTimeout(() => {
            window.location.href = 'index.html'; // Redirige al catálogo
          }, 1500);
        }
      } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("Ocurrió un error al guardar en la base de datos.");
      }
    });
  }
});

/**
 * Llena el formulario con los datos existentes del producto recuperado.
 */
function populateForm(product) {
  const heading = document.getElementById('edit-product-heading');
  const inputName = document.getElementById('input-name');
  const selectCat = document.getElementById('select-category');
  const inputDesc = document.getElementById('input-description');
  const inputSolo = document.getElementById('input-price-solo');
  const inputCombo = document.getElementById('input-price-combo');
  const imgPreview = document.getElementById('edit-img-preview');
  const toggleVisible = document.getElementById('toggle-visible');

  if (heading) heading.textContent = product.name || 'Editar Producto';
  if (inputName) inputName.value = product.name || '';
  if (selectCat) selectCat.value = product.category || 'hamburguesas';
  if (inputDesc) inputDesc.value = product.description || '';
  if (inputSolo) inputSolo.value = product.priceSolo || 0;
  if (inputCombo) inputCombo.value = product.priceCombo || '';
  if (imgPreview && product.image) imgPreview.src = product.image;
  if (toggleVisible) toggleVisible.checked = product.isAvailable !== false;
}

/**
 * Recopila todos los datos ingresados en el formulario para enviarlos a Firestore.
 */
function gatherFormData() {
  const imgPreview = document.getElementById('edit-img-preview');

  return {
    name: document.getElementById('input-name')?.value.trim() || '',
    category: document.getElementById('select-category')?.value || 'hamburguesas',
    description: document.getElementById('input-description')?.value.trim() || '',
    priceSolo: parseInt(document.getElementById('input-price-solo')?.value, 10) || 0,
    priceCombo: parseInt(document.getElementById('input-price-combo')?.value, 10) || null,
    isAvailable: document.getElementById('toggle-visible')?.checked ?? true,
    image: imgPreview?.src || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1000'
  };
}