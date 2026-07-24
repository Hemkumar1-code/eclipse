import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import './CartDrawer.css'

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, updateQuantity, removeFromCart } = useCart()

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="cart-header">
              <h2 className="cart-title">Your Cart</h2>
              <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="cart-items">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p>Your cart is empty.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)', padding: '12px 24px', cursor: 'pointer', letterSpacing: '0.1em' }}
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cart_item_id} className="cart-item">
                    <img src={item.image} alt={item.name} className="cart-item-image" />
                    
                    <div className="cart-item-details">
                      <span className="cart-item-brand">{item.brand}</span>
                      <h3 className="cart-item-name">{item.name}</h3>
                      <span className="cart-item-variant">Size: {item.size} | Color: {item.color}</span>
                      
                      <button className="cart-remove-btn" onClick={() => removeFromCart(item.cart_item_id)}>
                        Remove
                      </button>

                      <div className="cart-item-bottom">
                        <div className="cart-quantity-controls">
                          <button 
                            className="cart-quantity-btn" 
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="cart-quantity-val">{item.quantity}</span>
                          <button 
                            className="cart-quantity-btn"
                            disabled={item.quantity >= item.stock}
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="cart-item-price">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div className="cart-subtotal">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <Link to="/checkout" className="cart-checkout-btn" onClick={() => setIsCartOpen(false)}>
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
