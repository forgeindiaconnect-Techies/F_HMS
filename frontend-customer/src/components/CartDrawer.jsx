import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { getItemImage } from '../utils/imageHelper';

const CartDrawer = () => {
    const { isCartOpen, setIsCartOpen, cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />
            
            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <ShoppingBag size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 font-sans">Your Cart</h2>
                    </div>
                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <ShoppingBag size={48} className="opacity-20" />
                            <p className="font-medium text-lg">Your cart is empty</p>
                            <button 
                                onClick={() => { setIsCartOpen(false); navigate('/menu'); }}
                                className="text-orange-600 font-bold hover:underline"
                            >
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 bg-white">
                                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                    <img 
                                        src={getItemImage(item)} 
                                        onError={(e) => { e.target.onerror = null; e.target.src = getItemImage({ ...item, image: '' }); }}
                                        alt={item.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                                            <p className="text-orange-600 font-bold text-sm mt-1">₹{item.price.toFixed(2)}</p>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                            <button 
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors rounded-l-lg"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors rounded-r-lg"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                        <div className="flex justify-between items-center text-gray-500 font-medium">
                            <span>Subtotal</span>
                            <span className="text-gray-900 font-bold">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-400 text-center">Taxes and discounts calculated at checkout.</p>
                        <button 
                            onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                        >
                            Proceed to Checkout <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
