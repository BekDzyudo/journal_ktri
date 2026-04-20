import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import useGetFetchProfile from "../hooks/useGetFetchProfile";

function Chat({ materialId }) {
  const { userData, auth } = useContext(AuthContext);
  const [Material, setMaterial] = useState(null);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);
  const enterInput = useRef();

  useEffect(() => {
    if (!materialId) return;
    fetch(
      `${import.meta.env.VITE_BASE_URL}/birlashma/material/${materialId}/muhokama-update/`,
    )
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then((data) => {})
      .catch((err) => {
        // console.log(err);
      });
  }, [materialId]);

  function lookAtAction() {
    if (!auth?.accessToken || !materialId) return;
    fetch(
      `${
        import.meta.env.VITE_BASE_URL
      }/birlashma/material-detail/${materialId}/`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.accessToken,
        },
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then((data) => {
        setMaterial(data);
      })
      .catch((err) => {
        // console.log(err);
      })
      .finally(() => {});
  }

  useEffect(() => {
    if (!auth?.accessToken || !materialId) return;
    lookAtAction();
  }, [auth?.accessToken, materialId]);

  // web socket
  const socketUrl = `ws://192.168.100.10/ws/notifications/?token=${auth?.accessToken}`;
  useEffect(() => {
    if (!auth.accessToken) return;
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      // console.log("WebSocket ulanishi o'rnatildi");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log("yangi notification:", data);
      lookAtAction();
    };

    socket.onerror = (error) => {
      // console.error("WebSocket yopildi:", error);
    };

    return () => {
      socket.close();
    };
  }, [auth?.accessToken]);

  // get data
  const { data: user } = useGetFetchProfile(
    `${import.meta.env.VITE_BASE_URL}/user-data/`,
  );

  // sent data
  function sendData(e) {
    e.preventDefault();
    if (inputText) {
      fetch(`${import.meta.env.VITE_BASE_URL}/birlashma/muhokama-create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          teacher: userData?.userId,
          material: Material.id,
        }),
      })
        .then((res) => {
          const errorObj = res.json();
          if (!res.ok) throw new Error(JSON.stringify(errorObj));
          return res;
        })
        .then((data) => {})
        .catch((err) => console.log(err))
        .finally(() => {
          setInputText("");
          enterInput.current.value = "";
          lookAtAction();
        });
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [Material?.muhokamalar]);

  return (
    <>
    <div>
      <h1 className="border-b text-xs sm:text-md text-center uppercase font-semibold mb-4 pb-1">{Material?.kategoriya_material?.name} bo'yicha</h1>
    </div>
      {Material?.muhokamalar?.map((item) => {
        return (
          item.text && (
            <div
              key={item.id}
              className={`chat ${item.metodist?.id ? "chat-start" : "chat-end"}`}
            >
              <div className="chat-image avatar">
                <div className="w-9 sm:w-10 rounded-full">
                  <img
                    alt="Avatar"
                    src={item.metodist?.id ? item.metodist?.image : user.image}
                  />
                </div>
              </div>
              <div className="chat-header">
                {item.metodist && (
                  <span>
                    {item.metodist?.first_name + " " + item.metodist?.last_name}
                  </span>
                )}
                {/* <time className="text-xs opacity-50">12:45</time> */}
              </div>
              <div className="chat-bubble text-sm sm:text-md">{item.text}</div>
            </div>
          )
        );
      })}
      <div ref={chatEndRef} />
      <div>
        <form className="flex gap-1 mt-5" onSubmit={sendData}>
          <input
            ref={enterInput}
            onChange={(e) => setInputText(e.target.value)}
            type="text"
            className="input input-sm sm:input-md join-item w-full outline-0"
            placeholder="Xabar yozing..."
          />
          <button type="submit" className="btn btn-sm sm:btn-md join-item">
            Yuborish
          </button>
        </form>
      </div>
    </>
  );
}

export default Chat;
