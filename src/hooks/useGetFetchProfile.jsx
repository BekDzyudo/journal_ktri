import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getAccessToken } from "../utils/authStorage";

function useGetFetchProfile(url) {
  const [data, setData] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const { auth, refresh } = useContext(AuthContext);

  useEffect(() => {
    if (!auth) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsPending(true);
      try {
        const accessToken = getAccessToken();
        
        if (!accessToken) {
          throw new Error("No access token found");
        }

        const req = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + accessToken,
          },
        });

        if (req.status === 401) {
          // Token muddati tugagan, refresh qilish
          const newAccessToken = await refresh();
          
          if (!newAccessToken) {
            throw new Error("Tokenni yangilab bo'lmadi");
          }

          const retryReq = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + newAccessToken,
            },
          });

          if (!retryReq.ok) {
            throw new Error(retryReq.statusText);
          }
          
          const retryData = await retryReq.json();
          setData(retryData);
        } else if (!req.ok) {
          throw new Error(req.statusText);
        } else {
          const responseData = await req.json();
          setData(responseData);
        }

        setIsPending(false);
      } catch (err) {
        setError(err.message);
        setIsPending(false);
      }
    };

    fetchData();
  }, [url, auth]);

  return { data, isPending, error };
}

export default useGetFetchProfile;
