import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./i18n";
import "./index.css";

const shouldRegisterServiceWorker = import.meta.env.PROD && "serviceWorker" in navigator;

if (shouldRegisterServiceWorker) {
  registerSW({ immediate: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      navigator.serviceWorker.getRegistration().then((registration) => {
        registration?.update();
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
