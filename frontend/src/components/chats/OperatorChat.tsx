import { useCallback, useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchSupportThread, postSupportMessage, startSupportThread, type SupportThread } from "../../api/support";
import ChatFrame, { Bubble } from "./ChatFrame";

const STORAGE_KEY = "support_thread";
const POLL_MS = 15_000;

function loadSaved(): { id: number; token?: string } | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

/** Operator bilan chat: xabar murojaat sifatida bazaga yoziladi, javob 15 soniyada bir tekshiriladi. U-12. */
export default function OperatorChat({ onClose }: { onClose: () => void }) {
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(loadSaved);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!saved) return;
    try {
      setThread(await fetchSupportThread(saved.id, saved.token));
    } catch {
      // eskirgan murojaat — yangisini boshlash mumkin
      localStorage.removeItem(STORAGE_KEY);
      setSaved(null);
      setThread(null);
    }
  }, [saved]);

  useEffect(() => {
    refresh();
    if (!saved) return;
    const t = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(t);
  }, [refresh, saved]);

  const needContact = !isAuthenticated && !saved;

  const send = async () => {
    const text = message.trim();
    if (!text) return;
    if (needContact && (!name.trim() || phone.replace(/\D/g, "").length < 9)) {
      setError("Ism va telefon raqamingizni kiriting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (saved) {
        setThread(await postSupportMessage(saved.id, text, saved.token));
      } else {
        const started = await startSupportThread({ text, name: name.trim() || undefined, phone_number: phone.replace(/\D/g, "").slice(0, 13) || undefined });
        const ref = { id: started.id, token: started.token };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ref));
        setSaved(ref);
        setThread(started);
      }
      setMessage("");
    } catch {
      setError("Xabarni yuborib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white";

  return (
    <ChatFrame
      title="Operator"
      icon={Phone}
      onClose={onClose}
      value={message}
      onChange={setMessage}
      onSend={send}
      placeholder="Xabar yozing…"
      disabled={busy}
      scrollKey={thread?.messages.length}
      footer={
        <>
          {needContact && (
            <div className="px-3 pt-2 grid grid-cols-2 gap-2">
              <input aria-label="Ismingiz" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              <input aria-label="Telefon" placeholder="+998 …" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
          )}
          {error && <p role="alert" className="px-4 pt-1 text-xs text-red-600">{error}</p>}
        </>
      }
    >
      <Bubble mine={false}>
        <p>Assalomu alaykum! Savolingizni yozing — operatorlarimiz ish vaqtida javob beradi.</p>
      </Bubble>
      {thread?.messages.map((m, i) => (
        <Bubble key={i} mine={!m.from_operator} time={time(m.created_at)}>
          <p className="whitespace-pre-line">{m.text}</p>
        </Bubble>
      ))}
      {thread && thread.messages.every((m) => !m.from_operator) && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">Xabaringiz qabul qilindi. Javob shu oynada paydo bo'ladi.</p>
      )}
    </ChatFrame>
  );
}
