"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { en } from "@/locales/en";
import { es } from "@/locales/es";
import { hi } from "@/locales/hi";

type Language = "en" | "es" | "hi";
type Translations = typeof en;

const translations: Record<Language, Translations> = {
    en,
    es,
    hi,
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    const t = (key: keyof Translations) => {
        return translations[language][key] || translations["en"][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
