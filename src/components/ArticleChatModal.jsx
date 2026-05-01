import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal.jsx";
import { FaPaperPlane, FaComments } from "react-icons/fa";

function ArticleChatModal({ isOpen, onClose, article, currentUser }) {
  const articleId = article?.id;
  const storageKey = useMemo(
    () => (articleId ? `article_chat_${articleId}` : null),
    [articleId]
  );
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isOpen || !storageKey) return;
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setMessages(saved);
  }, [isOpen, storageKey]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !storageKey || !articleId) return;

    const newMessage = {
      id: Date.now(),
      text: trimmed,
      author: currentUser?.name || currentUser?.email || "Foydalanuvchi",
      role: currentUser?.role || "user",
      createdAt: new Date().toISOString(),
    };

    const next = [...messages, newMessage];
    setMessages(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setText("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Material bo'yicha muhokama">
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-700 mb-1">
            <FaComments className="text-blue-600" />
            <p className="font-semibold text-sm">Maqola</p>
          </div>
          <p className="text-sm text-slate-800 font-medium">{article?.articleTitle}</p>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Hozircha muhokama mavjud emas
            </p>
          ) : (
            messages.map((message) => {
              const mine =
                message.author === (currentUser?.name || currentUser?.email || "Foydalanuvchi");
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      mine
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    <div className={`text-xs mb-1 ${mine ? "text-blue-100" : "text-gray-500"}`}>
                      {message.author} · {new Date(message.createdAt).toLocaleString("uz-UZ")}
                    </div>
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="textarea textarea-bordered w-full h-24"
            placeholder="Material bo'yicha xabar yozing..."
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSend}
              className="btn btn-primary gap-2"
              disabled={!text.trim()}
            >
              <FaPaperPlane />
              Yuborish
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ArticleChatModal;
