import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from local storage
    useEffect(() => {
        const savedCart = localStorage.getItem('restosys_cart');
        const savedWishlist = localStorage.getItem('restosys_wishlist');
        try {
            if (savedCart) setCartItems(JSON.parse(savedCart));
            if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
        } catch (e) {
            localStorage.removeItem('restosys_cart');
            localStorage.removeItem('restosys_wishlist');
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem('restosys_cart', JSON.stringify(cartItems));
        localStorage.setItem('restosys_wishlist', JSON.stringify(wishlist));
    }, [cartItems, wishlist]);

    const addToCart = (item, quantity = 1) => {
        const itemId = item.id || item._id;
        setCartItems(prev => {
            const existing = prev.find(i => (i.id || i._id) === itemId);
            if (existing) {
                return prev.map(i => (i.id || i._id) === itemId ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { ...item, id: itemId, _id: itemId, quantity }];
        });
        setIsCartOpen(true); // Auto open cart when adding
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(i => (i.id || i._id) !== id));
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            const itemId = item.id || item._id;
            if (itemId === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const toggleWishlist = (item) => {
        setWishlist(prev => {
            const itemId = item._id || item.id;
            const exists = prev.find(i => (i._id || i.id) === itemId);
            if (exists) {
                return prev.filter(i => (i._id || i.id) !== itemId);
            }
            return [...prev, item];
        });
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems, wishlist, isCartOpen, setIsCartOpen,
            addToCart, removeFromCart, updateQuantity, toggleWishlist, clearCart,
            cartTotal, cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
