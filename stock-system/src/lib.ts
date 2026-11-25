export type CartLine = { product_id: number; quantity: number; price: number }
export const cartTotal = (lines: CartLine[]) =>
  Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100
export const stockStatus = (qty: number, min = 5) =>
  qty <= 0 ? 'out' : qty <= min ? 'low' : 'ok'
export const toItems = (lines: CartLine[]) =>
  lines.filter(l => l.quantity > 0).map(({ product_id, quantity }) => ({ product_id, quantity }))
