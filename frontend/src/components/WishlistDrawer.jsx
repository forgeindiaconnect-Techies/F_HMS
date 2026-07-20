import { X, Heart, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const WishlistDrawer = () => {
    const { isWishlistOpen, setIsWishlistOpen, wishlist, toggleWishlist, addToCart, setIsCartOpen } = useCart();
    const navigate = useNavigate();

    if (!isWishlistOpen) return null;

    const handleAddToCart = (item) => {
        addToCart(item);
        setIsWishlistOpen(false);
        setIsCartOpen(true);
    };

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
                onClick={() => setIsWishlistOpen(false)}
            />
            
            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                            <Heart size={20} className="fill-rose-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 font-sans">Your Favorites</h2>
                    </div>
                    <button 
                        onClick={() => setIsWishlistOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {wishlist.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <Heart size={48} className="opacity-20" />
                            <p className="font-medium text-lg">Your wishlist is empty</p>
                            <button 
                                onClick={() => { setIsWishlistOpen(false); navigate('/menu'); }}
                                className="text-orange-600 font-bold hover:underline"
                            >
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        wishlist.map((item) => {
                            const itemId = item.id || item._id;
                            return (
                                <div key={itemId} className="flex gap-4 bg-white items-center">
                                    <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                        <img src={item.image || item.img} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                                                <p className="text-orange-600 font-bold text-sm mt-1">₹{item.price.toFixed(2)}</p>
                                            </div>
                                            <button 
                                                onClick={() => toggleWishlist(item)}
                                                className="text-red-500 hover:text-red-600 transition-colors p-1"
                                                title="Remove from Favorites"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <button 
                                                onClick={() => handleAddToCart(item)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-orange-600/10 active:scale-95"
                                            >
                                                <ShoppingCart size={12} /> Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};

export default WishlistDrawer;
