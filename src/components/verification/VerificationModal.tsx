"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationModalProps {
    listingId: Id<"listings">;
    listingTitle: string;
}

type Question = {
    question: string;
    options: string[];
    correctIndex: number;
};

export default function VerificationModal({ listingId, listingTitle }: VerificationModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"idle" | "generating" | "questioning" | "verifying" | "success" | "failure">("idle");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ question: string; answer: string; isCorrect: boolean }[]>([]);
    const [error, setError] = useState("");

    const generateQuestions = useAction(api.verification.generateQuestions);
    const submitClaim = useMutation(api.verification.submitVerificationClaim);

    const handleStart = async () => {
        setStep("generating");
        setError("");
        try {
            const result = await generateQuestions({ listingId });
            setQuestions(result.questions);
            setStep("questioning");
        } catch (err) {
            console.error(err);
            setError("Failed to generate questions. Please ensuring AI services are configured.");
            setStep("idle");
        }
    };

    const handleAnswer = async (optionIndex: number) => {
        const currentQ = questions[currentQuestionIndex];
        const newAnswers = [
            ...answers,
            {
                question: currentQ.question,
                answer: currentQ.options[optionIndex],
                isCorrect: optionIndex === currentQ.correctIndex,
            },
        ];
        setAnswers(newAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Finished
            setStep("verifying");
            const score = newAnswers.filter((a) => a.isCorrect).length;

            try {
                await submitClaim({
                    listingId,
                    answers: newAnswers.map((a) => ({ question: a.question, answer: a.answer })),
                    score,
                });

                if (score >= 2) { // 2 out of 3 pass
                    setStep("success");
                } else {
                    setStep("failure");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to submit claim.");
                setStep("idle");
            }
        }
    };

    const reset = () => {
        setIsOpen(false);
        setTimeout(() => {
            setStep("idle");
            setQuestions([]);
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setError("");
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
            <DialogTrigger asChild>
                <Button
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setIsOpen(true)}
                >
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Verify Ownership with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-950 text-slate-50 border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {step === "success" ? (
                            <ShieldCheck className="w-6 h-6 text-green-500" />
                        ) : (
                            <BrainCircuit className="w-6 h-6 text-purple-400" />
                        )}
                        Item Verification
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {step === "idle" && "Prove this item is yours by answering specific details only the owner would know."}
                        {step === "generating" && "AI is analyzing the item details to generate security questions..."}
                        {step === "questioning" && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                        {step === "verifying" && "Verifying your answers..."}
                        {step === "success" && "Verification Successful!"}
                        {step === "failure" && "Verification Failed."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <AnimatePresence mode="wait">
                        {step === "idle" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
                                    <p>
                                        Our AI will generate <strong>3 unique questions</strong> based on the hidden and visible details of <strong>"{listingTitle}"</strong>.
                                    </p>
                                    <p className="mt-2 text-slate-400 text-xs">
                                        * You need to answer at least 2 correctly to claim this item.
                                    </p>
                                </div>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-200 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                                <Button onClick={handleStart} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                    Start Verification
                                </Button>
                            </motion.div>
                        )}

                        {step === "generating" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-8"
                            >
                                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                                <p className="text-slate-400 animate-pulse">Generating questions...</p>
                            </motion.div>
                        )}

                        {step === "questioning" && questions.length > 0 && (
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    {questions[currentQuestionIndex].question}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {questions[currentQuestionIndex].options.map((option, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            className="justify-start h-auto py-3 px-4 text-left whitespace-normal border-slate-700 hover:bg-slate-800 hover:text-white text-slate-300"
                                            onClick={() => handleAnswer(idx)}
                                        >
                                            <span className="mr-3 text-slate-500 font-mono text-xs">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {option}
                                        </Button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === "success" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ownership Verified</h3>
                                    <p className="text-slate-400">
                                        You have successfully verified that this item is yours. The finder has been notified.
                                    </p>
                                </div>
                                <Button onClick={reset} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                                    Continue to Chat
                                </Button>
                            </motion.div>
                        )}

                        {step === "failure" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
                                    <p className="text-slate-400">
                                        Your answers didn't match the item's details closely enough.
                                    </p>
                                </div>
                                <Button onClick={reset} variant="outline" className="mt-4 w-full border-slate-700 hover:bg-slate-800">
                                    Close
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
