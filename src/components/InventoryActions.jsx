import { useState } from 'react';
import { Plus, ShoppingCart, Truck, X, PackagePlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { createProduct, receivePurchase, recordSale } from '../services/api.js';

const initialProduct = {
  sku: '', name: '', category: 'Groceries', unit: 'units',
  openingStock: '0', costPrice: '0', sellingPrice: '0',
  supplierName: '', leadTimeDays: '7', minimumOrderQty: '1'
};

const initialTransaction = {
  productId: '', quantity: '', unitPrice: '', unitCost: '', reference: '', channel: 'counter'
};

export default function InventoryActions({ products = [], onComplete }) {
  const [mode, setMode] = useState('');
  const [product, setProduct] = useState(initialProduct);
  const [transaction, setTransaction] = useState(initialTransaction);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const close = () => {
    setMode('');
    setError('');
    setSuccess('');
  };

  const updateProduct = (key, value) => setProduct((current) => ({ ...current, [key]: value }));
  const updateTransaction = (key, value) => setTransaction((current) => ({ ...current, [key]: value }));

  async function submitProduct(event) {
    event.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await createProduct({
        ...product,
        sku: product.sku.trim() || undefined,
        openingStock: Number(product.openingStock),
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        leadTimeDays: Number(product.leadTimeDays),
        minimumOrderQty: Number(product.minimumOrderQty)
      });
      setProduct(initialProduct);
      setSuccess('Product created and opening stock recorded.');
      await onComplete?.();
      setMode('');
    } catch (err) {
      setError(err.message || 'Unable to create product.');
    } finally { setSaving(false); }
  }

  async function submitTransaction(event) {
    event.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        productId: transaction.productId,
        quantity: Number(transaction.quantity),
        reference: transaction.reference.trim()
      };
      if (mode === 'sale') {
        if (transaction.unitPrice !== '') payload.unitPrice = Number(transaction.unitPrice);
        payload.channel = transaction.channel;
        await recordSale(payload);
        setSuccess('Sale recorded and stock deducted.');
      } else {
        payload.unitCost = Number(transaction.unitCost || 0);
        await receivePurchase(payload);
        setSuccess('Purchase received and stock increased.');
      }
      setTransaction(initialTransaction);
      await onComplete?.();
      setMode('');
    } catch (err) {
      setError(err.message || 'Unable to save transaction.');
    } finally { setSaving(false); }
  }

  const selectedProduct = products.find((item) => item.id === transaction.productId || item.productId === transaction.productId);
  const fieldStyle = {
    width: '100%', minHeight: 40, border: '1px solid #d6dde7', borderRadius: 7,
    padding: '9px 11px', background: '#fff', color: '#172033', fontSize: 13
  };
  const labelStyle = { display: 'grid', gap: 6, color: '#475569', fontSize: 12, fontWeight: 650 };
  const buttonStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 8,
    padding: '10px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => { setMode('product'); setError(''); }} style={{ ...buttonStyle, background: '#1d4ed8', color: '#fff' }}>
          <Plus size={15} /> Add product
        </button>
        <button type="button" onClick={() => { setMode('sale'); setError(''); }} disabled={!products.length} style={{ ...buttonStyle, background: '#eff6ff', color: '#1d4ed8', opacity: products.length ? 1 : .5 }}>
          <ShoppingCart size={15} /> Record sale
        </button>
        <button type="button" onClick={() => { setMode('purchase'); setError(''); }} disabled={!products.length} style={{ ...buttonStyle, background: '#ecfdf5', color: '#047857', opacity: products.length ? 1 : .5 }}>
          <Truck size={15} /> Receive stock
        </button>
      </div>

      {mode && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) close(); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,.48)', display: 'grid', placeItems: 'center', padding: 18 }}>
          <section role="dialog" aria-modal="true" aria-labelledby="inventory-action-title"
            style={{ width: 'min(620px, 100%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 24px 80px rgba(15,23,42,.25)' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #e8edf3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 9, background: '#eff6ff', color: '#1d4ed8' }}>
                  {mode === 'product' ? <PackagePlus size={18} /> : mode === 'sale' ? <ShoppingCart size={18} /> : <Truck size={18} />}
                </span>
                <div>
                  <h2 id="inventory-action-title" style={{ margin: 0, fontSize: 17, color: '#172033' }}>
                    {mode === 'product' ? 'Add product' : mode === 'sale' ? 'Record a sale' : 'Receive purchase stock'}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                    {mode === 'product' ? 'Create a product record and opening balance.' : mode === 'sale' ? 'Record a completed sale against available stock.' : 'Add received quantity to the stock ledger.'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={close} disabled={saving} aria-label="Close" style={{ background: 'transparent', color: '#64748b', padding: 6, cursor: 'pointer' }}><X size={19} /></button>
            </header>

            {error && <div role="alert" style={{ margin: '16px 20px 0', padding: 11, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: 12, display: 'flex', gap: 8 }}><AlertCircle size={16} />{error}</div>}
            {success && <div role="status" style={{ margin: '16px 20px 0', padding: 11, borderRadius: 8, background: '#ecfdf5', color: '#047857', fontSize: 12, display: 'flex', gap: 8 }}><CheckCircle2 size={16} />{success}</div>}

            {mode === 'product' ? (
              <form onSubmit={submitProduct} style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 13 }}>
                <label style={labelStyle}>Product name *<input required maxLength={160} value={product.name} onChange={(e) => updateProduct('name', e.target.value)} style={fieldStyle} placeholder="e.g. Basmati Rice 5kg" /></label>
                <label style={labelStyle}>SKU (optional)<input value={product.sku} onChange={(e) => updateProduct('sku', e.target.value)} style={fieldStyle} placeholder="Auto-generated if blank" /></label>
                <label style={labelStyle}>Category *<input required value={product.category} onChange={(e) => updateProduct('category', e.target.value)} style={fieldStyle} placeholder="Groceries" /></label>
                <label style={labelStyle}>Unit *<input required value={product.unit} onChange={(e) => updateProduct('unit', e.target.value)} style={fieldStyle} placeholder="pcs, kg, litre" /></label>
                <label style={labelStyle}>Opening stock<input type="number" min="0" step="0.001" value={product.openingStock} onChange={(e) => updateProduct('openingStock', e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Cost price (₹)<input type="number" min="0" step="0.01" value={product.costPrice} onChange={(e) => updateProduct('costPrice', e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Selling price (₹)<input type="number" min="0" step="0.01" value={product.sellingPrice} onChange={(e) => updateProduct('sellingPrice', e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Supplier<input value={product.supplierName} onChange={(e) => updateProduct('supplierName', e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Supplier lead time (days)<input type="number" min="0" value={product.leadTimeDays} onChange={(e) => updateProduct('leadTimeDays', e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Minimum order quantity<input type="number" min="1" value={product.minimumOrderQty} onChange={(e) => updateProduct('minimumOrderQty', e.target.value)} style={fieldStyle} /></label>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 9, paddingTop: 8 }}>
                  <button type="button" onClick={close} style={{ ...buttonStyle, background: '#f1f5f9', color: '#475569' }}>Cancel</button>
                  <button disabled={saving} type="submit" style={{ ...buttonStyle, background: '#1d4ed8', color: '#fff', opacity: saving ? .6 : 1 }}>{saving ? 'Saving…' : 'Create product'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={submitTransaction} style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 13 }}>
                <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Product *<select required value={transaction.productId} onChange={(e) => updateTransaction('productId', e.target.value)} style={fieldStyle}><option value="">Select a product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku || item.id} · Stock {item.currentStock ?? item.stock ?? 0}</option>)}</select></label>
                <label style={labelStyle}>Quantity *<input required type="number" min="0.001" step="0.001" value={transaction.quantity} onChange={(e) => updateTransaction('quantity', e.target.value)} style={fieldStyle} /></label>
                {mode === 'sale' ? (
                  <>
                    <label style={labelStyle}>Unit selling price (₹)<input type="number" min="0" step="0.01" placeholder={selectedProduct ? String(selectedProduct.sellingPrice || 0) : 'Product default'} value={transaction.unitPrice} onChange={(e) => updateTransaction('unitPrice', e.target.value)} style={fieldStyle} /></label>
                    <label style={labelStyle}>Sales channel<select value={transaction.channel} onChange={(e) => updateTransaction('channel', e.target.value)} style={fieldStyle}><option value="counter">Counter</option><option value="online">Online</option><option value="wholesale">Wholesale</option><option value="other">Other</option></select></label>
                  </>
                ) : (
                  <label style={labelStyle}>Unit purchase cost (₹)<input type="number" min="0" step="0.01" value={transaction.unitCost} onChange={(e) => updateTransaction('unitCost', e.target.value)} style={fieldStyle} /></label>
                )}
                <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Reference / invoice number<input value={transaction.reference} onChange={(e) => updateTransaction('reference', e.target.value)} style={fieldStyle} placeholder="Optional reference" /></label>
                {mode === 'sale' && selectedProduct && (
                  <p style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: 12 }}>Available stock: <strong>{selectedProduct.currentStock ?? selectedProduct.stock ?? 0} {selectedProduct.unit || 'units'}</strong>. Sales above available stock are rejected by the server.</p>
                )}
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 9, paddingTop: 8 }}>
                  <button type="button" onClick={close} style={{ ...buttonStyle, background: '#f1f5f9', color: '#475569' }}>Cancel</button>
                  <button disabled={saving} type="submit" style={{ ...buttonStyle, background: mode === 'sale' ? '#1d4ed8' : '#047857', color: '#fff', opacity: saving ? .6 : 1 }}>{saving ? 'Saving…' : mode === 'sale' ? 'Save sale' : 'Receive stock'}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
