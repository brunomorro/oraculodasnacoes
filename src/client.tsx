import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

// Use createRoot (not hydrateRoot) so the app works as a pure client-side SPA
// without needing matching SSR content in index.html.
startTransition(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
