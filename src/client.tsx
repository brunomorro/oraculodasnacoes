import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

// Pure SPA entry — bypasses TanStack Start's SSR hydrateRoot/hydrateStart
// so the app works as a static client-side bundle on Vercel.
const router = getRouter();

startTransition(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
