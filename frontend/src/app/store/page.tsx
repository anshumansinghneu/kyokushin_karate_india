"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  X,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";
import KankuMark from "@/components/KankuMark";
import Portal from "@/components/ui/portal";

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

const categoryLabel = (c: string) => c.charAt(0) + c.slice(1).toLowerCase();
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** DESIGN.md underline field for the checkout form. */
const fieldClass =
  "w-full min-h-12 rounded-none border-0 border-b-2 border-white/25 bg-transparent px-1 text-base text-white placeholder:text-white/45 transition-colors focus:outline-none focus-visible:border-primary";

/** A product shot on black, or the Kanku as a quiet stand-in when there is no photograph. */
function ProductImage({ product, className = "" }: { product: Product; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#0d0d0d] ${className}`}>
      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <KankuMark className="h-20 w-20 text-white/15" />
          <span className="text-sm font-semibold text-white/45">{categoryLabel(product.category)}</span>
        </div>
      )}
      {!product.inStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <span className="border border-white/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-white">Out of stock</span>
        </div>
      )}
    </div>
  );
}

function PriceLine({ product, large = false }: { product: Product; large?: boolean }) {
  const off = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className={`font-black tabular-nums text-white ${large ? "text-4xl" : "text-xl"}`}>{rupees(product.price)}</span>
      {product.comparePrice && (
        <>
          <span className={`tabular-nums text-white/50 line-through ${large ? "text-lg" : "text-sm"}`}>{rupees(product.comparePrice)}</span>
          <span className="text-sm font-bold text-secondary">{off}% off</span>
        </>
      )}
    </div>
  );
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  // The cart lives in localStorage, which the server cannot see: start empty
  // on both sides and load it after mount, so hydration always matches.
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
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

  // Load the saved cart once, after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem('kkfi_cart');
        if (saved) setCart(JSON.parse(saved));
      } catch { /* a corrupt cart simply starts empty */ }
      setCartLoaded(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Persist cart to localStorage (only once the saved one has been read).
  useEffect(() => {
    if (!cartLoaded) return;
    localStorage.setItem('kkfi_cart', JSON.stringify(cart));
  }, [cart, cartLoaded]);

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
    if (!user) return;
    const id = requestAnimationFrame(() =>
      setShipping((s) => ({
        ...s,
        name: s.name || user.name || "",
        phone: s.phone || user.phone || "",
        city: s.city || user.city || "",
        state: s.state || user.state || "",
      })),
    );
    return () => cancelAnimationFrame(id);
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || "Failed to place order", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || "");
  };

  const cartButton = (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
      className="inline-flex min-h-12 items-center gap-3 rounded-none border border-white/25 px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      Cart
      <span className={`min-w-6 px-1.5 text-center tabular-nums ${cartCount > 0 ? "bg-primary text-white" : "bg-white/10 text-white/70"}`}>{cartCount}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black pb-24 text-white selection:bg-primary selection:text-white">
      {/* Opener */}
      <header data-bleed className="relative flex min-h-[58svh] overflow-hidden">
        <KankuMark className="pointer-events-none absolute -right-[10vw] top-1/2 h-[78vh] w-[78vh] -translate-y-1/2 text-white/[0.05]" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end gap-8 px-4 pb-[clamp(2.5rem,6vh,4rem)] pt-36 sm:px-6 md:flex-row md:items-end md:justify-between md:pt-44 lg:px-8">
          <div>
            <h1 className="text-balance text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em]">
              The KKFI store<span className="text-primary">.</span>
            </h1>
            <p className="mt-5 max-w-[46ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
              Official Kyokushin Karate Foundation of India gi, gear and apparel. Order online; we contact you for payment.
            </p>
          </div>
          <div className="shrink-0">{cartButton}</div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-5 border-y border-white/10 py-5 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Categories" className="-mx-1 flex overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const on = category === cat.key;
              return (
                <button
                  key={cat.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setCategory(cat.key)}
                  className={`min-h-11 whitespace-nowrap px-4 text-sm font-bold uppercase tracking-[0.1em] transition-colors ${on ? "text-white shadow-[inset_0_-2px_0_0_theme(colors.primary.DEFAULT)]" : "text-white/55 hover:text-white"}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          <div className="relative md:w-80">
            <label htmlFor="store-search" className="sr-only">Search products</label>
            <Search className="pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" aria-hidden="true" />
            <input
              id="store-search"
              type="search"
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${fieldClass} pl-7`}
            />
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <div className="aspect-[4/5] animate-pulse rounded-md bg-white/[0.04]" />
                <div className="mt-4 h-4 w-2/3 animate-pulse bg-white/[0.04]" />
                <div className="mt-2 h-5 w-1/4 animate-pulse bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24">
            <h2 className="text-2xl font-extrabold text-white">
              {search ? `Nothing matches “${search}”.` : "Nothing here yet."}
            </h2>
            <p className="mt-3 max-w-[48ch] text-white/70">
              {search ? "Try a shorter search, or another category." : "New gear is added from time to time. Check back soon, or ask your dojo."}
            </p>
          </div>
        ) : (
          <ul className={`mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 ${filtered.length >= 3 ? "lg:grid-cols-3" : "lg:max-w-5xl"}`}>
            {filtered.map((product, index) => {
              // The first featured product leads, set wider; the rest follow in the grid.
              const lead = index === 0 && product.featured && filtered.length > 2;
              return (
                <motion.li
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={lead ? "sm:col-span-2" : ""}
                >
                  <button type="button" onClick={() => openProduct(product)} className="group block w-full text-left focus-visible:outline-none">
                    <ProductImage product={product} className={`rounded-md ring-1 ring-white/10 transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-primary ${lead ? "aspect-[16/10]" : "aspect-[4/5]"}`} />
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/55">
                          {categoryLabel(product.category)}
                          {product.featured && <span className="ml-2 text-secondary">Featured</span>}
                        </p>
                        <h3 className={`mt-1 font-extrabold leading-snug text-white transition-colors group-hover:text-primary-light ${lead ? "text-2xl" : "text-lg"}`}>
                          {product.name}
                        </h3>
                        {product.sizes.length > 0 && (
                          <p className="mt-1.5 text-sm text-white/55">{product.sizes.join(" · ")}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <PriceLine product={product} />
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Overlays are portalled to <body>: inside <main> (z-[1]) they would sit under the navbar. */}
      <Portal>
      {/* Product detail */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center bg-black/85 p-0 sm:items-center sm:p-6"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-title"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative grid max-h-[92svh] w-full max-w-4xl overflow-y-auto border border-white/10 bg-surface md:grid-cols-2"
            >
              <ProductImage product={selectedProduct} className="aspect-[4/5] md:aspect-auto md:min-h-full" />
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center bg-black/70 text-white transition-colors hover:bg-black"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col p-6 sm:p-8">
                <p className="text-sm font-semibold text-white/55">{categoryLabel(selectedProduct.category)}</p>
                <h2 id="product-title" className="mt-2 text-balance text-3xl font-black uppercase leading-[1] tracking-[-0.02em] text-white">
                  {selectedProduct.name}
                </h2>
                <div className="mt-5">
                  <PriceLine product={selectedProduct} large />
                </div>
                {selectedProduct.description && (
                  <p className="mt-5 text-pretty leading-relaxed text-white/75">{selectedProduct.description}</p>
                )}

                {selectedProduct.sizes.length > 0 && (
                  <fieldset className="mt-7">
                    <legend className="mb-3 text-sm font-semibold text-white/80">Size</legend>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          aria-pressed={selectedSize === size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-h-12 min-w-12 rounded-none px-4 text-sm font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                            selectedSize === size
                              ? "bg-white text-black"
                              : "border border-white/20 text-white/80 hover:border-white/60 hover:text-white"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <p className={`mt-6 text-sm font-semibold ${selectedProduct.inStock ? "text-white/70" : "text-primary-light"}`}>
                  {selectedProduct.inStock ? "In stock" : "Out of stock"}
                </p>

                <button
                  type="button"
                  onClick={() => addToCart(selectedProduct, selectedSize || "One Size")}
                  disabled={!selectedProduct.inStock}
                  className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-none bg-primary text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/50 md:mt-auto"
                >
                  {selectedProduct.inStock ? (
                    <>
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      Add to cart
                    </>
                  ) : (
                    "Out of stock"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/80"
            onClick={() => setCartOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-surface"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <h2 id="cart-title" className="text-2xl font-black uppercase tracking-[-0.01em] text-white">
                  Cart <span className="tabular-nums text-white/50">{cartCount}</span>
                </h2>
                <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6" data-lenis-prevent>
                {cart.length === 0 ? (
                  <div className="py-16">
                    <p className="text-lg font-bold text-white">Your cart is empty.</p>
                    <p className="mt-2 text-white/65">Choose a product to add it here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {cart.map((item) => (
                      <li key={`${item.product.id}-${item.size}`} className="flex gap-4 py-5">
                        <ProductImage product={item.product} className="h-20 w-16 shrink-0 rounded-sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-white">{item.product.name}</h3>
                              <p className="text-sm text-white/60">Size {item.size}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id, item.size)}
                              aria-label={`Remove ${item.product.name}, size ${item.size}`}
                              className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-white/50 transition-colors hover:text-primary-light"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center border border-white/15">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.size, -1)}
                                aria-label="One fewer"
                                className="flex h-11 w-11 items-center justify-center text-white transition-colors hover:bg-white/10"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center font-bold tabular-nums text-white" aria-live="polite">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.size, 1)}
                                aria-label="One more"
                                className="flex h-11 w-11 items-center justify-center text-white transition-colors hover:bg-white/10"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-bold tabular-nums text-white">{rupees(item.product.price * item.quantity)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {cart.length > 0 && (
                <div className="space-y-5 border-t border-white/10 px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-white/70">Total</span>
                    <span className="text-3xl font-black tabular-nums text-white">{rupees(cartTotal)}</span>
                  </div>

                  {!showShipping ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast("Please login to place an order", "error");
                          return;
                        }
                        setShowShipping(true);
                      }}
                      className="inline-flex min-h-14 w-full items-center justify-center rounded-none bg-primary text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      Proceed to checkout
                    </button>
                  ) : (
                    <div className="space-y-5">
                      <p className="text-sm font-semibold text-white/80">Shipping details</p>
                      <div>
                        <label htmlFor="ship-name" className="mb-1 block text-sm text-white/65">Full name</label>
                        <input id="ship-name" type="text" autoComplete="name" placeholder="Full name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="ship-phone" className="mb-1 block text-sm text-white/65">Phone (10 digits)</label>
                        <input id="ship-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="9876543210" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="ship-address" className="mb-1 block text-sm text-white/65">Full address</label>
                        <textarea id="ship-address" autoComplete="street-address" placeholder="House, street, area" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} rows={2} className={`${fieldClass} resize-none py-2`} />
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div>
                          <label htmlFor="ship-city" className="mb-1 block text-sm text-white/65">City</label>
                          <input id="ship-city" type="text" autoComplete="address-level2" placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="ship-state" className="mb-1 block text-sm text-white/65">State</label>
                          <input id="ship-state" type="text" autoComplete="address-level1" placeholder="State" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="ship-pincode" className="mb-1 block text-sm text-white/65">PIN code</label>
                          <input id="ship-pincode" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="6 digits" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} className={fieldClass} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckout}
                        disabled={checkingOut}
                        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-none bg-primary text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60"
                      >
                        {checkingOut ? (
                          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Placing order</>
                        ) : (
                          `Place order · ${rupees(cartTotal)}`
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowShipping(false)}
                        className="min-h-11 w-full text-center text-sm font-semibold text-white/65 transition-colors hover:text-white"
                      >
                        Back to cart
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </div>
  );
}
