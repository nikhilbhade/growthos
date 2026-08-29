import { createContext, useContext } from "react";

export interface DashboardCtx {
  demo: boolean;
  setDemo: (v: boolean) => void;
  navigate: (hash: string) => void;
}

export const DashboardContext = createContext<DashboardCtx>({
  demo: true,
  setDemo: () => {},
  navigate: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}
