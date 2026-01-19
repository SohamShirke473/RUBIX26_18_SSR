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

    if (conversation === undefined) {
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

    return (
        <div className="border rounded-2xl bg-card flex flex-col h-[600px] shadow-sm">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Send className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Listing Chat</h3>
                        <p className="text-xs text-muted-foreground">{conversation.participantIds.length} Participants</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages === undefined ? (
                        <div className="flex justify-center py-4">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-2 opacity-60">
                            <UserCircle2 className="w-12 h-12 text-muted-foreground" />
                            <p className="text-sm font-medium">No messages yet</p>
                            <p className="text-xs text-muted-foreground">Be the first to say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = user?.id === msg.senderClerkUserId;
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isMe
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted text-muted-foreground rounded-bl-none"
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="p-4 border-t bg-background rounded-b-2xl">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={user ? "Type a message..." : "Sign in to chat"}
                        disabled={!user}
                        className="flex-1"
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
