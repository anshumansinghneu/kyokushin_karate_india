"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Minus,
  ShoppingCart,
  X,
  Package,
  Tag,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  User as UserIcon,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: string;
  images: string[];
  sizes: string[];
  inStock: boolean;
  featured: boolean;
}

interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

const categories = [
  { key: "ALL", label: "All" },
  { key: "APPAREL", label: "Apparel" },
  { key: "EQUIPMENT", label: "Equipment" },
  { key: "ACCESSORIES", label: "Accessories" },
];

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kkfi_cart');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    }
    return [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('kkfi_cart', JSON.stringify(cart));
  }, [cart]);

  // Escape key to close modals/cart
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedProduct) setSelectedProduct(null);
        else if (cartOpen) setCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedProduct, cartOpen]);

  // Pre-fill shipping from user
  useEffect(() => {
    if (user) {
      setShipping((s) => ({
        ...s,
        name: s.name || user.name || "",
        phone: s.phone || user.phone || "",
        city: s.city || user.city || "",
        state: s.state || user.state || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = category !== "ALL" ? `?category=${category}` : "";
        const res = await api.get(`/merch/products${params}`);
        setProducts(res.data.data.products);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product, size: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.size === size
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    showToast(`${product.name} added to cart`, "success");
    setSelectedProduct(null);
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.size === size))
    );
  };

  const updateQuantity = (productId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId && i.size === size
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      showToast("Please login to place an order", "error");
      return;
    }
    if (cart.length === 0) return;

    // Validate shipping
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.state || !shipping.pincode) {
      showToast("Please fill in all shipping details", "error");
      return;
    }
    if (!/^\d{10}$/.test(shipping.phone)) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }
    if (!/^\d{6}$/.test(shipping.pincode)) {
      showToast("Please enter a valid 6-digit PIN code", "error");
      return;
    }

    setCheckingOut(true);
    try {
      const items = cart.map((i) => ({
        productId: i.product.id,
        size: i.size,
        quantity: i.quantity,
      }));

      await api.post("/merch/orders", {
        items,
        shippingName: shipping.name,
        shippingPhone: shipping.phone,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingPincode: shipping.pincode,
      });

      showToast("Order placed! You will be contacted for payment details.", "success");
      setCart([]);
      setCartOpen(false);
      setShowShipping(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to place order", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="container-responsive">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
              KKFI <span className="text-red-600">STORE</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Official Kyokushin Karate Federation merchandise
            </p>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black text-xs font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center active:scale-95 ${
                  category === cat.key
                    ? "bg-red-600 text-white"
                    : "bg-zinc-900 text-gray-400 border border-white/10 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-zinc-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-16 h-16 mx-auto mb-6 text-zinc-700" />
            <h3 className="text-2xl font-bold mb-2">No products found</h3>
            <p className="text-gray-500">
              Check back soon for new merchandise
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedProduct(product);
                  setSelectedSize(product.sizes[0] || "");
                }}
                className="group cursor-pointer bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-red-500/30 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}
                  {product.featured && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase">
                      Featured
                    </div>
                  )}
                  {product.comparePrice && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-green-600 text-white text-[10px] font-bold">
                      {Math.round(
                        ((product.comparePrice - product.price) /
                          product.comparePrice) *
                          100
                      )}
                      % OFF
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">
                    {product.category}
                  </p>
                  <h3 className="font-bold text-white group-hover:text-red-500 transition-colors mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.comparePrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Product Detail Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 rounded-2xl overflow-hidden max-w-md w-full border border-white/10"
              >
                {/* Image */}
                <div className="aspect-video bg-zinc-800 relative">
                  {selectedProduct.images[0] ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-zinc-700" />
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition-colors active:scale-90"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="p-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                    {selectedProduct.category}
                  </p>
                  <h2 className="text-2xl font-black text-white mb-2">
                    {selectedProduct.name}
                  </h2>
                  {selectedProduct.description && (
                    <p className="text-gray-400 text-sm mb-4">
                      {selectedProduct.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl font-black text-white">
                      ₹{selectedProduct.price.toLocaleString()}
                    </span>
                    {selectedProduct.comparePrice && (
                      <span className="text-lg text-gray-500 line-through">
                        ₹{selectedProduct.comparePrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Sizes */}
                  {selectedProduct.sizes.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-bold text-gray-400 mb-2">
                        Size
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedProduct.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              selectedSize === size
                                ? "bg-red-600 text-white"
                                : "bg-zinc-800 text-gray-400 border border-white/10 hover:text-white"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() =>
                      addToCart(selectedProduct, selectedSize || "One Size")
                    }
                    disabled={!selectedProduct.inStock}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl text-lg"
                  >
                    {selectedProduct.inStock ? (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    ) : (
                      "Out of Stock"
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Drawer */}
        <AnimatePresence>
          {cartOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 flex flex-col"
              >
                {/* Cart Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Cart ({cartCount})
                  </h2>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={`${item.product.id}-${item.size}`}
                        className="flex gap-4 p-4 rounded-xl bg-zinc-800 border border-white/5"
                      >
                        <div className="w-16 h-16 rounded-lg bg-zinc-700 flex-shrink-0 overflow-hidden">
                          {item.product.images[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Size: {item.size}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.size,
                                    -1
                                  )
                                }
                                className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center text-white hover:bg-zinc-600 active:scale-90 transition-transform min-w-[36px] min-h-[36px]"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-bold text-white w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.size,
                                    1
                                  )
                                }
                                className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center text-white hover:bg-zinc-600 active:scale-90 transition-transform min-w-[36px] min-h-[36px]"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="font-bold text-white text-sm">
                              ₹
                              {(
                                item.product.price * item.quantity
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            removeFromCart(item.product.id, item.size)
                          }
                          className="text-gray-600 hover:text-red-500 self-start p-2 -mr-2 rounded-lg hover:bg-white/5 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-90 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Footer */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total</span>
                      <span className="text-2xl font-black text-white">
                        ₹{cartTotal.toLocaleString()}
                      </span>
                    </div>

                    {!showShipping ? (
                      <Button
                        onClick={() => {
                          if (!isAuthenticated) {
                            showToast("Please login to place an order", "error");
                            return;
                          }
                          setShowShipping(true);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl text-lg"
                      >
                        Proceed to Checkout
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Shipping Details</p>
                        <div>
                          <label htmlFor="ship-name" className="text-xs text-gray-500 mb-1 block">Full Name</label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              id="ship-name"
                              type="text"
                              placeholder="Full Name"
                              value={shipping.name}
                              onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="ship-phone" className="text-xs text-gray-500 mb-1 block">Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              id="ship-phone"
                              type="tel"
                              placeholder="Phone"
                              value={shipping.phone}
                              onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="ship-address" className="text-xs text-gray-500 mb-1 block">Full Address</label>
                          <textarea
                            id="ship-address"
                            placeholder="Full Address"
                            value={shipping.address}
                            onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label htmlFor="ship-city" className="text-xs text-gray-500 mb-1 block">City</label>
                            <input
                              id="ship-city"
                              type="text"
                              placeholder="City"
                              value={shipping.city}
                              onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label htmlFor="ship-state" className="text-xs text-gray-500 mb-1 block">State</label>
                            <input
                              id="ship-state"
                              type="text"
                              placeholder="State"
                              value={shipping.state}
                              onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label htmlFor="ship-pincode" className="text-xs text-gray-500 mb-1 block">PIN Code</label>
                            <input
                              id="ship-pincode"
                              type="text"
                              placeholder="PIN Code"
                              value={shipping.pincode}
                              onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })}
                              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleCheckout}
                          disabled={checkingOut}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-xl text-lg"
                        >
                          {checkingOut ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Placing Order...</>
                          ) : (
                            `Place Order — ₹${cartTotal.toLocaleString()}`
                          )}
                        </Button>
                        <button
                          onClick={() => setShowShipping(false)}
                          className="w-full text-center text-sm text-gray-500 hover:text-white transition-colors"
                        >
                          Back to Cart
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
