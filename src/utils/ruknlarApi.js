/**
 * GET /ruknlar/ (yoki shu strukturadagi javob) ni UI uchun bir xil forma ga keltiradi.
 * @returns {{ id: number, kod: string, nom: string }[]}
 */
export function parseRuknlarPayload(raw) {
  if (raw == null) return [];

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.results)
      ? raw.results
      : Array.isArray(raw?.data)
        ? raw.data
        : [];

  return list
    .map((item, idx) => {
      const idRaw = item?.id ?? item?.pk;
      if (idRaw == null || idRaw === "") return null;
      const id = Number(idRaw);
      if (!Number.isFinite(id)) return null;

      const nom =
        item?.nom ??
        item?.name ??
        item?.title ??
        item?.nomi ??
        "";

      const kod =
        item?.kod != null && item.kod !== ""
          ? String(item.kod)
          : String(idx + 1);

      return { id, kod, nom };
    })
    .filter(Boolean);
}
