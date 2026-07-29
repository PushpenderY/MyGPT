import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Lock } from "lucide-react";

const PROVIDER_META = {
  gemini: { label: "Gemini", dotColor: "bg-blue-400" },
  openai: { label: "ChatGPT (GPT)", dotColor: "bg-emerald-400" },
  claude: { label: "Claude", dotColor: "bg-orange-400" },
};

const ModelSelector = ({ provider, keyStatus, onChange, onRequireSetup }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = PROVIDER_META[provider] || PROVIDER_META.gemini;

  const handleSelect = (key) => {
    setOpen(false);
    const connected = keyStatus?.[key]?.connected;
    if (!connected) {
      onRequireSetup(key);
      return;
    }
    onChange(key);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-hover text-sm font-medium"
      >
        <span className={`w-2 h-2 rounded-full ${current.dotColor}`} />
        {current.label}
        <ChevronDown size={15} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-64 bg-[#2a2a2a] border border-surface-border rounded-xl shadow-xl py-1.5 z-50">
          {Object.entries(PROVIDER_META).map(([key, meta]) => {
            const connected = keyStatus?.[key]?.connected;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-surface-hover text-left"
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  {meta.label}
                  {!connected && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Lock size={11} /> add key
                    </span>
                  )}
                </span>
                {provider === key && connected && (
                  <Check size={15} className="text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
