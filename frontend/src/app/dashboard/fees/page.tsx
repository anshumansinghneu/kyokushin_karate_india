"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

type FeeStatus = "UNPAID" | "PARTIAL" | "PAID" | "WAIVED";

interface RosterRow {
  userId: string;
  name: string;
  membershipNumber?: string | null;
  currentBeltRank?: string | null;
  status: FeeStatus;
  amountPaid: number;
  method: string;
  classesAttended: number;
  notes: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function InstructorFeesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const [message, setMessage] = useState("");

  const dojoId = user?.dojoId;

  useEffect(() => { if (!user) checkAuth(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (user && user.role !== "INSTRUCTOR" && user.role !== "ADMIN") router.push("/dashboard");
  }, [isLoading, isAuthenticated, user, router]);

  const load = useCallback(async () => {
    if (!dojoId) return;
    setLoading(true);
    setMessage("");
    try {
      const [feeRes, attRes] = await Promise.all([
        api.get(`/fees/dojo/${dojoId}`, { params: { month, year } }),
        api.get(`/attendance/dojo/${dojoId}`, { params: { month, year } }),
      ]);
      setMonthlyFee(feeRes.data.data.monthlyFee);
      const attByUser = new Map<string, number>(
        attRes.data.data.roster.map((r: any) => [r.student.id, r.attendance?.classesAttended ?? 0])
      );
      const merged: RosterRow[] = feeRes.data.data.roster.map((r: any) => ({
        userId: r.student.id,
        name: r.student.name,
        membershipNumber: r.student.membershipNumber,
        currentBeltRank: r.student.currentBeltRank,
        status: (r.fee?.status ?? "UNPAID") as FeeStatus,
        amountPaid: r.fee?.amountPaid ?? 0,
        method: r.fee?.method ?? "",
        classesAttended: attByUser.get(r.student.id) ?? 0,
        notes: r.fee?.notes ?? "",
      }));
      setRows(merged);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [dojoId, month, year]);

  useEffect(() => { load(); }, [load]);

  const update = (userId: string, patch: Partial<RosterRow>) =>
    setRows((rs) => rs.map((r) => (r.userId === userId ? { ...r, ...patch } : r)));

  const saveRow = async (row: RosterRow) => {
    if (!dojoId) return;
    setSavingId(row.userId);
    setMessage("");
    try {
      await api.post("/attendance/mark", {
        dojoId, month, year,
        entries: [{ userId: row.userId, classesAttended: row.classesAttended, notes: row.notes }],
      });
      await api.post("/fees/mark", {
        userId: row.userId, dojoId, month, year,
        status: row.status,
        amountPaid: row.status === "PARTIAL" ? row.amountPaid : undefined,
        method: row.method || undefined,
        notes: row.notes || undefined,
      });
      setMessage(`Saved ${row.name}`);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || `Failed to save ${row.name}`);
    } finally {
      setSavingId(null);
    }
  };

  const sendReminders = async () => {
    if (!dojoId) return;
    setReminding(true);
    setMessage("");
    try {
      const res = await api.post("/fees/remind", { dojoId, month, year });
      const { sent, skipped, errors } = res.data.data;
      setMessage(`Reminders: ${sent} sent, ${skipped} skipped, ${errors} errors`);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to send reminders");
    } finally {
      setReminding(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Attendance &amp; Fees</h1>
        <p className="text-gray-400 mb-4">
          {monthlyFee != null ? `Monthly fee: ₹${monthlyFee}` : "No monthly fee set for this dojo yet."}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-28" />
          <button onClick={sendReminders} disabled={reminding} className="ml-auto bg-red-600 hover:bg-red-700 rounded px-4 py-2 disabled:opacity-50">
            {reminding ? "Sending…" : "Send reminders to all unpaid"}
          </button>
        </div>

        {message && <p className="mb-3 text-sm text-amber-400">{message}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="text-gray-500">No students found for this dojo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-left">
                <tr>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Classes</th>
                  <th className="py-2 pr-3">Fee status</th>
                  <th className="py-2 pr-3">Amount paid</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className="border-t border-gray-800">
                    <td className="py-2 pr-3">
                      <div>{r.name}</div>
                      <div className="text-xs text-gray-500">{r.membershipNumber || r.currentBeltRank || ""}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min={0} value={r.classesAttended}
                        onChange={(e) => update(r.userId, { classesAttended: Number(e.target.value) })}
                        className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1" />
                    </td>
                    <td className="py-2 pr-3">
                      <select value={r.status} onChange={(e) => update(r.userId, { status: e.target.value as FeeStatus })}
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1">
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PAID">Paid</option>
                        <option value="WAIVED">Waived</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min={0} value={r.amountPaid} disabled={r.status !== "PARTIAL"}
                        onChange={(e) => update(r.userId, { amountPaid: Number(e.target.value) })}
                        className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 disabled:opacity-40" />
                    </td>
                    <td className="py-2 pr-3">
                      <input value={r.method} placeholder="CASH / UPI"
                        onChange={(e) => update(r.userId, { method: e.target.value })}
                        className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1" />
                    </td>
                    <td className="py-2 pr-3">
                      <button onClick={() => saveRow(r)} disabled={savingId === r.userId}
                        className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-1 disabled:opacity-50">
                        {savingId === r.userId ? "…" : "Save"}
                      </button>
                    </td>
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
