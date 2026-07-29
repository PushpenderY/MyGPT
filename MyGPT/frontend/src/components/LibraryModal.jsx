import { useEffect, useState } from "react";
import { X, FileText, Image as ImageIcon, Trash2, Download } from "lucide-react";
import * as fileApi from "../api/file.js";

const fileOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/api\/v1\/?$/, "");

const LibraryModal = ({ open, onClose }) => {
  const [tab, setTab] = useState("image");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fileApi
      .getLibraryFiles(tab)
      .then(setFiles)
      .finally(() => setLoading(false));
  }, [open, tab]);

  if (!open) return null;

  const handleDelete = async (fileId) => {
    await fileApi.deleteFile(fileId);
    setFiles((prev) => prev.filter((f) => f._id !== fileId));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold">Library</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          <button
            onClick={() => setTab("image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
              tab === "image" ? "bg-surface-hover" : "text-gray-400 hover:bg-surface-hover"
            }`}
          >
            <ImageIcon size={14} /> Images
          </button>
          <button
            onClick={() => setTab("pdf")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
              tab === "pdf" ? "bg-surface-hover" : "text-gray-400 hover:bg-surface-hover"
            }`}
          >
            <FileText size={14} /> PDFs
          </button>
        </div>

        <div className="p-5 min-h-[260px] max-h-[60vh] overflow-y-auto">
          {loading && <p className="text-sm text-gray-500">Loading…</p>}

          {!loading && files.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              {tab === "image" ? <ImageIcon size={28} /> : <FileText size={28} />}
              <p className="text-sm mt-2">
                No {tab === "image" ? "images" : "PDFs"} uploaded yet
              </p>
            </div>
          )}

          {tab === "image" && files.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {files.map((f) => (
                <div key={f._id} className="relative group">
                  <a href={`${fileOrigin}${f.url}`} target="_blank" rel="noreferrer">
                    <img
                      src={`${fileOrigin}${f.url}`}
                      alt={f.originalName}
                      className="w-full h-24 object-cover rounded-lg border border-surface-border"
                    />
                  </a>
                  <button
                    onClick={() => handleDelete(f._id)}
                    className="absolute top-1 right-1 bg-black/70 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "pdf" && files.length > 0 && (
            <div className="flex flex-col gap-2">
              {files.map((f) => (
                <div
                  key={f._id}
                  className="flex items-center gap-3 bg-surface-input border border-surface-border rounded-xl px-3 py-2.5"
                >
                  <FileText size={20} className="text-red-400 flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{f.originalName}</span>
                  <a
                    href={`${fileOrigin}${f.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-surface-hover text-gray-400"
                  >
                    <Download size={15} />
                  </a>
                  <button
                    onClick={() => handleDelete(f._id)}
                    className="p-1.5 rounded-lg hover:bg-surface-hover text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
