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
    // Initialize cleanly from localStorage directly on mount
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('restosys_cart');
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    return parsed.map(item => ({ ...item, image: getItemImage(item) }));
                }
            }
        } catch (e) {
            localStorage.removeItem('restosys_cart');
        }
        return [];
    });

    const [wishlist, setWishlist] = useState(() => {
        try {
            const savedWishlist = localStorage.getItem('restosys_wishlist');
            if (savedWishlist) {
                const parsed = JSON.parse(savedWishlist);
                if (Array.isArray(parsed)) {
                    return parsed.map(item => ({ ...item, image: getItemImage(item) }));
                }
            }
        } catch (e) {
            localStorage.removeItem('restosys_wishlist');
        }
        return [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);

    // Save changes to localStorage
    useEffect(() => {
        try {
            if (cartItems.length > 0) {
                localStorage.setItem('restosys_cart', JSON.stringify(cartItems));
            } else {
                localStorage.removeItem('restosys_cart');
            }
            if (wishlist.length > 0) {
                localStorage.setItem('restosys_wishlist', JSON.stringify(wishlist));
            } else {
                localStorage.removeItem('restosys_wishlist');
            }
        } catch (e) {}
    }, [cartItems, wishlist]);

    const addToCart = (item, quantity = 1) => {
        const itemId = item.id || item._id;
        const restId = typeof item.restaurantId === 'object' ? item.restaurantId?._id : (item.restaurantId || item.restaurant);
        const restName = typeof item.restaurantId === 'object' ? item.restaurantId?.name : (item.restaurantName || item.restaurantTitle);

        setCartItems(prev => {
            const existing = prev.find(i => (i.id || i._id) === itemId);
            if (existing) {
                return prev.map(i => (i.id || i._id) === itemId ? { 
                    ...i, 
                    quantity: i.quantity + quantity, 
                    image: getItemImage(i),
                    restaurantId: restId || i.restaurantId,
                    restaurantName: restName || i.restaurantName
                } : i);
            }
            return [...prev, { 
                ...item, 
                id: itemId, 
                _id: itemId, 
                quantity, 
                image: getItemImage(item),
                restaurantId: restId,
                restaurantName: restName
            }];
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
