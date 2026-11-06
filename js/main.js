(() => {
  const products = window.ANProducts;
  const featured = document.getElementById("new-products");
  const catalog = document.getElementById("all-products");
  const search = document.getElementById("product-search");
  const sort = document.getElementById("sort-products");
  const filters = document.getElementById("category-filters");
  const resultCount = document.getElementById("results-count");
  const emptyState = document.getElementById("empty-state");
  const modal = document.getElementById("product-modal");
  const sizeSelect = document.getElementById("product-size");
  const quantityInput = document.getElementById("product-quantity");
  const sizeError = document.getElementById("size-error");
  const colorError = document.getElementById("color-error");
  let selectedCategory = "Todo";
  let currentProduct = null;
  let selectedColor = "";
  let modalOpener = null;

  const esc = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function cardMarkup(product) {
    const sale = product.precioAnterior ? `<span class="product-badge sale">Oferta</span>` : "";
    const fresh = product.nuevo ? `<span class="product-badge">Nuevo</span>` : "";
    return `<article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${esc(product.imagenes[0])}" width="600" height="800" loading="lazy" alt="${esc(product.nombre)}">
        ${fresh}${sale}
      </div>
      <div class="product-meta"><div><p class="product-category">${esc(product.categoria)}</p><h3 class="product-name">${esc(product.nombre)}</h3>
      <p class="product-price">${window.ANWhatsApp.money(product.precio)}${product.precioAnterior ? `<del class="old-price">${window.ANWhatsApp.money(product.precioAnterior)}</del>` : ""}</p></div>
      <button class="product-details" type="button" data-product-id="${esc(product.id)}" ${product.disponible ? "" : "disabled"}>${product.disponible ? "Ver detalles" : "Agotado"}</button></div>
    </article>`;
  }

  function renderFeatured() {
    featured.innerHTML = products.filter(product => product.nuevo).slice(0, 6).map(cardMarkup).join("");
  }

  function matchingProducts() {
    const query = search.value.trim().toLocaleLowerCase("es");
    const visible = products.filter(product => {
      const matchesCategory = selectedCategory === "Todo" ||
        (selectedCategory === "Ofertas" ? Boolean(product.precioAnterior) : product.categoria === selectedCategory);
      return matchesCategory && product.nombre.toLocaleLowerCase("es").includes(query);
    });
    if (sort.value === "ascending") visible.sort((a, b) => a.precio - b.precio);
    if (sort.value === "descending") visible.sort((a, b) => b.precio - a.precio);
    return visible;
  }

  function renderCatalog() {
    const visible = matchingProducts();
    catalog.innerHTML = visible.map(cardMarkup).join("");
    resultCount.textContent = `${visible.length} ${visible.length === 1 ? "producto" : "productos"}`;
    emptyState.hidden = visible.length > 0;
    catalog.hidden = visible.length === 0;
  }

  function setCategory(category) {
    selectedCategory = category;
    filters.querySelectorAll("[data-category]").forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderCatalog();
  }

  function openProduct(id, opener) {
    currentProduct = products.find(product => product.id === id);
    if (!currentProduct) return;
    modalOpener = opener;
    selectedColor = "";
    sizeError.textContent = "";
    colorError.textContent = "";
    modal.querySelector(".modal-category").textContent = currentProduct.categoria;
    modal.querySelector("#modal-title").textContent = currentProduct.nombre;
    modal.querySelector("#modal-description").textContent = currentProduct.descripcion;
    modal.querySelector(".modal-prices").innerHTML = `${window.ANWhatsApp.money(currentProduct.precio)}${currentProduct.precioAnterior ? ` <del class="old-price">${window.ANWhatsApp.money(currentProduct.precioAnterior)}</del>` : ""}`;
    modal.querySelector(".availability").textContent = currentProduct.disponible ? `Disponible · ${currentProduct.stock} ${currentProduct.stock === 1 ? "unidad" : "unidades"}` : "Producto agotado";
    sizeSelect.replaceChildren(new Option("Selecciona una talla", ""));
    currentProduct.tallas.forEach(size => sizeSelect.add(new Option(size, size)));
    quantityInput.value = "1";
    quantityInput.max = String(Math.max(1, currentProduct.stock));
    quantityInput.disabled = !currentProduct.disponible;
    const addButton = modal.querySelector(".modal-add");
    addButton.disabled = !currentProduct.disponible;
    modal.querySelector(".modal-whatsapp").disabled = !currentProduct.disponible;
    const mainImage = modal.querySelector(".modal-main-image");
    mainImage.src = currentProduct.imagenes[0];
    mainImage.alt = currentProduct.nombre;
    modal.querySelector(".thumbnail-list").innerHTML = currentProduct.imagenes.map((image, index) =>
      `<button class="thumbnail-button" type="button" data-image-index="${index}" aria-label="Ver imagen ${index + 1} de ${esc(currentProduct.nombre)}" aria-pressed="${index === 0}"><img src="${esc(image)}" width="60" height="76" loading="lazy" alt=""></button>`
    ).join("");
    modal.querySelector(".color-options").innerHTML = currentProduct.colores.map(color =>
      `<button class="color-swatch" type="button" data-color="${esc(color.nombre)}" aria-pressed="false"><span class="swatch-dot" style="background-color:${esc(color.hex)}"></span>${esc(color.nombre)}</button>`
    ).join("");
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    modal.querySelector(".modal-close").focus();
  }

  function closeProduct(restoreFocus = true) {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (restoreFocus && modalOpener && modalOpener.isConnected) modalOpener.focus();
  }

  function validSelection() {
    let valid = true;
    if (!sizeSelect.value) {
      sizeError.textContent = "Selecciona una talla para continuar.";
      valid = false;
    } else sizeError.textContent = "";
    if (!selectedColor) {
      colorError.textContent = "Selecciona un color para continuar.";
      valid = false;
    } else colorError.textContent = "";
    return valid;
  }

  featured.addEventListener("click", event => {
    const button = event.target.closest("[data-product-id]");
    if (button && !button.disabled) openProduct(button.dataset.productId, button);
  });
  catalog.addEventListener("click", event => {
    const button = event.target.closest("[data-product-id]");
    if (button && !button.disabled) openProduct(button.dataset.productId, button);
  });
  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (button) setCategory(button.dataset.category);
  });
  search.addEventListener("input", renderCatalog);
  sort.addEventListener("change", renderCatalog);
  document.getElementById("clear-filters").addEventListener("click", () => {
    search.value = "";
    sort.value = "default";
    setCategory("Todo");
    search.focus();
  });
  document.querySelectorAll("[data-footer-category]").forEach(link => link.addEventListener("click", () => {
    setCategory(link.dataset.footerCategory);
  }));
  document.querySelector(".menu-toggle").addEventListener("click", event => {
    const button = event.currentTarget;
    const nav = document.getElementById("primary-nav");
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("is-open", open);
  });
  document.querySelectorAll(".primary-nav a").forEach(link => link.addEventListener("click", () => {
    document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
    document.querySelector(".menu-toggle").setAttribute("aria-label", "Abrir menú");
    document.getElementById("primary-nav").classList.remove("is-open");
  }));
  window.addEventListener("scroll", () => document.querySelector(".site-header").classList.toggle("is-scrolled", window.scrollY > 24), { passive: true });

  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest(".modal-close")) closeProduct();
    const thumbnail = event.target.closest("[data-image-index]");
    if (thumbnail && currentProduct) {
      const index = Number(thumbnail.dataset.imageIndex);
      modal.querySelector(".modal-main-image").src = currentProduct.imagenes[index];
      modal.querySelectorAll(".thumbnail-button").forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(index === buttonIndex)));
    }
    const swatch = event.target.closest("[data-color]");
    if (swatch) {
      selectedColor = swatch.dataset.color;
      colorError.textContent = "";
      modal.querySelectorAll(".color-swatch").forEach(button => button.setAttribute("aria-pressed", String(button === swatch)));
    }
    const step = event.target.closest("[data-quantity-step]");
    if (step && currentProduct) {
      const next = Math.max(1, Math.min(currentProduct.stock, Number(quantityInput.value || 1) + Number(step.dataset.quantityStep)));
      quantityInput.value = String(next);
    }
    if (event.target.closest(".modal-add") && currentProduct && validSelection()) {
      const amount = Math.max(1, Math.min(currentProduct.stock, Number(quantityInput.value) || 1));
      quantityInput.value = String(amount);
      if (window.ANCart.add(currentProduct, sizeSelect.value, selectedColor, amount)) {
        closeProduct(false);
        if (modalOpener && modalOpener.isConnected) modalOpener.focus();
        window.ANCart.open();
      }
    }
    if (event.target.closest(".modal-whatsapp") && currentProduct && validSelection()) {
      window.open(window.ANWhatsApp.productInquiry(currentProduct, sizeSelect.value, selectedColor), "_blank", "noopener,noreferrer");
    }
  });
  sizeSelect.addEventListener("change", () => { if (sizeSelect.value) sizeError.textContent = ""; });
  quantityInput.addEventListener("change", () => {
    const amount = Number(quantityInput.value) || 1;
    quantityInput.value = String(Math.max(1, Math.min(currentProduct?.stock || 1, amount)));
  });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeProduct(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.querySelector(".primary-nav").classList.contains("is-open")) {
      const button = document.querySelector(".menu-toggle");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Abrir menú");
      document.querySelector(".primary-nav").classList.remove("is-open");
      button.focus();
    }
  });
  document.getElementById("current-year").textContent = String(new Date().getFullYear());

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    document.querySelectorAll(".section, .product-card, .benefit").forEach(element => observer.observe(element));
  }
  renderFeatured();
  renderCatalog();
})();
