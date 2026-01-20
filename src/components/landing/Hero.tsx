"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { Suspense } from "react";

// ... (AnimatedSphere function stays same)
function AnimatedSphere() {
    return (
        <Sphere visible args={[1, 64, 64]} scale={2}>
            <MeshDistortMaterial
                color="#8352FD"
                attach="material"
                distort={0.4}
                speed={1.5}
                roughness={0.2}
                metalness={0.8}
            />
        </Sphere>
    );
}

export default function Hero() {

    return (
        <section className="relative w-full h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-500">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-600/20 blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-600/20 blur-[100px]" />
            </div>

            <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-6">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col gap-6"
                >
                    <motion.h1
                        className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        Find What's <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-600">
                            Yours Again.
                        </span>
                    </motion.h1>
                    <motion.p
                        className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-[600px] leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        The next-generation lost and found platform powered by AI. Smart matching, secure verification, and seamless recovery.
                    </motion.p>
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 mt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <Link
                            href="/home"
                            className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 dark:bg-white px-8 text-sm font-medium text-white dark:text-slate-950 shadow-lg shadow-purple-900/10 transition-all hover:scale-105 hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                        <Link
                            href="/about"
                            className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-transparent px-8 text-sm font-medium text-slate-900 dark:text-white shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Learn More
                        </Link>
                    </motion.div>
                </motion.div>


                {/* 3D Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-[400px] w-full lg:h-[600px] relative cursor-grab active:cursor-grabbing"
                >
                    <Suspense fallback={null}>
                        <Canvas className="w-full h-full">
                            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                            <ambientLight intensity={1} />
                            <directionalLight position={[3, 2, 1]} intensity={2} />
                            <AnimatedSphere />
                        </Canvas>
                    </Suspense>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-400 dark:text-slate-500"
            >
                <ChevronDown className="w-8 h-8" />
            </motion.div>
        </section>
    );
}
