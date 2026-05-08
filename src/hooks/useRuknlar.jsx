import { useMemo } from "react";
import useGetFetch from "./useGetFetch.jsx";
import { parseRuknlarPayload } from "../utils/ruknlarApi.js";

/**
 * Barcha platformada bitta manba: `${VITE_BASE_URL}/ruknlar/`
 */
export default function useRuknlar() {
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const url = base ? `${base}/ruknlar/` : null;
  const { data, isPending, error } = useGetFetch(url);
  const ruknlar = useMemo(() => parseRuknlarPayload(data), [data]);
  return { ruknlar, isPending, error };
}
