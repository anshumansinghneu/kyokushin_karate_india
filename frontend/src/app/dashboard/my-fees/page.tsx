"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Fee {
  id: string;
  month: number;
  year: number;
  amount: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED";
  amountPaid: number;
  paidAt: string | null;
  method: string | null;
}

const STATUS_STYLE: Record<Fee["status"], string> = {
  PAID: "text-green-400",
  PARTIAL: "text-amber-400",
  UNPAID: "text-red-400",
  WAIVED: "text-gray-400",
};

export default function MyFeesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) checkAuth(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (!isLoading && !isAuthenticated) router.push("/login"); }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/fees/me");
        setFees(res.data.data.fees);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Fees</h1>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : fees.length === 0 ? (
          <p className="text-gray-500">No fee records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-left">
                <tr>
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Paid on</th>
                  <th className="py-2 pr-3">Method</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id} className="border-t border-gray-800">
                    <td className="py-2 pr-3">{MONTHS[f.month - 1]} {f.year}</td>
                    <td className="py-2 pr-3">₹{f.amount}{f.status === "PARTIAL" ? ` (paid ₹${f.amountPaid})` : ""}</td>
                    <td className={`py-2 pr-3 font-medium ${STATUS_STYLE[f.status]}`}>{f.status}</td>
                    <td className="py-2 pr-3">{f.paidAt ? new Date(f.paidAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="py-2 pr-3">{f.method || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
