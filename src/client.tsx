import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

// Pure SPA: no SSR shellComponent in __root.tsx, so RouterProvider renders
// directly into #root without any <html>/<body> nesting issues.
const router = getRouter();

startTransition(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
