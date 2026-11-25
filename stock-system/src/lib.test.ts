import { describe, it, expect } from 'vitest'
import { cartTotal, stockStatus, toItems } from './lib'
describe('lib', () => {
  it('totals cart', () => expect(cartTotal([{ product_id: 1, quantity: 3, price: 10.1 }, { product_id: 2, quantity: 1, price: 0.2 }])).toBe(30.5))
  it('stock status', () => { expect(stockStatus(0)).toBe('out'); expect(stockStatus(3)).toBe('low'); expect(stockStatus(50)).toBe('ok') })
  it('drops empty lines', () => expect(toItems([{ product_id: 1, quantity: 0, price: 1 }, { product_id: 2, quantity: 2, price: 1 }])).toEqual([{ product_id: 2, quantity: 2 }]))
})
