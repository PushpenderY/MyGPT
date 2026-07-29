import { useState, useRef, useEffect } from "react";
import {
  SquarePen,
  Search,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  Settings,
  LogOut,
} from "lucide-react";
import Avatar from "./Avatar.jsx";

const formatLastLogin = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ChatRow = ({ chat, isActive, onSelect, onRename, onPin, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submitRename = () => {
    setEditing(false);
    if (title.trim() && title.trim() !== chat.title) {
      onRename(chat._id, title.trim());
    } else {
      setTitle(chat.title);
    }
  };

  return (
    <div
      className={`group relative flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer text-sm ${
        isActive ? "bg-surface-hover" : "hover:bg-surface-hover"
      }`}
      onClick={() => !editing && onSelect(chat._id)}
    >
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={submitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") {
              setTitle(chat.title);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border border-gray-500 rounded px-1.5 py-0.5 outline-none text-sm"
        />
      ) : (
        <span className="flex-1 truncate">{chat.title}</span>
      )}

      {!editing && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className={`p-1 rounded-md hover:bg-surface-border ${
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-7 w-40 bg-[#2a2a2a] border border-surface-border rounded-xl shadow-xl py-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setEditing(true);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover text-left"
              >
                <Pencil size={14} /> Rename
              </button>
              <button
                onClick={() => {
                  onPin(chat._id, !chat.isPinned);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover text-left"
              >
                {chat.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                {chat.isPinned ? "Unpin" : "Pin"}
              </button>
              <button
                onClick={() => {
                  onDelete(chat._id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover text-left text-red-400"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  collapsed,
  onToggleCollapse,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onPinChat,
  onDeleteChat,
  onOpenSearch,
  onOpenLibrary,
  onOpenSettings,
  user,
  onLogout,
}) => {
  const pinned = chats.filter((c) => c.isPinned);
  const recents = chats.filter((c) => !c.isPinned);

  if (collapsed) {
    return (
      <div className="w-[60px] bg-surface-sidebar flex flex-col items-center py-3 gap-2 border-r border-surface-border">
        <button
          onClick={onToggleCollapse}
          className="p-2.5 rounded-lg hover:bg-surface-hover"
          title="Open sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
        <button
          onClick={onNewChat}
          className="p-2.5 rounded-lg hover:bg-surface-hover"
          title="New chat"
        >
          <SquarePen size={18} />
        </button>
        <button
          onClick={onOpenSearch}
          className="p-2.5 rounded-lg hover:bg-surface-hover"
          title="Search chats"
        >
          <Search size={18} />
        </button>
        <button
          onClick={onOpenLibrary}
          className="p-2.5 rounded-lg hover:bg-surface-hover"
          title="Library"
        >
          <LibraryBig size={18} />
        </button>
        <div className="flex-1" />
        <button
          onClick={onOpenSettings}
          className="p-1 rounded-full hover:opacity-80"
          title={user?.name}
        >
          <Avatar user={user} size={30} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[260px] bg-surface-sidebar flex flex-col border-r border-surface-border">
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-semibold">
            M
          </div>
          <span className="font-semibold text-sm">MyGPT</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-surface-hover"
          title="Close sidebar"
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      <div className="px-2 pt-2 flex flex-col gap-0.5">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-hover text-sm"
        >
          <SquarePen size={16} /> New chat
        </button>
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-hover text-sm"
        >
          <Search size={16} /> Search chats
        </button>
        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-hover text-sm"
        >
          <LibraryBig size={16} /> Library
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-4 pb-2">
        {pinned.length > 0 && (
          <>
            <p className="px-2.5 pb-1 text-xs text-gray-500 font-medium">Pinned</p>
            <div className="flex flex-col gap-0.5 mb-4">
              {pinned.map((chat) => (
                <ChatRow
                  key={chat._id}
                  chat={chat}
                  isActive={chat._id === activeChatId}
                  onSelect={onSelectChat}
                  onRename={onRenameChat}
                  onPin={onPinChat}
                  onDelete={onDeleteChat}
                />
              ))}
            </div>
          </>
        )}

        <p className="px-2.5 pb-1 text-xs text-gray-500 font-medium">Recents</p>
        <div className="flex flex-col gap-0.5">
          {recents.length === 0 && (
            <p className="px-2.5 py-2 text-xs text-gray-600">No chats yet</p>
          )}
          {recents.map((chat) => (
            <ChatRow
              key={chat._id}
              chat={chat}
              isActive={chat._id === activeChatId}
              onSelect={onSelectChat}
              onRename={onRenameChat}
              onPin={onPinChat}
              onDelete={onDeleteChat}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-surface-border p-2">
        <div className="flex items-center gap-2.5 px-1.5 py-2 rounded-lg hover:bg-surface-hover group">
          <Avatar user={user} size={30} />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              Last login {formatLastLogin(user?.lastLoginAt)}
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-surface-border"
            title="Settings"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-surface-border"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
