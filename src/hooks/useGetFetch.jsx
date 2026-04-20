import React, { useEffect, useState } from "react";

function useGetFetch(url) {
  const [data, setData] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (!url) {
      setData(null);
      setIsPending(false);
      setError(null);
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const fetchData = async () => {
      setIsPending(true);
      setError(null);
      try {
        const req = await fetch(url, { signal: controller.signal });
        if (!req.ok) {
          throw new Error(req.statusText || `Request failed: ${req.status}`);
        }
        const json = await req.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!cancelled) {
          setError(err.message || "Unknown error");
          console.error(err);
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

  return { data, isPending, error };
}

export default useGetFetch;
