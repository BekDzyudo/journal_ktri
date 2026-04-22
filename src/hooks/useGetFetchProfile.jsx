import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

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
        // Mock rejimida localStorage'dan olish
        if (import.meta.env.VITE_USE_MOCK === 'true') {
          const storedUserData = localStorage.getItem("userData");
          if (storedUserData) {
            setData(JSON.parse(storedUserData));
          }
          setIsPending(false);
          return;
        }

        // Haqiqiy API bilan ishlash
        const accessToken = localStorage.getItem("accessToken");
        
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
          await refresh();
          
          const newAccessToken = localStorage.getItem("accessToken");
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
// import React, { useContext, useEffect, useState } from "react";
// import { AuthContext } from "../context/AuthContext";

// function useGetFetchProfile(url, lookAtLogout) {
//   const [data, setData] = useState(null);
//   const [isPending, setIsPending] = useState(false);
//   const [error, setError] = useState(null);

//   const { auth, refresh, isTokenExpired } = useContext(AuthContext);

//   useEffect(() => {
//     const refreshToken = localStorage.getItem("refreshToken");
 
//     const fetchData = async () => {
//       setIsPending(true);
//       try {
//         let req = ""
//         if(refreshToken && !(await isTokenExpired(refreshToken))){
//           req = await fetch(url, {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: "Bearer " + auth.accessToken,
//             },
//           });
//         }

//         if (req.status === 401) {
//           await refresh(); // Access tokenni yangilash
//           const retryReq = await fetch(url, {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: "Bearer " + auth.accessToken, // Yangi token bilan
//             },
//           });

//           if (!retryReq.ok) {
//             throw new Error(retryReq.statusText);
//           }
//           const retryData = await retryReq.json();
//           setData(retryData);
          
//         } else if (!req.ok) {
//           throw new Error(req.statusText);
//         } else {
//           const data = await req.json();
//             setData(data);
//         }

//         setIsPending(false);
//       } catch (err) {
//         setError(err.message);
//         // console.log(err.message);
//         setIsPending(false);
//       }
//     };
//     fetchData();
//   }, [url, auth.accessToken, lookAtLogout]);

//   return { data, isPending, error };
// }

// export default useGetFetchProfile;
