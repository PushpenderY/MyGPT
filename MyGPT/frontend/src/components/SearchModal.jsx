import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MessageSquare, Plus } from "lucide-react";
import * as chatApi from "../api/chat.js";

const SearchModal = ({ open, onClose, onNewChat }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    chatApi.getChats().then(setResults);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await chatApi.getChats(query);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open]);

  if (!open) return null;

  const goToChat = (chatId) => {
    navigate(`/c/${chatId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center pt-24 p-4">
      <div className="bg-[#2a2a2a] w-full max-w-lg rounded-2xl border border-surface-border shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
          <Search size={17} className="text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-hover">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover text-sm text-left"
          >
            <Plus size={16} /> New chat
          </button>

          {loading && (
            <p className="px-4 py-2 text-xs text-gray-500">Searching…</p>
          )}

          {!loading && results.length === 0 && (
            <p className="px-4 py-4 text-sm text-gray-500 text-center">
              No chats found
            </p>
          )}

          {results.map((chat) => (
            <button
              key={chat._id}
              onClick={() => goToChat(chat._id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover text-sm text-left truncate"
            >
              <MessageSquare size={15} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
