import type { Metadata } from "next";
import { ReactNode } from "react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Home",
    description: "Welcome to our application",
};

export default function HomeLayout({ children }: { children: ReactNode }) {
    return <>{children}
    {/* <Footer /> */}
    </>;
}