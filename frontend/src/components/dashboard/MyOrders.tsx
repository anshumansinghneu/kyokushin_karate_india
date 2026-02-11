"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck, MapPin, XCircle, ChevronDown, ChevronUp, ShoppingBag, Loader2 } from "lucide-react";
import api from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    PENDING: { label: "Payment Pending", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock },
    CONFIRMED: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: CheckCircle },
    PROCESSING: { label: "Processing", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Package },
    READY_FOR_PICKUP: { label: "Ready for Pickup", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: MapPin },
    SHIPPED: { label: "Shipped", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: Truck },
    DELIVERED: { label: "Delivered", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle },
    CANCELLED: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle },
};

const STEPS = ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED"];

export default function MyOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get("/merch/orders/mine");
            setOrders(res.data.data.orders);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Orders Yet</h3>
                <p className="text-gray-500">Your merchandise orders will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-1 bg-red-600 rounded-full" />
                <h2 className="text-xl font-bold text-white">My Orders</h2>
                <span className="ml-auto text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
            </div>

            {orders.map((order, idx) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                const isExpanded = expandedId === order.id;
                const currentStep = STEPS.indexOf(order.status);

                return (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${cfg.bg} ${cfg.border} border`}>
                                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">
                                        Order #{order.id.slice(-8).toUpperCase()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                                    {cfg.label}
                                </span>
                                <span className="text-lg font-black text-white">₹{order.totalAmount}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="border-t border-white/10 p-5 space-y-5"
                            >
                                {/* Progress Tracker */}
                                {order.status !== "PENDING" && order.status !== "CANCELLED" && (
                                    <div className="flex items-center gap-1">
                                        {STEPS.map((step, i) => {
                                            const stepCfg = STATUS_CONFIG[step];
                                            const isActive = i <= currentStep;
                                            return (
                                                <div key={step} className="flex-1 flex items-center gap-1">
                                                    <div className={`w-full h-1.5 rounded-full transition-colors ${isActive ? "bg-red-600" : "bg-white/10"}`} />
                                                    {i === STEPS.length - 1 && (
                                                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-green-400" : "text-gray-600"}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {order.status !== "PENDING" && order.status !== "CANCELLED" && (
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                        {STEPS.map((step, i) => (
                                            <span key={step} className={i <= currentStep ? "text-red-400" : ""}>
                                                {STATUS_CONFIG[step].label}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Items */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</p>
                                    {order.items.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                                            <div className="flex items-center gap-3">
                                                {item.product?.images?.[0] ? (
                                                    <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-white">{item.product?.name || "Product"}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.size && `Size: ${item.size} · `}Qty: {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-white">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Shipping & Payment */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {order.shippingAddress && (
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipping Address</p>
                                            <p className="text-sm text-white">{order.shippingName}</p>
                                            <p className="text-xs text-gray-400">{order.shippingPhone}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
                                            </p>
                                        </div>
                                    )}
                                    {order.razorpayPaymentId && (
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Info</p>
                                            <p className="text-sm text-white">Payment ID: {order.razorpayPaymentId}</p>
                                            <p className="text-xs text-gray-400">Total: ₹{order.totalAmount}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
