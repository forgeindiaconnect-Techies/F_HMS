import { useState, useEffect } from 'react';
import { X, ShoppingBag, Heart, Star, Store, Plus, Minus, Sparkles } from 'lucide-react';
import { getItemImage } from '../utils/imageHelper';

const DishDetailModal = ({
    dish,
    isOpen,
    onClose,
    onAddToCart,
    isWishlisted = false,
    onToggleWishlist
}) => {
    const [qty, setQty] = useState(1);

    useEffect(() => {
        if (isOpen) setQty(1);
    }, [isOpen, dish?._id, dish?.id]);

    if (!isOpen || !dish) return null;

    const imgSrc = getItemImage(dish);
    const restName = dish.restaurantName || dish.restaurantId?.name || 'Partner Restaurant';
    const description = dish.description && dish.description.trim()
        ? dish.description.trim()
        : `Freshly prepared ${dish.name} crafted with authentic ingredients${dish.category ? ` in our ${dish.category} kitchen` : ''}.`;
    const totalPrice = (Number(dish.price || 0) * qty).toFixed(2);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Dish Image Header */}
                <div className="relative aspect-[16/10] w-full bg-slate-100 shrink-0 overflow-hidden">
                    {imgSrc ? (
                        <img
                            src={imgSrc}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-[#FF5A1F]">
                            <ShoppingBag size={40} className="opacity-50" />
                            <span className="text-xs font-bold text-slate-400 mt-1.5">{dish.category || 'Specialty Dish'}</span>
                        </div>
                    )}

                    {/* Close & Wishlist Buttons */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dish details"
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>

                    {onToggleWishlist && (
                        <button
                            type="button"
                            onClick={() => onToggleWishlist(dish)}
                            aria-label="Toggle Wishlist"
                            className={`absolute top-3 left-3 w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer ${
                                isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/95 text-slate-600 hover:text-rose-500'
                            }`}
                        >
                            <Heart size={16} className={isWishlisted ? 'fill-white' : ''} />
                        </button>
                    )}

                    {dish.category && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider">
                            {dish.category}
                        </span>
                    )}
                </div>

                {/* Dish Body & Full Description */}
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5A1F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                                <Store size={12} /> {restName}
                            </span>
                            {dish.rating && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                                    <Star size={11} className="fill-amber-400 text-amber-400" /> {dish.rating}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 leading-snug">{dish.name}</h3>
                    </div>

                    {/* Dish Description */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Sparkles size={11} className="text-[#FF5A1F]" /> Dish Description
                        </span>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                            {description}
                        </p>
                    </div>

                    {/* Price & Quantity Row */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">₹{dish.price}</span>
                            {dish.originalPrice && Number(dish.originalPrice) > Number(dish.price) && (
                                <span className="text-sm font-semibold text-slate-400 line-through">₹{dish.originalPrice}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-2xs hover:bg-slate-50 cursor-pointer"
                                aria-label="Decrease quantity"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-black text-slate-900">{qty}</span>
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="w-8 h-8 rounded-lg bg-[#FF5A1F] text-white flex items-center justify-center shadow-2xs hover:bg-[#e04f1a] cursor-pointer"
                                aria-label="Increase quantity"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Confirm Add to Cart Button */}
                    <button
                        type="button"
                        onClick={() => {
                            onAddToCart(dish, qty);
                            onClose();
                        }}
                        className="w-full py-3.5 px-4 bg-[#FF5A1F] hover:bg-[#e04f1a] active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#FF5A1F]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <ShoppingBag size={16} />
                        <span>Add {qty > 1 ? `${qty} Items ` : ''}to Cart — ₹{totalPrice}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DishDetailModal;

