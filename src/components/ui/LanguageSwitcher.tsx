"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const languages = {
        en: "English",
        es: "Español",
        hi: "हिंदी",
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="fixed top-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                    <Globe className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {(Object.keys(languages) as Array<keyof typeof languages>).map((lang) => (
                    <DropdownMenuItem
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={language === lang ? "bg-slate-100 font-bold" : ""}
                    >
                        {languages[lang]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
