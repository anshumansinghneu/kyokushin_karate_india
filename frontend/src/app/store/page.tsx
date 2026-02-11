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

declare global {
  interface Window { Razorpay: any; }
}

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
  const [cart, setCart] = useState<CartItem[]>([]);
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

  // Load Razorpay checkout script
  useEffect(() => {
    if (!document.querySelector('script[src*="checkout.razorpay.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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

    setCheckingOut(true);
    try {
      const items = cart.map((i) => ({
        productId: i.product.id,
        size: i.size,
        quantity: i.quantity,
      }));

      // Step 1: Create order with Razorpay
      let razorpayOrderId: string, amount: number, currency: string, keyId: string;
      try {
        const res = await api.post("/merch/orders", {
          items,
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingPincode: shipping.pincode,
        });
        ({ razorpayOrderId, amount, currency, keyId } = res.data.data);
      } catch (apiErr: any) {
        const msg = apiErr.response?.data?.message || apiErr.message || "Failed to create order";
        console.error("Create order failed:", msg, apiErr.response?.status);
        showToast(msg, "error");
        setCheckingOut(false);
        return;
      }

      // Step 2: Load Razorpay SDK if needed
      if (!window.Razorpay) {
        try {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="checkout.razorpay.com"]') as HTMLScriptElement;
            if (existing) {
              if (window.Razorpay) { resolve(); return; }
              existing.addEventListener('load', () => resolve());
              existing.addEventListener('error', () => reject(new Error('Failed to load payment gateway')));
              setTimeout(() => reject(new Error('Payment gateway load timeout')), 10000);
            } else {
              const s = document.createElement('script');
              s.src = 'https://checkout.razorpay.com/v1/checkout.js';
              s.onload = () => resolve();
              s.onerror = () => reject(new Error('Failed to load payment gateway'));
              document.body.appendChild(s);
              setTimeout(() => reject(new Error('Payment gateway load timeout')), 10000);
            }
          });
        } catch (scriptErr: any) {
          showToast(scriptErr.message, "error");
          setCheckingOut(false);
          return;
        }
      }
      if (!window.Razorpay) {
        showToast("Payment gateway not loaded. Please refresh.", "error");
        setCheckingOut(false);
        return;
      }

      // Step 2: Open Razorpay
      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency || "INR",
        name: "KKFI Store",
        description: `Merchandise Order (${cart.length} items)`,
        order_id: razorpayOrderId,
        prefill: {
          name: shipping.name,
          email: user?.email || "",
          contact: shipping.phone,
        },
        notes: { type: "merchandise" },
        theme: { color: "#DC2626" },
        modal: {
          ondismiss: () => {
            setCheckingOut(false);
            showToast("Payment cancelled", "error");
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Step 3: Verify payment
          try {
            await api.post("/merch/orders/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast("Order confirmed! Check your email for details.", "success");
            setCart([]);
            setCartOpen(false);
            setShowShipping(false);
          } catch (err: any) {
            showToast(err.response?.data?.message || "Payment verification failed", "error");
          } finally {
            setCheckingOut(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (resp: any) => {
        setCheckingOut(false);
        showToast(`Payment failed: ${resp.error?.description || "Please try again"}`, "error");
      });
      razorpay.open();
    } catch (err: any) {
      console.error("Checkout flow error:", err);
      showToast(err.response?.data?.message || err.message || "Failed to create order", "error");
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20">
      <div className="container mx-auto px-4">
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
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
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
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
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
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition-colors"
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
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
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
                                className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-white hover:bg-zinc-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold text-white w-6 text-center">
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
                                className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-white hover:bg-zinc-600"
                              >
                                <Plus className="w-3 h-3" />
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
                          className="text-gray-600 hover:text-red-500 self-start"
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
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={shipping.name}
                            onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none"
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={shipping.phone}
                            onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none"
                          />
                        </div>
                        <textarea
                          placeholder="Full Address"
                          value={shipping.address}
                          onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none resize-none"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={shipping.city}
                            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                            className="px-3 py-2.5 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={shipping.state}
                            onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                            className="px-3 py-2.5 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="PIN Code"
                            value={shipping.pincode}
                            onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })}
                            className="px-3 py-2.5 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none"
                          />
                        </div>
                        <Button
                          onClick={handleCheckout}
                          disabled={checkingOut}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-xl text-lg"
                        >
                          {checkingOut ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                          ) : (
                            `Pay ₹${cartTotal.toLocaleString()}`
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
