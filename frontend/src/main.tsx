import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
);

// FQ-11: o'rnatiladigan ilova (PWA). Faqat production build'da — dev'da HMR bilan to'qnashmasligi uchun.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
