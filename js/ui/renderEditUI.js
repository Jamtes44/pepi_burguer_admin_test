/**
 * Calcula y actualiza el margen de ganancia neto en tiempo real.
 */
export function calculateNetMargin(soloPrice, estimatedCost = 6650) {
  const marginBadge = document.getElementById('margin-value');
  if (!marginBadge) return;

  if (soloPrice > 0) {
    const margin = Math.round(((soloPrice - estimatedCost) / soloPrice) * 100);
    marginBadge.textContent = `${margin}%`;
  } else {
    marginBadge.textContent = '0%';
  }
}

/**
 * Muestra la notificación flotante al guardar cambios.
 */
export function triggerSaveNotification(message = '¡Publicado con éxito!') {
  const toast = document.getElementById('save-toast');
  if (!toast) return;

  const toastText = toast.querySelector('span.font-medium');
  if (toastText) toastText.textContent = message;

  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 2800);
}

/**
 * Inicializa los eventos de la vista de edición (incluyendo la subida de imagen local).
 */
export function initEditUI() {
  const inputSolo = document.getElementById('input-price-solo');
  const btnSub500 = document.getElementById('btn-sub-500');
  const btnAdd500 = document.getElementById('btn-add-500');
  const btnAdd1000 = document.getElementById('btn-add-1000');
  const toggleVisible = document.getElementById('toggle-visible');
  const visibleText = document.getElementById('visible-status-text');

  // Controladores de subida de imagen local
  const btnUploadImg = document.getElementById('btn-upload-img');
  const inputFileImg = document.getElementById('input-file-image');
  const imgPreview = document.getElementById('edit-img-preview');

  if (btnUploadImg && inputFileImg) {
    btnUploadImg.addEventListener('click', () => inputFileImg.click());

    inputFileImg.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert('Por favor selecciona una imagen menor a 2MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (imgPreview) {
            imgPreview.src = event.target.result; // Previsualiza la imagen local en Base64
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Recalcular margen al escribir en el precio solo
  if (inputSolo) {
    calculateNetMargin(parseInt(inputSolo.value, 10) || 0);
    inputSolo.addEventListener('input', (e) => {
      calculateNetMargin(parseInt(e.target.value, 10) || 0);
    });
  }

  // Ajustadores rápidos de precio
  const adjustPrice = (delta) => {
    if (!inputSolo) return;
    let val = parseInt(inputSolo.value, 10) || 0;
    val = Math.max(0, val + delta);
    inputSolo.value = val;
    calculateNetMargin(val);
  };

  if (btnSub500) btnSub500.addEventListener('click', () => adjustPrice(-500));
  if (btnAdd500) btnAdd500.addEventListener('click', () => adjustPrice(500));
  if (btnAdd1000) btnAdd1000.addEventListener('click', () => adjustPrice(1000));

  // Toggle de visibilidad en la app
  if (toggleVisible && visibleText) {
    toggleVisible.addEventListener('change', (e) => {
      visibleText.textContent = e.target.checked ? 'Disponible a clientes' : 'Oculto en el menú';
    });
  }
}