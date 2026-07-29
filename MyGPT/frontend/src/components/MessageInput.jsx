import { useState, useRef } from "react";
import { Paperclip, ArrowUp, X, FileText, Loader2 } from "lucide-react";
import { uploadFiles } from "../api/file.js";

const MAX_FILES = 5;

const MessageInput = ({ onSend, disabled, chatId }) => {
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]); // { _id, type, originalName, url, uploading }
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleChange = (e) => {
    setText(e.target.value);
    autoResize(e.target);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []).slice(
      0,
      MAX_FILES - pendingFiles.length
    );
    e.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadFiles(files, chatId);
      setPendingFiles((prev) => [...prev, ...uploaded]);
    } catch (error) {
      alert(error?.response?.data?.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id) => {
    setPendingFiles((prev) => prev.filter((f) => f._id !== id));
  };

  const handleSend = () => {
    if (disabled || isUploading) return;
    if (!text.trim() && pendingFiles.length === 0) return;

    onSend(text.trim(), pendingFiles);
    setText("");
    setPendingFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fileOrigin = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "");

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 pb-4">
      <div className="bg-surface-input border border-surface-border rounded-3xl px-3 pt-3 pb-2 shadow-lg">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 pb-2">
            {pendingFiles.map((f) => (
              <div
                key={f._id}
                className="relative group flex items-center gap-2 bg-surface-hover border border-surface-border rounded-xl px-2 py-1.5"
              >
                {f.type === "image" ? (
                  <img
                    src={`${fileOrigin}${f.url}`}
                    alt={f.originalName}
                    className="w-8 h-8 rounded-md object-cover"
                  />
                ) : (
                  <FileText size={18} className="text-red-400" />
                )}
                <span className="text-xs max-w-[100px] truncate">{f.originalName}</span>
                <button
                  onClick={() => removeFile(f._id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 absolute -top-1.5 -right-1.5"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
            multiple
            hidden
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || pendingFiles.length >= MAX_FILES}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-hover disabled:opacity-40 mb-0.5"
            title="Attach image or PDF"
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Paperclip size={18} />
            )}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message MyGPT…"
            className="flex-1 bg-transparent resize-none outline-none text-[15px] leading-6 py-1.5 max-h-[200px] placeholder:text-gray-500"
          />

          <button
            onClick={handleSend}
            disabled={disabled || isUploading || (!text.trim() && pendingFiles.length === 0)}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white text-black disabled:bg-surface-hover disabled:text-gray-500 transition-colors mb-0.5"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-500 mt-2">
        MyGPT uses your own API key and can make mistakes. Verify important info. this is only a frontend and backend project made by Pushpender.
      </p>
    </div>
  );
};

export default MessageInput;
