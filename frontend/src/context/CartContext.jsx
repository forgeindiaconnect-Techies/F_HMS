import { createContext, useContext, useState, useEffect } from 'react';
import { getItemImage } from '../utils/imageHelper';

const CartContext = createContext();

const defaultCartContext = {
    cartItems: [],
    wishlist: [],
    isCartOpen: false,
    setIsCartOpen: () => {},
    isWishlistOpen: false,
    setIsWishlistOpen: () => {},
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    toggleWishlist: () => {},
    clearCart: () => {},
    cartTotal: 0,
    cartCount: 0
};

export const useCart = () => {
    const context = useContext(CartContext);
    return context || defaultCartContext;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);

    // Load from local storage
    useEffect(() => {
        const savedCart = localStorage.getItem('restosys_cart');
        const savedWishlist = localStorage.getItem('restosys_wishlist');
        try {
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                setCartItems(parsed.map(item => ({ ...item, image: getItemImage(item) })));
            }
            if (savedWishlist) {
                const parsed = JSON.parse(savedWishlist);
                setWishlist(parsed.map(item => ({ ...item, image: getItemImage(item) })));
            }
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
                return prev.map(i => (i.id || i._id) === itemId ? { ...i, quantity: i.quantity + quantity, image: getItemImage(i) } : i);
            }
            return [...prev, { ...item, id: itemId, _id: itemId, quantity, image: getItemImage(item) }];
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
            return [...prev, { ...item, image: getItemImage(item) }];
        });
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems, wishlist, isCartOpen, setIsCartOpen,
            isWishlistOpen, setIsWishlistOpen,
            addToCart, removeFromCart, updateQuantity, toggleWishlist, clearCart,
            cartTotal, cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
