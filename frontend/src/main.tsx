import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingPage } from "@/pages/LandingPage";
import "@/styles/global.css";
import "@/styles/landing.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("The application root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
);
