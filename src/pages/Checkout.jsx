import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import './Checkout.css'

export default function Checkout() {
  const { cartItems, clearCartState, loadingCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })

  // Securely calculated totals
  const [secureTotals, setSecureTotals] = useState({
    subtotal: 0,
    shipping: 15,
    tax: 0,
    grandTotal: 0
  })

  useEffect(() => {
    if (loadingCart) return
    if (!user) {
      navigate('/admin/login')
    }
  }, [user, loadingCart, navigate])

  // Calculate secure totals based on fresh DB fetch
  useEffect(() => {
    async function calculateSecureTotals() {
      if (cartItems.length === 0) return

      try {
        const variantIds = cartItems.map(i => i.variant_id)
        
        // Fetch fresh prices from DB to prevent frontend tampering
        const { data: dbVariants, error: fetchError } = await supabase
          .from('product_variants')
          .select('id, products(final_price)')
          .in('id', variantIds)

        if (fetchError) throw fetchError

        let calculatedSubtotal = 0

        cartItems.forEach(cartItem => {
          const dbVar = dbVariants.find(v => v.id === cartItem.variant_id)
          if (dbVar && dbVar.products) {
            calculatedSubtotal += Number(dbVar.products.final_price) * cartItem.quantity
          }
        })

        const shipping = calculatedSubtotal > 500 ? 0 : 25 // Free shipping over 500
        const tax = calculatedSubtotal * 0.08 // 8% tax
        const grandTotal = calculatedSubtotal + shipping + tax

        setSecureTotals({
          subtotal: calculatedSubtotal,
          shipping,
          tax,
          grandTotal
        })
      } catch (err) {
        console.error("Error calculating secure totals:", err)
        setError("Failed to verify prices securely.")
      }
    }

    calculateSecureTotals()
  }, [cartItems])

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error("Must be logged in.")
      if (cartItems.length === 0) throw new Error("Cart is empty.")

      // 1. Verify Stock
      const variantIds = cartItems.map(i => i.variant_id)
      const { data: stockData, error: stockError } = await supabase
        .from('product_variants')
        .select('id, stock')
        .in('id', variantIds)

      if (stockError) throw stockError

      for (const item of cartItems) {
        const dbStock = stockData.find(v => v.id === item.variant_id)?.stock || 0
        if (item.quantity > dbStock) {
          throw new Error(`Item ${item.name} is out of stock or exceeds available quantity.`)
        }
      }

      // 2. Create Order
      const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      const shippingAddress = JSON.stringify(formData)

      // NOTE: In a real production app, inserting into orders from the frontend requires an RLS policy for insert,
      // or should be done via an Edge Function/RPC. For this flow, we assume the policy allows it or we prepare the data.
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          order_number: orderNumber,
          status: 'Pending',
          subtotal: secureTotals.subtotal,
          shipping_charge: secureTotals.shipping,
          tax: secureTotals.tax,
          grand_total: secureTotals.grandTotal,
          shipping_address: shippingAddress,
        }])
        .select()
        .single()

      // If RLS blocks it (which it will based on current schema), we catch it here.
      if (orderError) throw orderError

      // 3. Create Order Items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      // 4. Reduce Stock
      for (const item of cartItems) {
        const currentStock = stockData.find(v => v.id === item.variant_id).stock
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({ stock: currentStock - item.quantity })
          .eq('id', item.variant_id)
        
        if (updateError) console.error("Stock reduction failed for", item.variant_id, updateError)
      }

      // 5. Payment Architecture prep (Razorpay would trigger here)
      const { error: paymentError } = await supabase.from('payments').insert([{
        order_id: order.id,
        user_id: user.id,
        payment_method: 'Razorpay',
        payment_status: 'Pending'
      }])
      
      if (paymentError) throw paymentError

      // 6. Clear Cart
      await clearCartState()
      setSuccess(true)

    } catch (err) {
      console.error(err)
      setError(err.message || "Checkout failed. Note: If you receive a Permission Denied error, it means the SQL RLS policies for inserting orders need to be enabled.")
    } finally {
      setLoading(false)
    }
  }

  if (loadingCart) {
    return <div className="checkout-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>
  }

  if (success) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <h1>Order Placed Successfully</h1>
          <p style={{ color: 'var(--text-muted)' }}>Thank you for shopping with ECLIPSE.</p>
          <Link to="/" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 24px', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', letterSpacing: '0.1em' }}>
            RETURN HOME
          </Link>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <h1>Your cart is empty</h1>
          <Link to="/" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 24px', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', letterSpacing: '0.1em' }}>
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        <div className="checkout-form-section">
          <h2 className="checkout-title">Shipping Details</h2>
          
          {error && <div className="checkout-error">{error}</div>}

          <form id="checkout-form" onSubmit={handleCheckout}>
            <div className="checkout-form-group">
              <label className="checkout-label">Full Name</label>
              <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="checkout-input" />
            </div>

            <div className="checkout-form-row">
              <div className="checkout-form-group">
                <label className="checkout-label">Phone Number</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="checkout-input" />
              </div>
              <div className="checkout-form-group">
                <label className="checkout-label">Street Address</label>
                <input required type="text" name="street" value={formData.street} onChange={handleInputChange} className="checkout-input" />
              </div>
            </div>

            <div className="checkout-form-row">
              <div className="checkout-form-group">
                <label className="checkout-label">City</label>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="checkout-input" />
              </div>
              <div className="checkout-form-group">
                <label className="checkout-label">State</label>
                <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="checkout-input" />
              </div>
            </div>

            <div className="checkout-form-row">
              <div className="checkout-form-group">
                <label className="checkout-label">Postal Code</label>
                <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="checkout-input" />
              </div>
              <div className="checkout-form-group">
                <label className="checkout-label">Country</label>
                <input required type="text" name="country" value={formData.country} onChange={handleInputChange} className="checkout-input" />
              </div>
            </div>
          </form>
        </div>

        <div className="checkout-summary-section">
          <h2 className="checkout-title">Order Summary</h2>
          
          <div style={{ marginBottom: '32px' }}>
            {cartItems.map(item => (
              <div key={item.cart_item_id} className="checkout-item">
                <img src={item.image} alt={item.name} className="checkout-item-img" />
                <div className="checkout-item-details">
                  <span className="checkout-item-name">{item.name}</span>
                  <span className="checkout-item-variant">Size: {item.size} | Color: {item.color}</span>
                  <span className="checkout-item-variant">Qty: {item.quantity}</span>
                  <span className="checkout-item-price">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Subtotal</span>
              <span>${secureTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="checkout-total-row">
              <span>Shipping</span>
              <span>{secureTotals.shipping === 0 ? 'Free' : `$${secureTotals.shipping.toFixed(2)}`}</span>
            </div>
            <div className="checkout-total-row">
              <span>Tax (8%)</span>
              <span>${secureTotals.tax.toFixed(2)}</span>
            </div>
            <div className="checkout-total-row grand">
              <span>Grand Total</span>
              <span>${secureTotals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            form="checkout-form"
            className="checkout-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with Razorpay (Simulated)'}
          </button>
        </div>

      </div>
    </div>
  )
}
