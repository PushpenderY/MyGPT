import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PanelLeftOpen, Sparkles } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import MessageBubble from "../components/MessageBubble.jsx";
import MessageInput from "../components/MessageInput.jsx";
import ModelSelector from "../components/ModelSelector.jsx";
import SearchModal from "../components/SearchModal.jsx";
import LibraryModal from "../components/LibraryModal.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import * as chatApi from "../api/chat.js";
import * as messageApi from "../api/message.js";
import * as userApi from "../api/user.js";

const TypingBubble = () => (
  <div className="w-full flex justify-start">
    <div className="flex gap-3 max-w-[820px] w-full">
      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold">M</span>
      </div>
      <div className="flex items-center gap-1 pt-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
      </div>
    </div>
  </div>
);

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [provider, setProvider] = useState(user?.lastUsedProvider || "gemini");
  const [keyStatus, setKeyStatus] = useState({});

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocusProvider, setSettingsFocusProvider] = useState(null);

  const bottomRef = useRef(null);

  const loadChats = useCallback(() => {
    chatApi.getChats().then(setChats);
  }, []);

  const loadKeyStatus = useCallback(() => {
    userApi.getApiKeyStatus().then((data) => setKeyStatus(data.keys));
  }, []);

  useEffect(() => {
    loadChats();
    loadKeyStatus();
  }, [loadChats, loadKeyStatus]);

  // Load active chat + its messages whenever the URL chatId changes
  useEffect(() => {
    if (!chatId) {
      setActiveChat(null);
      setMessages([]);
      setProvider(user?.lastUsedProvider || "gemini");
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);

    Promise.all([chatApi.getChatById(chatId), chatApi.getChatMessages(chatId)])
      .then(([chat, msgs]) => {
        if (cancelled) return;
        setActiveChat(chat);
        setMessages(msgs);
        setProvider(chat.provider);
      })
      .catch(() => {
        if (!cancelled) navigate("/");
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chatId, navigate, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleNewChat = () => {
    navigate("/");
    setSidebarCollapsed((c) => c); // no-op, keeps lint happy
  };

  const handleSelectChat = (id) => navigate(`/c/${id}`);

  const handleRenameChat = async (id, title) => {
    const updated = await chatApi.updateChat(id, { title });
    setChats((prev) => prev.map((c) => (c._id === id ? updated : c)));
  };

  const handlePinChat = async (id, isPinned) => {
    const updated = await chatApi.updateChat(id, { isPinned });
    setChats((prev) => prev.map((c) => (c._id === id ? updated : c)));
  };

  const handleDeleteChat = async (id) => {
    await chatApi.deleteChat(id);
    setChats((prev) => prev.filter((c) => c._id !== id));
    if (id === chatId) navigate("/");
  };

  const handleProviderChange = async (newProvider) => {
    setProvider(newProvider);
    userApi.setLastUsedProvider(newProvider).catch(() => {});
    if (chatId) {
      const updated = await chatApi.updateChat(chatId, { provider: newProvider });
      setActiveChat(updated);
      setChats((prev) => prev.map((c) => (c._id === chatId ? updated : c)));
    }
  };

  const handleRequireSetup = (providerKey) => {
    setSettingsFocusProvider(providerKey);
    setSettingsOpen(true);
  };

  const handleSend = async (content, attachments) => {
    if (!keyStatus?.[provider]?.connected) {
      handleRequireSetup(provider);
      return;
    }

    let targetChatId = chatId;

    if (!targetChatId) {
      const newChat = await chatApi.createChat({ provider });
      targetChatId = newChat._id;
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      navigate(`/c/${targetChatId}`, { replace: true });
    }

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { _id: tempId, role: "user", content, attachments, createdAt: new Date().toISOString() },
    ]);
    setIsSending(true);

    try {
      const attachmentIds = attachments.map((a) => a._id);
      const result = await messageApi.sendMessage({
        chatId: targetChatId,
        content,
        attachmentIds,
        provider,
      });

      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempId),
        result.userMessage,
        result.assistantMessage,
      ]);
      setActiveChat(result.chat);
      loadChats();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          _id: `err-${Date.now()}`,
          role: "assistant",
          content:
            error?.response?.data?.message ||
            "Something went wrong sending that message. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen w-screen flex bg-surface text-white overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        chats={chats}
        activeChatId={chatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        onDeleteChat={handleDeleteChat}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenSettings={() => {
          setSettingsFocusProvider(null);
          setSettingsOpen(true);
        }}
        user={user}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 h-14 flex-shrink-0">
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-1.5 rounded-lg hover:bg-surface-hover"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          <ModelSelector
            provider={provider}
            keyStatus={keyStatus}
            onChange={handleProviderChange}
            onRequireSetup={handleRequireSetup}
          />
        </div>

        {/* Messages / welcome state */}
        {hasMessages || loadingMessages ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[820px] mx-auto px-4 py-6 flex flex-col gap-6">
                {messages.map((m) => (
                  <MessageBubble key={m._id} message={m} />
                ))}
                {isSending && <TypingBubble />}
                <div ref={bottomRef} />
              </div>
            </div>
            <MessageInput onSend={handleSend} disabled={isSending} chatId={chatId} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mb-4">
              <Sparkles size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">
              What can I help with, {user?.name?.split(" ")[0]}?
            </h1>
            <MessageInput onSend={handleSend} disabled={isSending} chatId={chatId} />
          </div>
        )}
      </div>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNewChat={handleNewChat}
      />
      <LibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        keyStatus={keyStatus}
        focusProvider={settingsFocusProvider}
        onSaved={loadKeyStatus}
      />
    </div>
  );
};

export default Chat;
