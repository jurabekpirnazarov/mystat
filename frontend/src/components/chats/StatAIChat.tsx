import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Phone } from "lucide-react";
import { askAssistant, type AssistantReply } from "../../api/support";
import ChatFrame, { Bubble } from "./ChatFrame";
import { nowTime } from "../../utils/format";

interface Turn {
  mine: boolean;
  time: string;
  text?: string;
  reply?: AssistantReply;
}

const SUGGESTIONS = ["Tarif qanday tanlanadi?", "Shartnoma qanday tuziladi?", "Xizmat narxlari qanday belgilanadi?"];

interface Props {
  onClose: () => void;
  onOperator: () => void;
}

/** "Stat AI": FAQ va xizmatlar katalogi bo'yicha javob beradi (tashqi LLM yo'q). Tarix faqat shu sessiyada. U-11. */
export default function StatAIChat({ onClose, onOperator }: Props) {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question) return;
    setMessage("");
    setTurns((t) => [...t, { mine: true, text: question, time: nowTime() }]);
    setBusy(true);
    try {
      const reply = await askAssistant(question);
      setTurns((t) => [...t, { mine: false, reply, time: nowTime() }]);
    } catch {
      setTurns((t) => [...t, { mine: false, text: "Kechirasiz, hozir javob bera olmayman. Keyinroq urinib ko'ring.", time: nowTime() }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChatFrame
      title="Stat AI"
      badge="BETA"
      icon={MessageSquare}
      onClose={onClose}
      value={message}
      onChange={setMessage}
      onSend={() => send(message)}
      placeholder="Savolingizni yozing…"
      disabled={busy}
      scrollKey={turns.length}
      footer={<p className="px-4 pb-1 text-[11px] text-gray-500 dark:text-gray-400">Yordamchi ko'p so'raladigan savollar asosida javob beradi.</p>}
    >
      <Bubble mine={false}>
        <p>Salom 👋 Sizga qanday yordam bera olaman?</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-blue-400">
              {s}
            </button>
          ))}
        </div>
      </Bubble>

      {turns.map((t, i) =>
        t.mine || t.text ? (
          <Bubble key={i} mine={t.mine} time={t.time}><p>{t.text}</p></Bubble>
        ) : t.reply && t.reply.found ? (
          <Bubble key={i} mine={false} time={t.time}>
            {t.reply.answers.map((a, j) => (
              <div key={a.id} className={j ? "mt-3 pt-3 border-t border-gray-200 dark:border-gray-600" : ""}>
                <p className="font-medium">{a.question}</p>
                <p className="mt-1 whitespace-pre-line">{a.answer.length > 400 ? `${a.answer.slice(0, 400)}…` : a.answer}</p>
              </div>
            ))}
            {t.reply.links.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {t.reply.links.map((l) => (
                  <Link key={l.url} to={l.url} onClick={onClose} className="text-blue-600 dark:text-blue-300 underline">{l.title}</Link>
                ))}
              </div>
            )}
          </Bubble>
        ) : (
          <Bubble key={i} mine={false} time={t.time}>
            <p>Bu savol bo'yicha tayyor javob topmadim.</p>
            <button type="button" onClick={onOperator} className="mt-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-300 underline">
              <Phone className="w-3.5 h-3.5" /> Operator bilan bog'lanish
            </button>
          </Bubble>
        )
      )}
      {busy && <Bubble mine={false}><p className="animate-pulse">…</p></Bubble>}
    </ChatFrame>
  );
}
