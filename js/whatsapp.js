(() => {
  const phone = "593994368889";
  const money = value => `$${Number(value).toFixed(2)}`;
  const productLine = (item, index) => {
    const product = window.ANProducts.find(entry => entry.id === item.id);
    const name = item.nombre || product?.nombre || "Producto";
    return `${index + 1}. ${name} — Talla ${item.talla} — Color ${item.color} — ${item.cantidad} x ${money(item.precio)} = ${money(item.cantidad * item.precio)}`;
  };

  window.ANWhatsApp = {
    money,
    productInquiry(product, size, color) {
      const text = `Hola, quisiera consultar por este producto:\n${product.nombre} — Talla ${size} — Color ${color} — ${money(product.precio)}.`;
      return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    },
    order(cart) {
      const lines = cart.map(productLine).join("\n");
      const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
      const message = `Hola, quisiera hacer este pedido:\n${lines}\nTotal estimado: ${money(total)}\n(Precios y disponibilidad sujetos a confirmación.)`;
      return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }
  };
})();
