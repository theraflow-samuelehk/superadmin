import { ChatMessage } from "@/hooks/useChat";
import { useLocalization } from "@/hooks/useLocalization";
import { useTranslation } from "react-i18next";
import { FileText, Mic, Check, CheckCheck, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";

interface Props {
  message: ChatMessage;
  isMine: boolean;
}

// Cache for signed URLs
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function getSignedFileUrl(path: string): Promise<string> {
  if (path.startsWith("http")) return path;
  
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(path, 3600);
  
  if (error || !data?.signedUrl) return "";
  
  signedUrlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + 3500 * 1000 });
  return data.signedUrl;
}

function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    if (!path) return;
    getSignedFileUrl(path).then(setUrl);
  }, [path]);
  return url;
}

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoad = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoad);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition shrink-0">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        {/* Waveform bars */}
        <div className="flex items-end gap-[2px] h-[20px]">
          {Array.from({ length: 28 }).map((_, i) => {
            const h = [8, 14, 10, 18, 12, 20, 8, 16, 14, 10, 18, 8, 20, 12, 14, 16, 10, 18, 8, 14, 20, 12, 10, 16, 8, 18, 14, 10][i];
            const filled = (i / 28) * 100 < progress;
            return (
              <div
                key={i}
                className={cn("w-[2px] rounded-full transition-colors", filled ? "bg-current opacity-80" : "bg-current opacity-30")}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
        <span className="text-[10px] opacity-70">{formatDur(playing ? currentTime : duration)}</span>
      </div>
    </div>
  );
}

export function ChatMessageBubble({ message, isMine }: Props) {
  const { formatTime } = useLocalization();
  const { t } = useTranslation();
  const fileUrl = useSignedUrl(message.file_url);

  const renderContent = () => {
    switch (message.message_type) {
      case "image":
        return (
          <div className="max-w-[240px] -m-1 mb-0">
            <img
              src={fileUrl}
              alt={message.file_name || "image"}
              className="rounded-lg max-w-full cursor-pointer"
              onClick={() => fileUrl && window.open(fileUrl, "_blank")}
            />
            {message.content && <p className="mt-1 mx-1 text-sm">{message.content}</p>}
          </div>
        );
      case "audio":
        return <AudioPlayer src={fileUrl} />;
      case "file":
        return (
          <a
            href={fileUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/20 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm truncate max-w-[160px]">{message.file_name || t("chat.file")}</span>
          </a>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div className={cn("flex mb-1", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[75%] rounded-lg px-2.5 py-1.5 shadow-sm",
          isMine
            ? "wa-bubble-mine rounded-tr-none"
            : "wa-bubble-other rounded-tl-none"
        )}
      >
        {renderContent()}
        <div className={cn("flex items-center justify-end gap-1 -mb-0.5 mt-0.5")}>
          <span className={cn("text-[10px]", isMine ? "text-[hsl(var(--wa-mine-time))]" : "text-muted-foreground")}>
            {formatTime(message.created_at)}
          </span>
          {isMine && (
            message.is_read
              ? <CheckCheck className="h-3.5 w-3.5 text-primary" />
              : <Check className="h-3.5 w-3.5 opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
}
