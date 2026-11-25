import { supabase } from "../config/supabase.js";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

export async function renderPOS(root) {
  root.innerHTML = [
    '<h2>POS Checkout</h2>',
    '<label>Branch<select id="pos-branch" required></select></label>',
    '<div class="pos-layout">',
    '<section><div id="pos-products" class="product-grid"></div></section>',
    '<aside class="cart-panel"><h3>Cart</h3><div id="pos-cart"></div>',
    '<label>Payment<select id="pos-method"><option value="cash">Cash</option><option value="card">Card</option><option value="bank">Bank</option><option value="qr">QR</option></select></label>',
    '<label>Reference<input id="pos-ref"></label><p id="pos-total"></p>',
    '<button id="pos-checkout">Complete sale</button><p id="pos-msg" class="message"></p></aside>',
    '</div>'
  ].join("");

  const $ = selector => root.querySelector(selector);
  let cart = new Map();
  let products = [];

  const { data: branches, error: branchError } = await supabase
    .from("branches")
    .select("id,branch_name")
    .eq("status", true)
    .order("branch_name");
  if (branchError) throw branchError;

  $("#pos-branch").innerHTML = (branches || []).map(branch =>
    '<option value="' + branch.id + '">' + escapeHtml(branch.branch_name) + '</option>'
  ).join("");

  async function loadProducts() {
    const { data, error } = await supabase
      .from("inventory")
      .select("quantity,product_id,products(id,product_name,sku,selling_price)")
      .eq("branch_id", Number($("#pos-branch").value));
    if (error) throw error;

    products = (data || [])
      .filter(row => Number(row.quantity) > 0 && row.products && row.products.id)
      .map(row => ({ ...row.products, available: Number(row.quantity) }));

    $("#pos-products").innerHTML = products.map(product =>
      '<button type="button" class="product-tile" data-id="' + product.id + '">' +
      escapeHtml(product.product_name) + '<br>$' + Number(product.selling_price).toFixed(2) +
      '<small>Stock ' + product.available + '</small></button>'
    ).join("") || "<p>No stock available for this branch.</p>";
  }

  function drawCart() {
    let estimatedSubtotal = 0;
    $("#pos-cart").innerHTML = [...cart.values()].map(item => {
      estimatedSubtotal += Number(item.selling_price) * item.quantity;
      return '<p>' + escapeHtml(item.product_name) + ' × ' + item.quantity +
        ' <button type="button" class="small-button" data-remove="' + item.id + '">Remove</button></p>';
    }).join("") || "Empty";
    $("#pos-total").textContent = "Estimated subtotal: $" + estimatedSubtotal.toFixed(2);
  }

  $("#pos-products").addEventListener("click", event => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    const product = products.find(item => item.id === Number(button.dataset.id));
    if (!product) return;
    const current = cart.get(product.id);
    const quantity = (current?.quantity || 0) + 1;
    if (quantity > product.available) {
      $("#pos-msg").textContent = "Not enough stock for " + product.product_name + ".";
      return;
    }
    cart.set(product.id, { ...product, quantity });
    $("#pos-msg").textContent = "";
    drawCart();
  });

  $("#pos-cart").addEventListener("click", event => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    cart.delete(Number(button.dataset.remove));
    drawCart();
  });

  $("#pos-branch").addEventListener("change", async () => {
    cart.clear();
    drawCart();
    try {
      await loadProducts();
      $("#pos-msg").textContent = "";
    } catch (error) {
      $("#pos-msg").textContent = error.message || "Unable to load branch stock.";
    }
  });

  $("#pos-checkout").addEventListener("click", async () => {
    if (!cart.size) {
      $("#pos-msg").textContent = "Add at least one product before checkout.";
      return;
    }
    if (!window.confirm("Submit this sale?")) return;

    // Open the print window synchronously from the click, before awaiting the server.
    const receiptWindow = window.open("", "_blank", "width=420,height=720");
    const itemsForReceipt = [...cart.values()].map(item => ({ ...item }));
    const paymentMethod = $("#pos-method").value;
    const referenceNumber = $("#pos-ref").value.trim() || null;
    const branchId = Number($("#pos-branch").value);
    const checkoutButton = $("#pos-checkout");
    checkoutButton.disabled = true;
    $("#pos-msg").textContent = "Processing checkout…";

    try {
      const { data, error } = await supabase.rpc("checkout_sale", {
        p_branch_id: branchId,
        p_items: itemsForReceipt.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        p_payment_method: paymentMethod,
        p_customer_id: null,
        p_reference_number: referenceNumber
      });
      if (error) throw error;
      if (!data || !data.invoice_number) {
        throw new Error("Sale response did not contain an invoice number. Check the transaction in the database before retrying.");
      }

      $("#pos-msg").textContent = "Sale saved: " + data.invoice_number +
        (receiptWindow ? ". Preparing receipt…" : ". Allow popups to print the receipt.");
      if (receiptWindow && !receiptWindow.closed) {
        const rows = itemsForReceipt.map(item =>
          "<tr><td>" + escapeHtml(item.product_name) + " × " + item.quantity +
          "</td><td style='text-align:right'>$" +
          (Number(item.selling_price) * item.quantity).toFixed(2) + "</td></tr>"
        ).join("");

        const receiptHtml = [
          "<!doctype html><html><head><meta charset='utf-8'><title>Receipt ",
          escapeHtml(data.invoice_number),
          "</title><style>",
          "body{font:13px Arial,sans-serif;width:300px;margin:20px auto;color:#111}",
          "h2,p{text-align:center;margin:5px 0}table{width:100%;border-collapse:collapse;margin:18px 0}",
          "td{padding:6px 0;border-bottom:1px dashed #bbb}.total{font-weight:bold;font-size:17px;border-top:2px solid #111;padding-top:8px}",
          ".muted{text-align:center;color:#555;font-size:11px}@media print{button{display:none}}",
          "</style></head><body><h2>ARTISAN BREW</h2><p>Sales Receipt</p><p>",
          escapeHtml(data.invoice_number),
          "</p><p>", escapeHtml(new Date().toLocaleString()),
          "</p><hr><table>", rows,
          "</table><p style='text-align:left'>Subtotal: $", Number(data.subtotal).toFixed(2),
          "</p><p style='text-align:left'>Tax: $", Number(data.tax).toFixed(2),
          "</p><p class='total'>TOTAL: $", Number(data.total).toFixed(2),
          "</p><p>Payment: ", escapeHtml(paymentMethod),
          "</p><hr><p class='muted'>Thank you for visiting Artisan Brew!</p>",
          "<script>window.addEventListener('load',()=>window.print())</script></body></html>"
        ].join("");

        receiptWindow.document.open();
        receiptWindow.document.write(receiptHtml);
        receiptWindow.document.close();
      }

      cart.clear();
      drawCart();
      $("#pos-ref").value = "";
      await loadProducts();
    } catch (error) {
      if (receiptWindow && !receiptWindow.closed) receiptWindow.close();
      $("#pos-msg").textContent = error.message || "Checkout failed.";
    } finally {
      checkoutButton.disabled = false;
    }
  });

  await loadProducts();
  drawCart();
}
