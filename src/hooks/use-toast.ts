// This file is a compatibility layer to match shadcn/ui's toast patterns
// It re-exports sonner's toast function so existing code using useToast() works

import { toast } from "sonner";

// Re-export toast for direct usage
export { toast };

// Provide a useToast hook for compatibility with existing code patterns
export const useToast = () => {
    return {
        toast,
    };
};
