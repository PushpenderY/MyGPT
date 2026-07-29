import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, AlertTriangle } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { API_URL } from "../api/axios.js";

const fileOrigin = API_URL.replace(/\/api\/v1\/?$/, "");

const AttachmentPreview = ({ attachment }) => {
  const url = `${fileOrigin}${attachment.url}`;
  if (attachment.type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={attachment.originalName}
          className="max-w-[220px] max-h-[220px] rounded-xl border border-surface-border object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 bg-surface-input border border-surface-border rounded-xl px-3 py-2 max-w-[220px] hover:bg-surface-hover"
    >
      <FileText size={20} className="text-red-400 flex-shrink-0" />
      <span className="text-xs truncate">{attachment.originalName}</span>
    </a>
  );
};

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const isUser = message.role === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[820px] w-full ${isUser ? "justify-end" : ""}`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-semibold">M</span>
          </div>
        )}

        <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start w-full"}`}>
          {message.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {message.attachments.map((att) => (
                <AttachmentPreview key={att._id} attachment={att} />
              ))}
            </div>
          )}

          {message.content && (
            <div
              className={
                isUser
                  ? "bg-surface-input rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words max-w-[600px]"
                  : `prose-chat text-[15px] leading-relaxed w-full ${
                      message.isError ? "text-red-400" : "text-gray-100"
                    }`
              }
            >
              {message.isError && (
                <span className="inline-flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={14} /> Error
                </span>
              )}
              {isUser ? (
                message.content
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {isUser && <Avatar user={user} size={28} />}
      </div>
    </div>
  );
};

export default MessageBubble;
