import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartId, setCartId] = useState(null)
  const [loadingCart, setLoadingCart] = useState(true)

  // Fetch or create user cart
  useEffect(() => {
    if (!user) {
      setCartItems([])
      setCartId(null)
      setLoadingCart(false)
      return
    }

    async function loadCart() {
      try {
        setLoadingCart(true)
        // 1. Get cart
        let { data: cart, error: cartError } = await supabase.from('cart').select('*').eq('user_id', user.id).maybeSingle()
        
        if (!cart) {
          const { data: newCart, error: insertError } = await supabase.from('cart').insert([{ user_id: user.id }]).select().single()
          if (insertError) throw insertError
          cart = newCart
        }
        setCartId(cart.id)

        // 2. Get cart items
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id, quantity,
            product_variant_id,
            product_variants (
              id, size, color, stock,
              products ( id, name, final_price, brand, product_images(image_url, is_primary) )
            )
          `)
          .eq('cart_id', cart.id)

        if (itemsError) throw itemsError

        // Format items for easy frontend consumption
        const formattedItems = (items || []).map(item => {
          const pv = item.product_variants
          const p = pv.products
          const img = p.product_images?.find(i => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || 'https://via.placeholder.com/150'
          return {
            cart_item_id: item.id,
            variant_id: pv.id,
            product_id: p.id,
            name: p.name,
            brand: p.brand,
            size: pv.size,
            color: pv.color,
            price: p.final_price,
            stock: pv.stock,
            quantity: item.quantity,
            image: img
          }
        })
        setCartItems(formattedItems)
      } catch (err) {
        console.error("Error loading cart:", err)
      } finally {
        setLoadingCart(false)
      }
    }
    loadCart()
  }, [user])

  const addToCart = async (variant, quantity = 1) => {
    if (!user) {
      alert("Please log in to add items to your cart.")
      return
    }

    try {
      // Check if already in cart
      const existing = cartItems.find(item => item.variant_id === variant.id)
      if (existing) {
        // Update quantity
        const newQ = existing.quantity + quantity
        await updateQuantity(existing.cart_item_id, newQ)
        setIsCartOpen(true)
        return
      }

      // Insert new
      const { data, error } = await supabase
        .from('cart_items')
        .insert([{ cart_id: cartId, product_variant_id: variant.id, quantity }])
        .select(`
          id, quantity, product_variant_id,
          product_variants (
            id, size, color, stock,
            products ( id, name, final_price, brand, product_images(image_url, is_primary) )
          )
        `).single()

      if (error) throw error

      const pv = data.product_variants
      const p = pv.products
      const img = p.product_images?.find(i => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || 'https://via.placeholder.com/150'
      
      const newItem = {
        cart_item_id: data.id,
        variant_id: pv.id,
        product_id: p.id,
        name: p.name,
        brand: p.brand,
        size: pv.size,
        color: pv.color,
        price: p.final_price,
        stock: pv.stock,
        quantity: data.quantity,
        image: img
      }

      setCartItems(prev => [...prev, newItem])
      setIsCartOpen(true)
    } catch (err) {
      console.error("Error adding to cart:", err)
      alert("Could not add to cart.")
    }
  }

  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        await removeFromCart(cartItemId)
        return
      }

      // Check stock limit
      const item = cartItems.find(i => i.cart_item_id === cartItemId)
      if (item && newQuantity > item.stock) {
        alert("Cannot exceed available stock")
        return
      }

      const { error } = await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId)
      if (error) throw error

      setCartItems(prev => prev.map(item => item.cart_item_id === cartItemId ? { ...item, quantity: newQuantity } : item))
    } catch (err) {
      console.error("Error updating quantity:", err)
    }
  }

  const removeFromCart = async (cartItemId) => {
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId)
      if (error) throw error
      setCartItems(prev => prev.filter(item => item.cart_item_id !== cartItemId))
    } catch (err) {
      console.error("Error removing item:", err)
    }
  }
  
  const clearCartState = async () => {
    try {
       // Only clear frontend, backend is cleared via order process (or we can delete here)
       // Usually, upon checkout, we delete all cart_items for this cart.
       await supabase.from('cart_items').delete().eq('cart_id', cartId)
       setCartItems([])
    } catch (e) {
       console.error(e)
    }
  }

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      loadingCart, 
      isCartOpen, 
      setIsCartOpen, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCartState
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
