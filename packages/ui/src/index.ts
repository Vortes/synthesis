// Utilities
export { cn } from "./lib/utils";

// UI components
export { Button, buttonVariants, type ButtonProps } from "./components/ui/button";
export { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./components/ui/dialog";

// Shell components
export { AppShell } from "./components/shell/app-shell";
export { Sidebar } from "./components/shell/sidebar";
export { Topbar } from "./components/shell/topbar";
export { SearchGateway } from "./components/shell/search-gateway";

// Library components
export { CaptureCard, type CaptureCardData } from "./components/library/capture-card";
export { CaptureGrid, type CaptureGroup } from "./components/library/capture-grid";
export { CaptureDetailModal } from "./components/library/capture-detail-modal";
