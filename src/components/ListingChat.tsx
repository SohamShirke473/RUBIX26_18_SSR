"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, UserCircle2 } from "lucide-react";

interface ListingChatProps {
    listingId: Id<"listings">;
}

export default function ListingChat({ listingId }: ListingChatProps) {
    const { user } = useUser();
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const conversation = useQuery(api.conversations.getConversation, { listingId });
    const listing = useQuery(api.getListing.getListingById, { id: listingId });
    const claimStatus = useQuery(api.verification.getClaimStatus, { listingId });

    const messages = useQuery(api.conversations.getMessages,
        conversation ? { conversationId: conversation._id } : "skip"
    );

    const sendMessage = useMutation(api.conversations.sendMessage);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversation || !user) return;

        try {
            await sendMessage({
                conversationId: conversation._id,
                content: newMessage,
                senderClerkUserId: user.id,
                senderName: user.fullName || user.firstName || "Anonymous",
            });
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (conversation === undefined || listing === undefined || claimStatus === undefined) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading chat...</div>;
    }

    if (conversation === null) {
        // Fallback for listings created before this feature
        return (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground p-6 border-2 border-dashed rounded-xl">
                <p>Chat is unavailable for this listing.</p>
            </div>
        );
    }

    // Access Control Logic
    const isFounder = user?.id === listing?.clerkUserId;
    const isClaimApproved = claimStatus?.status === "resolved";
    const isLocked = !isFounder && !isClaimApproved;

    if (isLocked) {
        return (
            <div className="border dark:border-slate-700 rounded-2xl bg-card dark:bg-slate-800 flex flex-col h-[600px] shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-primary/10 dark:bg-teal-900/30 p-4 rounded-full mb-4">
                        <UserCircle2 className="w-8 h-8 text-primary dark:text-teal-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Chat Locked</h3>
                    <p className="text-muted-foreground dark:text-slate-400 max-w-xs mb-6">
                        {claimStatus?.status === "pending" || claimStatus?.status === "generating" || claimStatus?.status === "questions_generated"
                            ? "Please complete the verification process to unlock the chat."
                            : "You need to verify your claim to access this chat."}
                    </p>
                    {/* Optionally add a button to trigger verification modal if not already open elsewhere */}
                </div>
                {/* Blurred background content to imply there is a chat behind it */}
                <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between bg-muted/30 dark:bg-slate-700/30 rounded-t-2xl opacity-20">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 dark:bg-teal-900/30 p-2 rounded-full">
                            <Send className="w-4 h-4 text-primary dark:text-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Listing Chat</h3>
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-4 opacity-20">
                    <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center h-full">
                            <p>Messages are hidden</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border dark:border-slate-700 rounded-2xl bg-card dark:bg-slate-800 flex flex-col h-[600px] shadow-sm">
            <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between bg-muted/30 dark:bg-slate-700/30 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 dark:bg-teal-900/30 p-2 rounded-full">
                        <Send className="w-4 h-4 text-primary dark:text-teal-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Listing Chat</h3>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">{conversation.participantIds.length} Participants</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages === undefined ? (
                        <div className="flex justify-center py-4">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-2 opacity-60">
                            <UserCircle2 className="w-12 h-12 text-muted-foreground dark:text-slate-500" />
                            <p className="text-sm font-medium">No messages yet</p>
                            <p className="text-xs text-muted-foreground dark:text-slate-400">Be the first to say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = user?.id === msg.senderClerkUserId;
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                >
                                    {!isMe && msg.senderName && (
                                        <span className="text-[10px] text-muted-foreground dark:text-slate-400 mb-1 ml-2">
                                            {msg.senderName}
                                        </span>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isMe
                                            ? "bg-primary dark:bg-teal-600 text-primary-foreground dark:text-white rounded-br-none"
                                            : "bg-muted dark:bg-slate-700 text-muted-foreground dark:text-slate-200 rounded-bl-none"
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70 dark:text-white/70" : "text-muted-foreground/70 dark:text-slate-400/70"}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="p-4 border-t dark:border-slate-700 bg-background dark:bg-slate-900 rounded-b-2xl">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={user ? "Type a message..." : "Sign in to chat"}
                        disabled={!user}
                        className="flex-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-400"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!user || !newMessage.trim()}
                        size="icon"
                        className="shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
