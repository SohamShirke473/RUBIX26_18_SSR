"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle, BrainCircuit, Lock, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationModalProps {
    listingId: Id<"listings">;
    listingTitle: string;
}

export default function VerificationModal({ listingId, listingTitle }: VerificationModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Fetch current claim status
    const claim = useQuery(api.verification.getClaimStatus, { listingId });

    // Mutations
    const initiateClaim = useMutation(api.verification.initiateClaim);
    const submitAnswers = useMutation(api.verification.submitVerificationAnswers);

    // Local state for the quiz
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ question: string; answerIndex: number }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Reset local state when dialog closes or claim changes
    useEffect(() => {
        if (!isOpen) {
            // reset quiz state
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setError("");
        }
    }, [isOpen]);

    const handleInitiate = async () => {
        try {
            await initiateClaim({ listingId });
            // The UI will update automatically via reactivity
        } catch (err) {
            console.error(err);
            setError("Failed to send request.");
        }
    };

    const handleAnswer = async (optionIndex: number) => {
        if (!claim || !claim.generatedQuestions) return;

        const currentQ = claim.generatedQuestions[currentQuestionIndex];
        const newAnswers = [
            ...answers,
            {
                question: currentQ.question,
                answerIndex: optionIndex,
            },
        ];
        setAnswers(newAnswers);

        if (currentQuestionIndex < claim.generatedQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Submit
            setIsSubmitting(true);
            try {
                await submitAnswers({
                    claimId: claim._id,
                    answers: newAnswers,
                });
                // Status will change to approved/rejected, UI updates automatically
            } catch (err) {
                console.error(err);
                setError("Failed to submit answers.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Render Logic based on Claim State

    // 1. No Claim Found -> Show Request Button
    if (claim === undefined) return null; // Loading

    if (claim === null) {
        return (
            <div className="flex flex-col gap-2">
                <Button
                    onClick={handleInitiate}
                    className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-full"
                >
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Request AI Verification
                </Button>
                <p className="text-xs text-muted-foreground">
                    Request the finder to verify your ownership via AI-generated questions.
                </p>
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }

    // 2. Pending -> Show Waiting State
    if (claim.status === "pending") {
        return (
            <div className="p-4 rounded-xl border bg-muted/50 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500" />
                <h3 className="font-medium">Request Sent</h3>
                <p className="text-sm text-muted-foreground">
                    Waiting for the finder to approve your verification request.
                </p>
            </div>
        );
    }

    // 2.5 Generating -> Show AI Loading State
    if (claim.status === "generating") {
        return (
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/10 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                <h3 className="font-medium text-purple-900 dark:text-purple-300">Generating Questions</h3>
                <p className="text-sm text-purple-800 dark:text-purple-400">
                    The finder has approved your request. AI is now generating your security questions...
                </p>
            </div>
        );
    }

    // 3. Approved -> Show Success
    if (claim.status === "approved") {
        return (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900 text-center space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-green-600 dark:text-green-400" />
                <h3 className="font-medium text-green-900 dark:text-green-300">Verification Successful!</h3>
                <p className="text-sm text-green-800 dark:text-green-400">
                    You have verified ownership. The finder has been notified to share contact details.
                </p>
                {/* Potentially show contact info here if available */}
            </div>
        );
    }

    // 4. Rejected/Failed -> Show Failure
    if (claim.status === "rejected" || claim.status === "failed") {
        return (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 text-center space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-red-600 dark:text-red-400" />
                <h3 className="font-medium text-red-900 dark:text-red-300">Verification Failed</h3>
                <p className="text-sm text-red-800 dark:text-red-400">
                    Your answers were incorrect or the request was rejected.
                </p>
            </div>
        );
    }

    // 5. Questions Generated -> Show Questions Modal Trigger & Content
    // This is the only state where the Dialog is fully active for interaction.
    if (claim.status === "questions_generated" && claim.generatedQuestions) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-900 text-center space-y-3 cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setIsOpen(true)}>
                        <BrainCircuit className="w-8 h-8 mx-auto text-purple-600 dark:text-purple-400 animate-pulse" />
                        <div>
                            <h3 className="font-medium text-purple-900 dark:text-purple-300">Verification Ready</h3>
                            <p className="text-xs text-purple-800 dark:text-purple-400">Click to answer security questions generated by AI.</p>
                        </div>
                        <Button size="sm" className="bg-purple-600 text-white w-full">Start Verification</Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-slate-950 text-slate-50 border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <BrainCircuit className="w-6 h-6 text-purple-400" />
                            Item Verification
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Question {currentQuestionIndex + 1} of {claim.generatedQuestions.length}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    {claim.generatedQuestions[currentQuestionIndex].question}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {claim.generatedQuestions[currentQuestionIndex].options.map((option, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            disabled={isSubmitting}
                                            className="justify-start h-auto py-3 px-4 text-left whitespace-normal border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white"
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
                        </AnimatePresence>
                        {isSubmitting && (
                            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center rounded-lg">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return null;
}
