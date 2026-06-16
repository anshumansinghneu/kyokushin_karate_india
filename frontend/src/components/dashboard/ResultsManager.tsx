"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Plus, Trash2, Pencil, Upload, Loader2, X, QrCode, Eye, EyeOff, Download, Link as LinkIcon } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { buildResultUrl } from "@/lib/resultLinks";

interface ExamResult {
  id: string;
  title: string;
  testDate: string | null;
  awardedDate: string | null;
  location: string | null;
  pdfUrl: string;
  isPublished: boolean;
}

const emptyForm = { id: "", title: "", testDate: "", awardedDate: "", location: "", pdfUrl: "", isPublished: true };

function toInputDate(d: string | null): string {
  if (!d) return "";
  // Slice the raw ISO string at "T" to get YYYY-MM-DD without timezone shift.
  return d.split("T")[0];
}

export default function ResultsManager() {
  const { showToast } = useToast();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrFor, setQrFor] = useState<ExamResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrCanvasWrapRef = useRef<HTMLDivElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/exam-results");
      setResults(res.data.data.results);
    } catch {
      showToast("Failed to load results", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const openCreate = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (r: ExamResult) => {
    setForm({
      id: r.id, title: r.title, testDate: toInputDate(r.testDate),
      awardedDate: toInputDate(r.awardedDate), location: r.location || "",
      pdfUrl: r.pdfUrl, isPublished: r.isPublished,
    });
    setShowForm(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { showToast("Please choose a PDF", "error"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const up = await api.post("/upload?folder=results", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const pdfUrl = up.data.data.url;

      let suggestions: any = {};
      try {
        const parsed = await api.post("/exam-results/parse", { pdfUrl });
        suggestions = parsed.data.data.suggestions || {};
      } catch { /* ignore */ }

      setForm((f) => ({
        ...f,
        pdfUrl,
        title: f.title || suggestions.title || "",
        location: f.location || suggestions.location || "",
        testDate: f.testDate || toInputDate(suggestions.testDate || null),
        awardedDate: f.awardedDate || toInputDate(suggestions.awardedDate || null),
      }));
      showToast("PDF uploaded", "success");
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.title || !form.pdfUrl) { showToast("Title and a PDF are required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        pdfUrl: form.pdfUrl,
        testDate: form.testDate || null,
        awardedDate: form.awardedDate || null,
        location: form.location || null,
        isPublished: form.isPublished,
      };
      if (form.id) await api.patch(`/exam-results/${form.id}`, payload);
      else await api.post("/exam-results", payload);
      showToast("Saved", "success");
      setShowForm(false);
      fetchResults();
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (r: ExamResult) => {
    try {
      await api.patch(`/exam-results/${r.id}`, { isPublished: !r.isPublished });
      fetchResults();
    } catch { showToast("Update failed", "error"); }
  };

  const remove = async (r: ExamResult) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/exam-results/${r.id}`);
      showToast("Deleted", "success");
      fetchResults();
    } catch { showToast("Delete failed", "error"); }
  };

  const copyLink = (r: ExamResult) => {
    navigator.clipboard.writeText(buildResultUrl(origin, r.id));
    showToast("Link copied", "success");
  };

  const downloadQr = (r: ExamResult) => {
    const canvas = qrCanvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `result-qr-${r.id}.png`;
    a.click();
  };

  return (
    <div className="text-white">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Belt Test Results</h2>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500">
          <Plus className="h-4 w-4" /> New Result
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-red-500" /></div>
      ) : results.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No results yet. Click "New Result" to upload one.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Test date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-gray-400">{r.testDate ? new Date(r.testDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(r)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${r.isPublished ? "bg-green-900/40 text-green-300" : "bg-gray-700/40 text-gray-400"}`}>
                      {r.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {r.isPublished ? "Published" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button title="QR code" onClick={() => setQrFor(r)} className="rounded p-1.5 hover:bg-white/10"><QrCode className="h-4 w-4" /></button>
                      <button title="Copy link" onClick={() => copyLink(r)} className="rounded p-1.5 hover:bg-white/10"><LinkIcon className="h-4 w-4" /></button>
                      <button title="Edit" onClick={() => openEdit(r)} className="rounded p-1.5 hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                      <button title="Delete" onClick={() => remove(r)} className="rounded p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0d] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{form.id ? "Edit Result" : "New Result"}</h3>
              <button onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-400">PDF file</label>
                <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {form.pdfUrl ? "Replace PDF" : "Upload PDF"}
                </button>
                {form.pdfUrl && <span className="ml-3 text-xs text-green-400">PDF attached</span>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" placeholder="Belt Test — Durg, Chhattisgarh" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Test date</label>
                  <input type="date" value={form.testDate} onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Awarded date</label>
                  <input type="date" value={form.awardedDate} onChange={(e) => setForm({ ...form, awardedDate: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" placeholder="Mas Oyama Karate Academy, Khursipar" />
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                Published (visible to public)
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {qrFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setQrFor(null)}>
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold">{qrFor.title}</h3>
            <p className="mb-4 break-all text-xs text-gray-500">{buildResultUrl(origin, qrFor.id)}</p>
            <div ref={qrCanvasWrapRef} className="mx-auto inline-block rounded-lg bg-white p-3">
              <QRCodeCanvas value={buildResultUrl(origin, qrFor.id)} size={200} />
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={() => downloadQr(qrFor)} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm hover:bg-red-500">
                <Download className="h-4 w-4" /> Download PNG
              </button>
              <button onClick={() => setQrFor(null)} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
