import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Manage lost and found items",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
