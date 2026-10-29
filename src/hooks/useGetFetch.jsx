import React, { useEffect, useState } from "react";

function useGetFetch(url) {
  const [data, setData] = useState(null);
  // url bo'lsa birinchi renderdanoq "yuklanmoqda" — aks holda bir lahzaga "topilmadi" holati chiqadi
  const [isPending, setIsPending] = useState(Boolean(url));
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (!url) {
      setData(null);
      setIsPending(false);
      setError(null);
      setStatus(null);
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const fetchData = async () => {
      setIsPending(true);
      setError(null);
      setStatus(null);
      try {
        const req = await fetch(url, { signal: controller.signal });
        if (!cancelled) setStatus(req.status);
        if (!req.ok) {
          throw new Error(req.statusText || `Request failed: ${req.status}`);
        }
        const json = await req.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!cancelled) {
          setError(err.message || "Unknown error");
        }
      } finally {
        if (!cancelled) setIsPending(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return { data, isPending, error, status };
}

export default useGetFetch;
