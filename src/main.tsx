// Critical preload: inject <link rel="preload"> for hero + shortcut images BEFORE React
import "./lib/criticalPreload";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent SW auto-reload issues in iframes and preview hosts
import { isInIframe, isPreviewHost } from "./lib/frameDetection";

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
