"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-16">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                        Our Mission
                    </h1>
                    <p className="mt-4 text-xl text-slate-500 dark:text-slate-400">
                        Reimaging the lost and found experience with the power of Artificial Intelligence.
                    </p>
                </motion.div>

                {/* Content Section 1: The Problem */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">The Problem</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Losing something valuable is stressful. Traditional lost and found systems are fragmented, outdated, and reliant on luck. Corkboards, disorganized Facebook groups, and physical lost-and-found bins are simply not efficient enough for the modern world.
                        </p>
                    </div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                        {/* Placeholder for illustration */}
                        {/*text color change*/}
                        <div className="text-black dark:text-white font-medium">Broken Systems</div>
                    </div>
                </section>

                {/* Content Section 2: The Solution */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:grid-flow-col-dense">
                    <div className="h-64 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center order-2 md:order-1">
                        {/* Placeholder for illustration */}
                        <div className="text-white font-bold text-2xl">Rubix AI</div>
                    </div>
                    <div className="space-y-4 order-1 md:order-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">The Rubix Solution</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Rubix uses advanced <b>Vector Embeddings</b> and <b>Generative AI</b> to match lost items with found reports based on semantic similarity. It doesn't just look for keywords; it understands what your item is. Coupled with a secure verification system, we ensure that items are returned to their rightful owners safely.
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
}
