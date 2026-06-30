"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type LedgerStatus = "UNPAID" | "PARTIAL" | "PAID" | "WAIVED" | "NOT_DUE";

interface LedgerMonth { month: number; expected: number; paid: number; status: LedgerStatus; }
interface Ledger {
  months: LedgerMonth[];
  totals: { totalExpected: number; totalPaid: number; totalOutstanding: number };
}

interface Fee {
  id: string; month: number; year: number; amount: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED"; amountPaid: number;
  paidAt: string | null; method: string | null;
}

const STATUS_STYLE: Record<Fee["status"], string> = {
  PAID: "text-green-400",
  PARTIAL: "text-amber-400",
  UNPAID: "text-red-400",
  WAIVED: "text-gray-400",
};

const CELL_STYLE: Record<LedgerStatus, string> = {
  PAID: "bg-green-500/20 border-green-500/40 text-green-300",
  PARTIAL: "bg-amber-500/20 border-amber-500/40 text-amber-300",
  UNPAID: "bg-red-500/20 border-red-500/40 text-red-300",
  WAIVED: "bg-gray-600/20 border-gray-600/40 text-gray-400",
  NOT_DUE: "bg-white/[0.02] border-white/[0.06] text-gray-600",
};

export default function MyFeesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [fees, setFees] = useState<Fee[]>([]);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) checkAuth(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (!isLoading && !isAuthenticated) router.push("/login"); }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [feeRes, ledgerRes] = await Promise.all([
          api.get("/fees/me"),
          api.get(`/fees/ledger/${user.id}`, { params: { year } }),
        ]);
        setFees(feeRes.data.data.fees);
        setLedger(ledgerRes.data.data.ledger);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, year]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">My Fees</h1>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-28"
          />
        </div>

        {ledger && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-gray-500">Expected ({year})</div>
                <div className="text-xl font-bold">₹{ledger.totals.totalExpected}</div>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/[0.05] p-4">
                <div className="text-xs text-gray-500">Paid</div>
                <div className="text-xl font-bold text-green-400">₹{ledger.totals.totalPaid}</div>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
                <div className="text-xs text-gray-500">Outstanding</div>
                <div className="text-xl font-bold text-red-400">₹{ledger.totals.totalOutstanding}</div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-6">
              {ledger.months.map((m) => (
                <div key={m.month} className={`rounded-lg border p-2 text-center text-xs ${CELL_STYLE[m.status]}`}>
                  <div className="font-semibold">{MONTHS[m.month - 1]}</div>
                  <div className="mt-1">{m.status === "NOT_DUE" ? "—" : `₹${m.paid}/${m.expected}`}</div>
                </div>
              ))}
            </div>
          </>
        )}

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
                    <td className="py-2 pr-3">{FULL_MONTHS[f.month - 1]} {f.year}</td>
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
