"use client";

import Hero from "./Hero";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import Image from "next/image";
import Lenis from "lenis";
import { BrainCircuit, ShieldCheck, Eye, Wand2 } from "lucide-react";

function FeatureSection({ feature, index }: { feature: any; index: number }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0]);

    return (
        <motion.div
            ref={ref}
            style={{ opacity }}
            className={`min-h-[80vh] flex items-center justify-center sticky top-0 ${index % 2 === 0 ? "bg-slate-50 dark:bg-slate-900" : "bg-white dark:bg-slate-950"} transition-colors`}
        >
            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                <motion.div style={{ y }} className={`order-2 ${index % 2 === 0 ? "md:order-1" : "md:order-2"}`}>
                    <div className={`w-20 h-20 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-2xl`}>
                        <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                        {feature.title}
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        {feature.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                        <span className="w-12 h-[1px] bg-slate-400" />
                        {feature.tag}
                    </div>
                </motion.div>

                <div className={`relative h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl ${index % 2 === 0 ? "md:order-2" : "md:order-1"}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 dark:opacity-40`} />
                    <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            </div>
        </motion.div>
    );
}

export default function LandingPage() {
    const { scrollYProgress } = useScroll();
    const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

    useEffect(() => {
        const lenis = new Lenis();
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        return () => {
            lenis.destroy();
        };
    }, []);

    const features = [
        {
            title: "Smart Matching AI",
            description: "Our advanced vector search algorithms instantly connect lost items with found reports based on semantic similarity, not just keywords.",
            color: "bg-blue-600",
            gradient: "from-blue-500 to-indigo-600",
            icon: Wand2,
            tag: "POWERED BY GEMINI",
            image: "/landing1.png"
        },
        {
            title: "Secure Verification",
            description: "Prove ownership securely without revealing sensitive info. Our AI generates dynamic security questions based on hidden item details.",
            color: "bg-purple-600",
            gradient: "from-purple-500 to-pink-600",
            icon: ShieldCheck,
            tag: "ANTI-FRAUD PROTECTION",
            image: "/landing2.png"
        },
        {
            title: "Accessible Intelligence",
            description: "Built from the ground up for inclusivity. High contrast modes, screen reader optimizations, and clear visual hierarchies for everyone.",
            color: "bg-teal-600",
            gradient: "from-teal-500 to-emerald-600",
            icon: Eye,
            tag: "WCAG 2.1 COMPLIANT",
            image: "/image3.png"
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50">
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 origin-left z-50"
                style={{ scaleX }}
            />

            <Hero />

            <div className="relative z-10">
                {features.map((feature, index) => (
                    <FeatureSection key={index} feature={feature} index={index} />
                ))}
            </div>

            <section className="min-h-[50vh] flex items-center justify-center bg-slate-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        Ready to find what's yours?
                    </h2>
                    <p className="text-slate-400 mb-8 text-xl">
                        Join the community of verified owners and finders.
                    </p>
                </div>
            </section>
        </div>
    );
}