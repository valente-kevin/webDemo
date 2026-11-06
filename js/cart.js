(() => {
  const key = "an_cart";
  const products = window.ANProducts;
  const count = document.querySelector(".cart-count");
  const trigger = document.querySelector("[data-open-cart]");
  const backdrop = document.getElementById("cart-backdrop");
  const drawer = document.getElementById("cart-drawer");
  const content = document.getElementById("cart-content");
  const footer = document.getElementById("cart-footer");
  const toastRegion = document.getElementById("toast-region");
  let items = [];
  let previousFocus = null;
  let returnToModal = false;

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      showToast("No pudimos guardar el carrito en este dispositivo.");
      console.error("No se pudo guardar el carrito:", error);
    }
  }

  function restore() {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new TypeError("El contenido guardado no es una lista.");
      return parsed.filter(item => {
        const product = products.find(entry => entry.id === item.id);
        return product && product.disponible && product.tallas.includes(item.talla) &&
          product.colores.some(color => color.nombre === item.color) &&
          Number.isInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= product.stock;
      }).map(item => ({ ...item, precio: products.find(product => product.id === item.id).precio }));
    } catch (error) {
      console.error("El carrito guardado está dañado y se iniciará uno nuevo:", error);
      try { localStorage.removeItem(key); } catch (storageError) {
        console.error("No se pudo limpiar el carrito dañado:", storageError);
      }
      showToast("Se restableció el carrito porque los datos guardados no eran válidos.");
      return [];
    }
  }

  function totalQuantity() {
    return items.reduce((sum, item) => sum + item.cantidad, 0);
  }

  function render() {
    const total = totalQuantity();
    count.textContent = String(total);
    trigger.setAttribute("aria-label", `Abrir carrito, ${total} ${total === 1 ? "producto" : "productos"}`);
    drawer.querySelector(".drawer-count").textContent = `(${total})`;
    if (!items.length) {
      content.innerHTML = '<div class="cart-empty"><h3>Tu carrito está vacío</h3><p>Descubre prendas que reflejen tu estilo y agrégalas aquí.</p><button class="button button-outline" type="button" data-continue>Seguir explorando</button></div>';
      footer.replaceChildren();
      return;
    }
    content.innerHTML = items.map((item, index) => {
      const product = products.find(entry => entry.id === item.id);
      return `<article class="cart-item" data-index="${index}">
        <img src="${product.imagenes[0]}" width="78" height="98" loading="lazy" alt="${product.nombre}">
        <div><h3>${product.nombre}</h3><p>Talla ${item.talla} · ${item.color}</p><p>${window.ANWhatsApp.money(item.precio)} c/u</p>
        <div class="cart-item-actions"><button type="button" data-cart-step="-1" aria-label="Reducir cantidad de ${product.nombre}">−</button><span>${item.cantidad}</span><button type="button" data-cart-step="1" aria-label="Aumentar cantidad de ${product.nombre}" ${item.cantidad >= product.stock ? "disabled" : ""}>+</button><button type="button" class="remove-item" data-remove>Eliminar</button></div></div>
        <span class="cart-item-price">${window.ANWhatsApp.money(item.precio * item.cantidad)}</span>
      </article>`;
    }).join("");
    const amount = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    footer.innerHTML = `<div class="cart-total"><span>Total estimado</span><span>${window.ANWhatsApp.money(amount)}</span></div><p class="cart-note">Precios y disponibilidad sujetos a confirmación.</p><a class="button button-primary" href="${window.ANWhatsApp.order(items)}" target="_blank" rel="noopener noreferrer">Finalizar pedido por WhatsApp</a><button class="button button-outline" type="button" data-continue>Seguir explorando</button>`;
  }

  function open(fromModal = false) {
    previousFocus = document.activeElement;
    returnToModal = fromModal;
    backdrop.hidden = false;
    document.body.classList.add("no-scroll");
    drawer.querySelector(".drawer-close").focus();
  }

  function close() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.classList.remove("no-scroll");
    if (returnToModal && !document.getElementById("product-modal").hidden) {
      document.querySelector(".modal-add").focus();
    } else if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    } else {
      trigger.focus();
    }
  }

  function add(product, size, color, quantity) {
    if (!product || !product.disponible || !product.tallas.includes(size) ||
      !product.colores.some(entry => entry.nombre === color)) return false;
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount < 1 || amount > product.stock) return false;
    const found = items.find(item => item.id === product.id && item.talla === size && item.color === color);
    if (found) {
      if (found.cantidad + amount > product.stock) {
        showToast(`Solo hay ${product.stock} unidades disponibles de esta combinación.`);
        return false;
      }
      found.cantidad += amount;
    } else {
      items.push({ id: product.id, talla: size, color, cantidad: amount, precio: product.precio });
    }
    persist();
    render();
    showToast(`${product.nombre} se agregó al carrito.`);
    return true;
  }

  document.querySelectorAll("[data-open-cart]").forEach(button => button.addEventListener("click", () => open()));
  backdrop.addEventListener("click", event => { if (event.target === backdrop) close(); });
  drawer.addEventListener("click", event => {
    if (event.target.closest(".drawer-close") || event.target.closest("[data-continue]")) {
      close();
      if (event.target.closest("[data-continue]")) document.getElementById("tienda").scrollIntoView({ behavior: "smooth" });
      return;
    }
    const row = event.target.closest(".cart-item");
    if (!row) return;
    const index = Number(row.dataset.index);
    const product = products.find(entry => entry.id === items[index]?.id);
    if (event.target.closest("[data-remove]")) items.splice(index, 1);
    else if (event.target.closest("[data-cart-step]")) {
      const delta = Number(event.target.closest("[data-cart-step]").dataset.cartStep);
      const next = items[index].cantidad + delta;
      if (next < 1) return;
      if (next > product.stock) return;
      items[index].cantidad = next;
    } else return;
    persist();
    render();
  });
  document.addEventListener("keydown", event => {
    if (backdrop.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "Tab") {
      const focusable = [...drawer.querySelectorAll('button:not(:disabled), a[href], input, select')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  items = restore();
  render();
  window.ANCart = { add, open, close, showToast };
})();
