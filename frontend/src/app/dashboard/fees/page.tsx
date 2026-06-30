"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { renderFeePreview, DEFAULT_FEE_REMINDER_TEMPLATE } from "@/lib/feePreview";

type FeeStatus = "UNPAID" | "PARTIAL" | "PAID" | "WAIVED";

interface RosterRow {
  userId: string;
  name: string;
  membershipNumber?: string | null;
  currentBeltRank?: string | null;
  status: FeeStatus;
  amountPaid: number;
  method: string;
  notes: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function InstructorFeesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<{
    totals: { expected: number; collected: number; outstanding: number };
    rows: { userId: string; expected: number; paid: number; outstanding: number }[];
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ledgerByUser, setLedgerByUser] = useState<Record<string, {
    months: { month: number; expected: number; paid: number; status: string }[];
  }>>({});
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const [message, setMessage] = useState("");
  const [feeInput, setFeeInput] = useState<string>("");
  const [dueDayInput, setDueDayInput] = useState<string>("10");
  const [templateInput, setTemplateInput] = useState<string>(DEFAULT_FEE_REMINDER_TEMPLATE);
  const [savingSettings, setSavingSettings] = useState(false);

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
    setLedgerByUser({});
    setExpandedId(null);
    try {
      const feeRes = await api.get(`/fees/dojo/${dojoId}`, { params: { month, year } });
      const d = feeRes.data.data;
      setMonthlyFee(d.monthlyFee);
      setFeeInput(d.monthlyFee != null ? String(d.monthlyFee) : "");
      setDueDayInput(d.feeDueDay != null ? String(d.feeDueDay) : "10");
      setTemplateInput(d.feeReminderTemplate || DEFAULT_FEE_REMINDER_TEMPLATE);
      const merged: RosterRow[] = d.roster.map((r: any) => ({
        userId: r.student.id,
        name: r.student.name,
        membershipNumber: r.student.membershipNumber,
        currentBeltRank: r.student.currentBeltRank,
        status: (r.fee?.status ?? "UNPAID") as FeeStatus,
        amountPaid: r.fee?.amountPaid ?? 0,
        method: r.fee?.method ?? "",
        notes: r.fee?.notes ?? "",
      }));
      setRows(merged);
      try {
        const summaryRes = await api.get(`/fees/summary/dojo/${dojoId}`, { params: { year } });
        setSummary(summaryRes.data.data);
      } catch { /* non-critical; the totals banner just won't render */ }
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

  const toggleExpand = async (userId: string) => {
    if (expandedId === userId) { setExpandedId(null); return; }
    setExpandedId(userId);
    if (!ledgerByUser[userId]) {
      try {
        const res = await api.get(`/fees/ledger/${userId}`, { params: { year } });
        setLedgerByUser((m) => ({ ...m, [userId]: res.data.data.ledger }));
      } catch { /* ignore; cell just won't expand */ }
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

  const saveSettings = async () => {
    if (!dojoId) return;
    setSavingSettings(true);
    setMessage("");
    try {
      await api.patch(`/fees/dojo-settings`, {
        dojoId,
        monthlyFee: feeInput === "" ? null : Number(feeInput),
        feeDueDay: Number(dueDayInput),
        feeReminderTemplate: templateInput,
      });
      setMessage("Dojo fee settings saved");
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Monthly Fees</h1>
        <p className="text-gray-400 mb-4">
          {monthlyFee != null ? `Monthly fee: ₹${monthlyFee}` : "No monthly fee set for this dojo yet."}
        </p>

        <details className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <summary className="cursor-pointer font-semibold">Dojo fee settings</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Monthly fee (₹)
              <input type="number" min={0} value={feeInput} onChange={(e) => setFeeInput(e.target.value)}
                className="mt-1 w-full bg-black border border-gray-700 rounded px-2 py-1" />
            </label>
            <label className="text-sm">Fee due day (1-28)
              <input type="number" min={1} max={28} value={dueDayInput} onChange={(e) => setDueDayInput(e.target.value)}
                className="mt-1 w-full bg-black border border-gray-700 rounded px-2 py-1" />
            </label>
          </div>
          <label className="mt-3 block text-sm">Reminder template
            <textarea value={templateInput} onChange={(e) => setTemplateInput(e.target.value)} rows={3}
              className="mt-1 w-full bg-black border border-gray-700 rounded px-2 py-1" />
          </label>
          <p className="mt-1 text-xs text-gray-500">Merge fields: {"{name} {amount} {month} {year} {dojoName} {dueDate}"}</p>
          <div className="mt-2 rounded bg-black border border-gray-800 p-3 text-sm text-gray-300">
            <div className="text-xs text-gray-500 mb-1">Preview</div>
            {renderFeePreview(templateInput, {
              name: "Riku", amount: feeInput || "800", month: MONTHS[month - 1], year,
              dojoName: user?.dojo?.name || "your dojo", dueDate: `${dueDayInput} ${MONTHS[month - 1]} ${year}`,
            })}
          </div>
          <button onClick={saveSettings} disabled={savingSettings}
            className="mt-3 bg-red-600 hover:bg-red-700 rounded px-4 py-2 disabled:opacity-50">
            {savingSettings ? "Saving…" : "Save settings"}
          </button>
        </details>

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

        {summary && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-xs text-gray-500">Expected ({year})</div>
              <div className="text-xl font-bold">₹{summary.totals.expected}</div>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.05] p-4">
              <div className="text-xs text-gray-500">Collected</div>
              <div className="text-xl font-bold text-green-400">₹{summary.totals.collected}</div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
              <div className="text-xs text-gray-500">Outstanding</div>
              <div className="text-xl font-bold text-red-400">₹{summary.totals.outstanding}</div>
            </div>
          </div>
        )}

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
                  <th className="py-2 pr-3">Fee status</th>
                  <th className="py-2 pr-3">Amount paid</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Outstanding (yr)</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const summaryRow = summary?.rows.find((s) => s.userId === r.userId);
                  const led = ledgerByUser[r.userId];
                  return (
                    <Fragment key={r.userId}>
                      <tr className="border-t border-gray-800">
                        <td className="py-2 pr-3">
                          <button onClick={() => toggleExpand(r.userId)} className="text-left hover:text-red-400">
                            <div>{r.name}</div>
                            <div className="text-xs text-gray-500">{r.membershipNumber || r.currentBeltRank || ""}</div>
                          </button>
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
                        <td className="py-2 pr-3 text-red-400 font-medium">
                          {summaryRow ? `₹${summaryRow.outstanding}` : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <button onClick={() => saveRow(r)} disabled={savingId === r.userId}
                            className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-1 disabled:opacity-50">
                            {savingId === r.userId ? "…" : "Save"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === r.userId && (
                        <tr className="border-t border-gray-900 bg-white/[0.01]">
                          <td colSpan={6} className="py-3 px-3">
                            {!led ? (
                              <span className="text-xs text-gray-500">Loading ledger…</span>
                            ) : (
                              <div className="grid grid-cols-6 gap-2">
                                {led.months.map((m) => (
                                  <div key={m.month} className="rounded border border-white/[0.06] p-2 text-center text-xs">
                                    <div className="font-semibold text-gray-300">{MONTHS_SHORT[m.month - 1]}</div>
                                    <div className="mt-1 text-gray-400">
                                      {m.status === "NOT_DUE" ? "—" : `₹${m.paid}/${m.expected}`}
                                    </div>
                                    <div className="text-[10px] text-gray-500">{m.status === "NOT_DUE" ? "" : m.status}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
