import { useState } from "react";
import { LifeBuoy, MessageSquare, Phone, X } from "lucide-react";
import StatAIChat from "./chats/StatAIChat";
import OperatorChat from "./chats/OperatorChat";

type Panel = "menu" | "ai" | "operator" | null;

const FloatingSupport = () => {
  const [panel, setPanel] = useState<Panel>(null);

  const fab = "p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300";

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {panel === "menu" && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPanel("ai")} className={fab} aria-label="Stat AI yordamchisi" title="Stat AI">
              <MessageSquare className="w-6 h-6" />
            </button>
            <button type="button" onClick={() => setPanel("operator")} className={fab} aria-label="Operator bilan chat" title="Operator">
              <Phone className="w-6 h-6" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setPanel((p) => (p ? null : "menu"))}
          className={fab}
          aria-label={panel ? "Yordamni yopish" : "Yordam"}
          aria-expanded={!!panel}
        >
          {panel ? <X className="w-6 h-6" /> : <LifeBuoy className="w-6 h-6" />}
        </button>
      </div>

      {panel === "ai" && <StatAIChat onClose={() => setPanel("menu")} onOperator={() => setPanel("operator")} />}
      {panel === "operator" && <OperatorChat onClose={() => setPanel("menu")} />}
    </>
  );
};

export default FloatingSupport;
