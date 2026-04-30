import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Props {
  onRecorded: (blob: Blob) => void;
  onRecordingChange?: (recording: boolean) => void;
}

export function AudioRecorder({ onRecorded, onRecordingChange }: Props) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    onRecordingChange?.(recording);
  }, [recording, onRecordingChange]);

  useEffect(() => {
    if (recording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        if (chunks.current.length > 0 && !discardRef.current) {
          onRecorded(blob);
        }
        stream.getTracks().forEach((t) => t.stop());
        discardRef.current = false;
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
    } catch {
      console.error("Microphone access denied");
    }
  };

  const discardRef = useRef(false);

  const send = () => {
    discardRef.current = false;
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const discard = () => {
    discardRef.current = true;
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in">
        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={discard}>
          <Trash2 className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse shrink-0" />
          <span className="text-sm font-mono text-destructive">{formatTimer(elapsed)}</span>
        </div>
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          onClick={send}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
      onClick={start}
      title={t("chat.recordAudio")}
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
