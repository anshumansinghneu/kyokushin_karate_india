"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package, ShoppingBag, Plus, Edit2, Trash2, Loader2, Search,
    CheckCircle, Clock, Truck, MapPin, XCircle, ChevronDown, ChevronUp,
    Save, X, ImagePlus, Tag, Ruler, IndianRupee, Info, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

// ============ STATUS CONFIG ============
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    PENDING: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock },
    CONFIRMED: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: CheckCircle },
    PROCESSING: { label: "Processing", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Package },
    READY_FOR_PICKUP: { label: "Ready for Pickup", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: MapPin },
    SHIPPED: { label: "Shipped", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: Truck },
    DELIVERED: { label: "Delivered", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle },
    COMPLETED: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle },
    CANCELLED: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle },
};

const STATUS_FLOW: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["READY_FOR_PICKUP", "SHIPPED", "CANCELLED"],
    READY_FOR_PICKUP: ["SHIPPED", "DELIVERED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
};

// ============ MAIN COMPONENT ============
export default function StoreManagement() {
    const [subTab, setSubTab] = useState<"orders" | "products">("orders");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center shadow-lg shadow-pink-900/30">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        Store Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1.5 ml-[52px]">Manage orders and products</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSubTab("orders")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${subTab === "orders" ? "bg-white/10 text-white border-white/20 shadow-sm" : "bg-transparent text-gray-500 border-white/[0.06] hover:text-white hover:bg-white/[0.04]"}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Orders
                    </button>
                    <button
                        onClick={() => setSubTab("products")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${subTab === "products" ? "bg-white/10 text-white border-white/20 shadow-sm" : "bg-transparent text-gray-500 border-white/[0.06] hover:text-white hover:bg-white/[0.04]"}`}
                    >
                        <Package className="w-4 h-4" /> Products
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {subTab === "orders" ? (
                    <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <OrderManagement />
                    </motion.div>
                ) : (
                    <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <ProductManagement />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============ ORDER MANAGEMENT ============
function OrderManagement() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get("/merch/orders");
            setOrders(res.data.data.orders);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        setUpdating(orderId);
        try {
            await api.patch(`/merch/orders/${orderId}/status`, { status });
            showToast(`Order updated to ${STATUS_CONFIG[status]?.label || status}`, "success");
            fetchOrders();
        } catch (err: any) {
            console.error("Status update failed:", err.response?.data || err);
            showToast(err.response?.data?.message || "Failed to update order", "error");
        } finally {
            setUpdating(null);
        }
    };

    const filtered = orders.filter((o) => {
        if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                o.id.toLowerCase().includes(q) ||
                o.user?.name?.toLowerCase().includes(q) ||
                o.user?.email?.toLowerCase().includes(q) ||
                o.shippingPhone?.includes(q)
            );
        }
        return true;
    });

    const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${statusFilter === "ALL" ? "bg-white/10 text-white border-white/20 shadow-sm" : "bg-transparent text-gray-500 border-white/[0.06] hover:text-white"}`}
                >
                    All ({orders.length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    statusCounts[key] ? (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${statusFilter === key ? `bg-white/10 text-white border-white/20 shadow-sm` : "bg-transparent text-gray-500 border-white/[0.06] hover:text-white"}`}
                        >
                            {cfg.label} ({statusCounts[key]})
                        </button>
                    ) : null
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by order ID, name, email or phone..."
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/30 focus:bg-white/[0.05] transition-all"
                />
            </div>

            {/* Orders List */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No orders found</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((order) => {
                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                        const Icon = cfg.icon;
                        const isExpanded = expandedId === order.id;
                        const nextStatuses = STATUS_FLOW[order.status] || [];

                        return (
                            <div key={order.id} className="border border-white/[0.06] bg-white/[0.01] rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${cfg.bg} ${cfg.border} border`}>
                                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-white">#{order.id.slice(-8).toUpperCase()}</p>
                                            <p className="text-xs text-gray-500">{order.user?.name} · {order.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border hidden sm:inline-block`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-lg font-black text-white">₹{order.totalAmount}</span>
                                        <span className="text-xs text-gray-500 hidden md:block">
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                        </span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-white/10 p-5 space-y-4">
                                        {/* Items */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</p>
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{item.product?.name}</p>
                                                        <p className="text-xs text-gray-500">{item.size && `Size: ${item.size} · `}Qty: {item.quantity}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-white">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Shipping Info */}
                                        {order.shippingAddress && (
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipping</p>
                                                <p className="text-sm text-white">{order.shippingName} · {order.shippingPhone}</p>
                                                <p className="text-xs text-gray-400">{order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
                                            </div>
                                        )}

                                        {/* Payment */}
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            {order.razorpayPaymentId && <span>Payment ID: {order.razorpayPaymentId}</span>}
                                            {order.razorpayOrderId && <span>Order Ref: {order.razorpayOrderId}</span>}
                                        </div>

                                        {/* Status Actions */}
                                        {nextStatuses.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center mr-2">Update:</span>
                                                {nextStatuses.map((ns) => {
                                                    const nsCfg = STATUS_CONFIG[ns];
                                                    const isCancelling = ns === "CANCELLED";
                                                    return (
                                                        <Button
                                                            key={ns}
                                                            onClick={() => updateStatus(order.id, ns)}
                                                            disabled={updating === order.id}
                                                            className={`text-xs ${isCancelling ? "bg-red-950/50 text-red-400 border-red-500/20 hover:bg-red-900/50" : `${nsCfg.bg} ${nsCfg.color} ${nsCfg.border}`} border`}
                                                            size="sm"
                                                        >
                                                            {updating === order.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                                            {nsCfg.label}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============ PRODUCT MANAGEMENT ============
function ProductManagement() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null); // null = list view, {} = new, {id:...} = editing
    const [saving, setSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const { showToast } = useToast();

    // Form state
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        comparePrice: "",
        category: "APPAREL",
        sizes: "S,M,L,XL",
        stockCount: "10",
        featured: false,
        images: "",
    });

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get("/merch/products");
            setProducts(res.data.data.products);
        } catch { } finally {
            setLoading(false);
        }
    };

    const openEditor = (product?: any) => {
        if (product) {
            setForm({
                name: product.name,
                description: product.description || "",
                price: String(product.price),
                comparePrice: product.comparePrice ? String(product.comparePrice) : "",
                category: product.category,
                sizes: product.sizes?.join(",") || "",
                stockCount: String(product.stockCount),
                featured: product.featured,
                images: product.images?.join(",") || "",
            });
            setEditing(product);
        } else {
            setForm({ name: "", description: "", price: "", comparePrice: "", category: "APPAREL", sizes: "S,M,L,XL", stockCount: "10", featured: false, images: "" });
            setEditing({});
        }
    };

    const saveProduct = async () => {
        if (!form.name || !form.price) {
            showToast("Name and price are required", "error");
            return;
        }
        setSaving(true);
        const body = {
            name: form.name,
            description: form.description,
            price: parseFloat(form.price) || 0,
            comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
            category: form.category,
            sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
            stockCount: parseInt(form.stockCount) || 0,
            featured: form.featured,
            images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
            inStock: (parseInt(form.stockCount) || 0) > 0,
        };

        try {
            if (editing?.id) {
                await api.patch(`/merch/products/${editing.id}`, body);
                showToast("Product updated", "success");
            } else {
                await api.post("/merch/products", body);
                showToast("Product created", "success");
            }
            setEditing(null);
            fetchProducts();
        } catch (err) {
            showToast("Failed to save product", "error");
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = async (id: string) => {
        setDeleteConfirmId(null);
        setDeleting(id);
        try {
            await api.delete(`/merch/products/${id}`);
            showToast("Product deleted", "success");
            fetchProducts();
        } catch {
            showToast("Failed to delete product", "error");
        } finally {
            setDeleting(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>;

    // ===== EDITOR VIEW =====
    if (editing !== null) {
        return (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                    <div>
                        <h2 className="text-lg font-bold text-white">{editing.id ? "Edit Product" : "New Product"}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{editing.id ? 'Update product details' : 'Add a new product to the store'}</p>
                    </div>
                    <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Info className="w-3.5 h-3.5" /> Product Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Name <span className="text-red-400">*</span></label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                    placeholder="Product name"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="APPAREL" className="bg-zinc-900">Apparel</option>
                                    <option value="EQUIPMENT" className="bg-zinc-900">Equipment</option>
                                    <option value="ACCESSORIES" className="bg-zinc-900">Accessories</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-300 mb-1.5 block">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all resize-none"
                                placeholder="Product description"
                            />
                        </div>
                    </div>

                    {/* Section: Pricing */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <IndianRupee className="w-3.5 h-3.5" /> Pricing & Stock
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Price (₹) <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                        placeholder="999"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Compare Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                    <input
                                        type="number"
                                        value={form.comparePrice}
                                        onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                        placeholder="1299"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-600 mt-1">Shown as strikethrough</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Stock Count</label>
                                <input
                                    type="number"
                                    value={form.stockCount}
                                    onChange={(e) => setForm({ ...form, stockCount: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                    placeholder="10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Sizes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Ruler className="w-3.5 h-3.5" /> Available Sizes
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => {
                                const selected = form.sizes.split(',').map(s => s.trim()).filter(Boolean).includes(size);
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => {
                                            const current = form.sizes.split(',').map(s => s.trim()).filter(Boolean);
                                            const updated = selected ? current.filter(s => s !== size) : [...current, size];
                                            setForm({ ...form, sizes: updated.join(',') });
                                        }}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                            selected
                                                ? 'bg-pink-500/15 text-pink-400 border-pink-500/50 ring-1 ring-pink-500/20'
                                                : 'bg-white/[0.03] text-gray-500 border-white/10 hover:bg-white/[0.06] hover:text-white'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section: Images */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <ImagePlus className="w-3.5 h-3.5" /> Product Images
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {form.images.split(',').map(s => s.trim()).filter(Boolean).map((url, idx) => (
                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10">
                                    <img src={url} alt={`Product ${idx + 1}`} className="h-20 w-20 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = form.images.split(',').map(s => s.trim()).filter(Boolean);
                                            current.splice(idx, 1);
                                            setForm({ ...form, images: current.join(',') });
                                        }}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            ))}
                            <label className="cursor-pointer h-20 w-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 transition-all">
                                <ImagePlus className="w-5 h-5 text-gray-600" />
                                <span className="text-[10px] text-gray-600">Upload</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const uploadData = new FormData();
                                        uploadData.append('image', file);
                                        try {
                                            const res = await api.post('/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                            const url = res.data.data.url;
                                            const current = form.images.split(',').map(s => s.trim()).filter(Boolean);
                                            setForm({ ...form, images: [...current, url].join(',') });
                                            showToast('Image uploaded!', 'success');
                                        } catch { showToast('Upload failed', 'error'); }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Featured toggle */}
                    <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                        <input
                            type="checkbox"
                            id="featured"
                            checked={form.featured}
                            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-pink-600 focus:ring-pink-500"
                        />
                        <label htmlFor="featured" className="text-sm text-gray-300 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-yellow-500" /> Mark as featured product
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={saveProduct}
                        disabled={saving}
                        className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-600/50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {editing.id ? "Update Product" : "Create Product"}
                    </button>
                </div>
            </div>
        );
    }

    // ===== LIST VIEW =====
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{products.length} product{products.length !== 1 ? "s" : ""}</p>
                <Button onClick={() => openEditor()} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Product
                </Button>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p>No products yet. Add your first product.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                        <div key={p.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-colors">
                            {/* Image */}
                            <div className="h-40 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center overflow-hidden">
                                {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                    <ImagePlus className="w-10 h-10 text-gray-600" />
                                )}
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{p.name}</h3>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{p.category}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">₹{p.price}</p>
                                        {p.comparePrice && <p className="text-[10px] text-gray-500 line-through">₹{p.comparePrice}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Stock: {p.stockCount}</span>
                                    <span>{p.featured ? "⭐ Featured" : ""}</span>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={() => openEditor(p)} className="flex-1 bg-white/5 text-gray-400 border border-white/10 hover:text-white" size="sm">
                                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        onClick={() => setDeleteConfirmId(p.id)}
                                        disabled={deleting === p.id}
                                        className="bg-red-950/50 text-red-400 border border-red-500/20 hover:bg-red-900/50"
                                        size="sm"
                                    >
                                        {deleting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
