import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  FaNewspaper, FaSearch, FaSync, FaChevronLeft, FaChevronRight,
  FaCalendarAlt, FaUser, FaTag, FaFileAlt,
} from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { inferMuallifHolatKeyForPanel } from "../../../utils/maqolaApi.js";
import {
  MUALLIF_API_HOLAT_LABELS, MUALLIF_API_HOLAT_COLORS,
} from "../../../constants/roles.js";

function formatDate(str) {
  if (!str) return "—";
  try {
    const d = new Date(str);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return str;
  }
}

export default function MaqolalarView() {
  const { refresh: refreshAccessToken } = useContext(AuthContext);

  const [articles, setArticles] = useState([]);
  console.log(articles);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const res = await fetchWithAuth(
        `${base}/admin/maqolalar/`,
        { method: "GET" },
        getAccessToken,
        refreshAccessToken
      );
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.results)
          ? json.results
          : [];
      setArticles(list);
    } catch (err) {
      setError(err.message || "Maqolalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => { load(); }, [load]);

  const filtered = articles.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const sarlavha = (a.sarlavha || "").toLowerCase();
    const mualliflar = Array.isArray(a.mualliflar)
      ? a.mualliflar.map((m) =>
          typeof m === "object" && m !== null
            ? (m.ism_familiya || m.ism || m.name || m.full_name ||
               `${m.first_name || ""} ${m.last_name || ""}`.trim())
            : ""
        ).join(" ").toLowerCase()
      : "";
    return sarlavha.includes(q) || mualliflar.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Boshqaruv</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Maqolalar</h2>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          Yangilash
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
        <input
          type="text"
          placeholder="Sarlavha yoki muallif bo'yicha qidirish..."
          value={search}
          onChange={handleSearch}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-blue-500" />
          <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaNewspaper className="text-emerald-500" />
                <h3 className="text-base font-black text-slate-900">Barcha maqolalar</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                {filtered.length} ta
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 font-semibold">
              Maqola topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Sarlavha</th>
                    <th className="px-4 py-3 text-left">Mualliflar</th>
                    <th className="px-4 py-3 text-left">Rukn</th>
                    <th className="px-4 py-3 text-left">Sahifalar</th>
                    <th className="px-4 py-3 text-left">Holat</th>
                    <th className="px-4 py-3 text-left">Nashr sanasi</th>
                    <th className="px-4 py-3 text-left">Yuborilgan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((a, idx) => {
                    const holatRaw = a.holat ?? "";
                    const holatKey = inferMuallifHolatKeyForPanel({ holat: holatRaw });
                    const badgeClass = MUALLIF_API_HOLAT_COLORS[holatKey] || "bg-gray-100 text-gray-700 border-gray-200";
                    const badgeLabel = MUALLIF_API_HOLAT_LABELS[holatKey] || holatRaw || "—";

                    return (
                      <tr key={a.id ?? idx} className="transition hover:bg-slate-50/70">
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="max-w-56 px-4 py-3.5">
                          <p className="line-clamp-2 font-semibold text-slate-900 leading-snug">
                            {a.sarlavha || "Nomsiz"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                            {Array.isArray(a.mualliflar) && a.mualliflar.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {a.mualliflar.map((m, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <FaUser className="shrink-0 text-[10px] text-slate-400" />
                                  <span className="text-xs text-slate-700">{m.ism_familya}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700">{a.rukn?.nom || "—"}</span>
                            {a.rukn?.kod && (
                              <span className="text-[11px] text-slate-400">{a.rukn.kod}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FaFileAlt className="text-[10px] text-slate-400" />
                            <span className="text-slate-600 text-xs">{a.sahifalar || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FaCalendarAlt className="text-[9px]" />
                            {formatDate(a.nashr_sanasi)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FaCalendarAlt className="text-[9px]" />
                            {formatDate(a.yuborilgan_vaqt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                <span className="text-xs font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
