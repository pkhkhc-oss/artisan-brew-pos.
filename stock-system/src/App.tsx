import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { cartTotal, stockStatus, toItems, type CartLine } from './lib'

type Branch = { id: number; branch_name: string }
type Row = { id: number; product_id: number; quantity: number; products: { product_name: string; sku: string; selling_price: number } }
type Move = { id: number; movement_type: string; quantity: number; notes: string | null; created_at: string; products: { product_name: string } }

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [branch, setBranch] = useState<number>(0)
  const [rows, setRows] = useState<Row[]>([])
  const [moves, setMoves] = useState<Move[]>([])
  const [tab, setTab] = useState<'stock' | 'sell' | 'history'>('stock')
  const [cart, setCart] = useState<CartLine[]>([])
  const [msg, setMsg] = useState('')
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const canManage = roles.includes('Admin') || roles.includes('Manager')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from('user_roles').select('roles(name)').eq('user_id', session.user.id)
      .then(({ data }) => setRoles((data ?? []).map((r: any) => r.roles?.name)))
    supabase.from('branches').select('id,branch_name').eq('status', true).then(({ data }) => {
      setBranches(data ?? []); if (data?.[0]) setBranch(b => b || data[0].id)
    })
  }, [session])

  const load = useCallback(async () => {
    if (!branch) return
    const inv = await supabase.from('inventory').select('id,product_id,quantity,products(product_name,sku,selling_price)').eq('branch_id', branch).order('product_id')
    setRows((inv.data as any) ?? [])
    const mv = await supabase.from('stock_movements').select('id,movement_type,quantity,notes,created_at,products(product_name)').eq('branch_id', branch).order('created_at', { ascending: false }).limit(50)
    setMoves((mv.data as any) ?? [])
  }, [branch])
  useEffect(() => { load() }, [load])

  const say = (m: string) => setMsg(m)

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) say(error.message)
  }
  async function adjust(product_id: number, type: string) {
    const q = Number(prompt(`Quantity for ${type}:`))
    if (!q || q <= 0) return
    const { error } = await supabase.rpc('adjust_inventory', { p_branch_id: branch, p_product_id: product_id, p_quantity: q, p_movement_type: type, p_notes: null })
    say(error ? error.message : 'Stock updated'); load()
  }
  async function checkout(method: string) {
    const items = toItems(cart)
    if (!items.length) return say('Cart is empty')
    const { data, error } = await supabase.rpc('checkout_sale', { p_branch_id: branch, p_items: items, p_payment_method: method })
    if (error) return say(error.message)
    say(`Sale ${data.invoice_number} — total ${data.total}`); setCart([]); load()
  }
  function addToCart(r: Row) {
    setCart(c => c.some(l => l.product_id === r.product_id)
      ? c.map(l => l.product_id === r.product_id ? { ...l, quantity: l.quantity + 1 } : l)
      : [...c, { product_id: r.product_id, quantity: 1, price: Number(r.products.selling_price) }])
  }

  if (!session) return (
    <div className="wrap"><h2>Stock Control — Sign in</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
      <button onClick={login}>Sign in</button>{msg && <div className="msg">{msg}</div>}</div>)

  return (
    <div className="wrap">
      <h2>Stock Control</h2>
      <select value={branch} onChange={e => setBranch(Number(e.target.value))}>
        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
      </select>
      <button className="alt" onClick={() => supabase.auth.signOut()}>Sign out</button>
      <nav>{(['stock', 'sell', 'history'] as const).map(t => <button key={t} className={tab === t ? 'on' : 'alt'} onClick={() => setTab(t)}>{t}</button>)}</nav>
      {msg && <div className="msg">{msg}</div>}

      {tab === 'stock' && <table><thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead>
        <tbody>{rows.map(r => <tr key={r.id}><td>{r.products.sku}</td><td>{r.products.product_name}</td><td>{r.quantity}</td>
          <td className={stockStatus(r.quantity)}>{stockStatus(r.quantity)}</td>
          {canManage && <td><button onClick={() => adjust(r.product_id, 'receive')}>Receive</button> <button className="alt" onClick={() => adjust(r.product_id, 'adjustment_out')}>Remove</button></td>}</tr>)}</tbody></table>}

      {tab === 'sell' && <>
        <table><tbody>{rows.filter(r => r.quantity > 0).map(r => <tr key={r.id}><td>{r.products.product_name}</td><td>{r.products.selling_price}</td><td>{r.quantity} left</td><td><button onClick={() => addToCart(r)}>Add</button></td></tr>)}</tbody></table>
        <div className="card"><b>Cart</b>{cart.map(l => <div key={l.product_id}>#{l.product_id} × {l.quantity} @ {l.price}</div>)}
          <p>Total: <b>{cartTotal(cart)}</b></p>
          <button onClick={() => checkout('cash')}>Pay cash</button> <button className="alt" onClick={() => setCart([])}>Clear</button></div></>}

      {tab === 'history' && <table><thead><tr><th>When</th><th>Product</th><th>Type</th><th>Qty</th></tr></thead>
        <tbody>{moves.map(m => <tr key={m.id}><td>{new Date(m.created_at).toLocaleString()}</td><td>{m.products.product_name}</td><td>{m.movement_type}</td><td>{m.quantity}</td></tr>)}</tbody></table>}
    </div>)
}
