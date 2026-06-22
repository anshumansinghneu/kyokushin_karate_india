"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { nextStatus, daysInMonth, countPresent, AttendanceStatus } from "@/lib/attendanceGrid";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Row {
  userId: string;
  name: string;
  membershipNumber?: string | null;
  days: Record<string, AttendanceStatus>;
}

export default function AttendancePage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const dojoId = user?.dojoId;
  const dayList = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

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
      const res = await api.get(`/attendance/dojo/${dojoId}`, { params: { month, year } });
      const next: Row[] = res.data.data.roster.map((r: any) => ({
        userId: r.student.id,
        name: r.student.name,
        membershipNumber: r.student.membershipNumber,
        days: r.days ?? {},
      }));
      setRows(next);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [dojoId, month, year]);

  useEffect(() => { load(); }, [load]);

  const toggleCell = async (row: Row, day: number) => {
    if (!dojoId) return;
    const key = String(day);
    const current = row.days[key] ?? null;
    const next = nextStatus(current);
    const prevDays = row.days;

    // optimistic update
    setRows((rs) => rs.map((r) => {
      if (r.userId !== row.userId) return r;
      const days = { ...r.days };
      if (next === null) delete days[key];
      else days[key] = next;
      return { ...r, days };
    }));

    try {
      await api.post("/attendance/mark", { userId: row.userId, dojoId, year, month, day, status: next });
    } catch (e: any) {
      // revert on failure
      setRows((rs) => rs.map((r) => (r.userId === row.userId ? { ...r, days: prevDays } : r)));
      setMessage(e?.response?.data?.message || `Failed to save ${row.name}`);
    }
  };

  const cellLabel = (status: AttendanceStatus | undefined) =>
    status === "PRESENT" ? "P" : status === "ABSENT" ? "A" : "·";
  const cellClass = (status: AttendanceStatus | undefined) =>
    status === "PRESENT"
      ? "text-green-400 hover:bg-green-500/10"
      : status === "ABSENT"
      ? "text-red-400 hover:bg-red-500/10"
      : "text-gray-700 hover:bg-white/5";

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-full">
        <h1 className="text-2xl font-bold mb-2">Attendance</h1>
        <p className="text-gray-400 mb-4">Click a cell to cycle Present → Absent → clear. Changes save automatically.</p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-28" />
        </div>

        {message && <p className="mb-3 text-sm text-amber-400">{message}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="text-gray-500">No students found for this dojo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead className="text-gray-400">
                <tr>
                  <th className="sticky left-0 bg-black py-2 pr-3 text-left">Student</th>
                  {dayList.map((d) => <th key={d} className="px-1 py-2 w-7 text-center font-medium">{d}</th>)}
                  <th className="px-2 py-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className="border-t border-gray-800">
                    <td className="sticky left-0 bg-black py-2 pr-3 whitespace-nowrap">
                      <div>{r.name}</div>
                      <div className="text-xs text-gray-500">{r.membershipNumber || ""}</div>
                    </td>
                    {dayList.map((d) => {
                      const status = r.days[String(d)];
                      return (
                        <td key={d} className="p-0 text-center border border-gray-900">
                          <button
                            onClick={() => toggleCell(r, d)}
                            className={`w-7 h-8 font-bold ${cellClass(status)}`}
                            title={`Day ${d}`}
                          >
                            {cellLabel(status)}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center font-semibold">{countPresent(r.days)}</td>
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
