import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaPlus, FaSyncAlt, FaTrash, FaPen, FaEye } from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import Modal from "../../../components/Modal.jsx";
import { toast } from "react-toastify";

const RANG_OPTIONS = [
  { value: "YASHIL", label: "Yashil" },
  { value: "QIZIL", label: "Qizil" },
  { value: "SARI", label: "Sariq" },
  { value: "KO_K", label: "Ko'k" },
  { value: "KULRANG", label: "Kulrang" },
];

function rangBadgeClass(rang) {
  const r = String(rang || "").toUpperCase();
  const map = {
    YASHIL: "bg-emerald-100 text-emerald-800 border-emerald-200",
    QIZIL: "bg-red-100 text-red-800 border-red-200",
    SARI: "bg-amber-100 text-amber-900 border-amber-200",
    KO_K: "bg-blue-100 text-blue-800 border-blue-200",
    KULRANG: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return map[r] || "bg-slate-50 text-slate-600 border-slate-200";
}

function parseList(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.results)) return json.results;
  return [];
}

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const [y, m, d] = s.split("-");
  if (y && m && d) return `${d}.${m}.${y}`;
  return String(iso);
}

export default function AdminMuhimSanalarView() {
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const apiRoot = `${base}/admin/muhim-sanalar`;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tavsif: "", sana: "", rang: "YASHIL" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!base) {
      toast.error("VITE_BASE_URL sozlanmagan");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `${apiRoot}/`,
        { headers: { Accept: "application/json" } },
        getAccessToken,
        refreshAccessToken,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(json, "Ro'yxat yuklanmadi"));
      setItems(parseList(json));
    } catch (e) {
      toast.error(e.message || "Xatolik");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiRoot, base, refreshAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ tavsif: "", sana: "", rang: "YASHIL" });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      tavsif: row.tavsif || "",
      sana: String(row.sana || "").slice(0, 10),
      rang: String(row.rang || "YASHIL").toUpperCase(),
    });
    setFormOpen(true);
    setDetailOpen(false);
  };

  const openDetail = async (row) => {
    setDetailItem(row);
    setDetailOpen(true);
    try {
      const res = await fetchWithAuth(
        `${apiRoot}/${row.id}/`,
        { headers: { Accept: "application/json" } },
        getAccessToken,
        refreshAccessToken,
      );
      const json = await res.json().catch(() => null);
      if (res.ok && json && typeof json === "object") setDetailItem(json);
    } catch {
      /* list qatori bilan davom etamiz */
    }
  };

  const saveForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        tavsif: form.tavsif.trim(),
        sana: form.sana,
        rang: form.rang,
      };
      const url = editingId ? `${apiRoot}/${editingId}/` : `${apiRoot}/`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetchWithAuth(
        url,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        },
        getAccessToken,
        refreshAccessToken,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(json, "Saqlashda xatolik"));
      toast.success(editingId ? "Yangilandi" : "Yaratildi");
      setFormOpen(false);
      await load();
      if (detailOpen && editingId && detailItem?.id === editingId && json && typeof json === "object") {
        setDetailItem(json);
      }
      if (detailOpen && !editingId && json?.id) {
        setDetailItem(json);
      }
    } catch (err) {
      toast.error(err.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`"${row.tavsif}" o'chirilsinmi?`)) return;
    try {
      const res = await fetchWithAuth(
        `${apiRoot}/${row.id}/`,
        { method: "DELETE" },
        getAccessToken,
        refreshAccessToken,
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(parseApiError(json, "O'chirib bo'lmadi"));
      }
      toast.success("O'chirildi");
      setDetailOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || "Xatolik");
    }
  };

  const sorted = useMemo(
    () => [...items].sort((a, b) => String(b.sana || "").localeCompare(String(a.sana || ""))),
    [items],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-white">
            <FaCalendarAlt />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Muhim sanalar</h2>
            <p className="text-sm text-slate-500">Taqvim yozuvlari — ro&apos;yxat va boshqaruv</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <FaSyncAlt className="text-xs opacity-70" />
            Yangilash
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700"
          >
            <FaPlus className="text-xs" />
            Yangi sana
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="text-left">Tavsif</th>
                <th className="text-left">Sana</th>
                <th className="text-left">Rang</th>
                <th className="w-[1%] whitespace-nowrap text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <span className="loading loading-spinner loading-lg text-teal-500" />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                    Hozircha yozuvlar yo&apos;q
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.id} className="border-slate-50 hover:bg-slate-50/60">
                    <td className="max-w-xs font-semibold text-slate-800">{row.tavsif}</td>
                    <td className="whitespace-nowrap text-sm text-slate-600">
                      {formatDisplayDate(row.sana)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${rangBadgeClass(row.rang)}`}
                      >
                        {row.rang || "—"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Batafsil"
                          className="btn btn-square btn-ghost btn-sm"
                          onClick={() => openDetail(row)}
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          title="Tahrirlash"
                          className="btn btn-square btn-ghost btn-sm"
                          onClick={() => openEdit(row)}
                        >
                          <FaPen />
                        </button>
                        <button
                          type="button"
                          title="O'chirish"
                          className="btn btn-square btn-ghost btn-sm text-red-600"
                          onClick={() => remove(row)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Muhim sana — batafsil">
        {detailItem && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Tavsif</p>
              <p className="font-semibold text-slate-900">{detailItem.tavsif}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Sana</p>
              <p>{formatDisplayDate(detailItem.sana)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Rang</p>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rangBadgeClass(detailItem.rang)}`}
              >
                {detailItem.rang}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openEdit(detailItem)}>
                Tahrirlash
              </button>
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                onClick={() => remove(detailItem)}
              >
                O&apos;chirish
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editingId ? "Muhim sanani tahrirlash" : "Yangi muhim sana"}
      >
        <form onSubmit={saveForm} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Tavsif</span>
            </label>
            <input
              className="input input-bordered w-full"
              value={form.tavsif}
              onChange={(e) => setForm((p) => ({ ...p, tavsif: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text font-semibold">Sana</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={form.sana}
              onChange={(e) => setForm((p) => ({ ...p, sana: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text font-semibold">Rang</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.rang}
              onChange={(e) => setForm((p) => ({ ...p, rang: e.target.value }))}
            >
              {RANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={saving}
              onClick={() => setFormOpen(false)}
            >
              Bekor
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : "Saqlash"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
