import { useEffect, useState } from "react";
import { X, Check, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import * as userApi from "../api/user.js";

const PROVIDERS = [
  {
    key: "gemini",
    label: "Google Gemini",
    helper: "Get a key at aistudio.google.com/apikey",
    color: "bg-blue-400",
  },
  {
    key: "openai",
    label: "OpenAI (ChatGPT)",
    helper: "Get a key at platform.openai.com/api-keys",
    color: "bg-emerald-400",
  },
  {
    key: "claude",
    label: "Anthropic Claude",
    helper: "Get a key at console.anthropic.com",
    color: "bg-orange-400",
  },
];

const SettingsModal = ({ open, onClose, keyStatus, onSaved, focusProvider }) => {
  const [inputs, setInputs] = useState({});
  const [reveal, setReveal] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    if (open) {
      setInputs({});
      setReveal({});
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async (provider) => {
    const apiKey = inputs[provider]?.trim();
    if (!apiKey) return;
    setSavingKey(provider);
    try {
      await userApi.saveApiKey(provider, apiKey);
      setInputs((prev) => ({ ...prev, [provider]: "" }));
      onSaved();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not save key");
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemove = async (provider) => {
    setSavingKey(provider);
    try {
      await userApi.deleteApiKey(provider);
      onSaved();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not remove key");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] w-full max-w-lg rounded-2xl border border-surface-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold">Settings — API keys</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-gray-400 -mt-1">
            Paste your own API key for any provider you want to chat with. Keys
            are encrypted before being stored and are never shown again in full.
          </p>

          {PROVIDERS.map((p) => {
            const status = keyStatus?.[p.key];
            const isFocused = focusProvider === p.key;
            return (
              <div
                key={p.key}
                className={`rounded-xl border p-3.5 ${
                  isFocused ? "border-emerald-500" : "border-surface-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className={`w-2 h-2 rounded-full ${p.color}`} />
                    {p.label}
                  </div>
                  {status?.connected && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Check size={13} /> Connected · {status.preview}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{p.helper}</p>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={reveal[p.key] ? "text" : "password"}
                      value={inputs[p.key] || ""}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, [p.key]: e.target.value }))
                      }
                      placeholder={status?.connected ? "Replace key…" : "Paste API key…"}
                      className="w-full bg-surface-input border border-surface-border rounded-lg pl-3 pr-9 py-2 text-sm outline-none focus:border-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setReveal((prev) => ({ ...prev, [p.key]: !prev[p.key] }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {reveal[p.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <button
                    onClick={() => handleSave(p.key)}
                    disabled={!inputs[p.key]?.trim() || savingKey === p.key}
                    className="px-3 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {savingKey === p.key ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                  </button>

                  {status?.connected && (
                    <button
                      onClick={() => handleRemove(p.key)}
                      disabled={savingKey === p.key}
                      className="p-2 rounded-lg hover:bg-surface-hover text-gray-400 hover:text-red-400"
                      title="Remove key"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
