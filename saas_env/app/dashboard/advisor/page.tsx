"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Loader2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Message {
    role: "user" | "bot";
    content: string;
    suggestions?: string[];
    video_link?: string;
    video_label?: string;
}

export default function AdvisorPage() {
    // Vehicle State
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [mileage, setMileage] = useState("");

    // Chat State
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", content: "Hello! I'm your AI Maintenance Advisor. Enter your vehicle details and let me help you estimate costs and diagnose issues." }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent, overrideQuery?: string) => {
        e.preventDefault();
        const userMsg = overrideQuery || query;
        if (!userMsg.trim() || !make || !model) return;

        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setQuery("");
        setIsLoading(true);

        // Prepare history for backend (Keep last 50 messages for deep context)
        const history = messages.slice(-50).map(m => ({
            role: m.role,
            content: m.content
        }));

        try {
            const res = await fetch("/api/advisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: userMsg,
                    make,
                    model,
                    year: parseInt(year) || 2020,
                    mileage: parseInt(mileage) || 50000,
                    history: history
                })
            });

            if (!res.ok) throw new Error("Failed to get response");

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: "bot",
                content: data.response,
                suggestions: data.suggestions,
                video_link: data.video_link,
                video_label: data.video_label
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "bot", content: "Sorry, I couldn't connect to the AI brain. Please make sure the Python backend is running." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Sparky ⚡
                </h1>
                <p className="text-xl text-muted-foreground mt-2">Your AI Mechanic Buddy. Powered by RAG.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[350px_1fr] flex-1 min-h-0">
                {/* Vehicle Details Panel */}
                <Card className="border-2 border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Vehicle Specs</CardTitle>
                        <CardDescription className="text-base">Target Vehicle for Diagnosis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-lg">Make</Label>
                            <Input className="h-12 text-lg" placeholder="e.g. Ford" value={make} onChange={e => setMake(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-lg">Model</Label>
                            <Input className="h-12 text-lg" placeholder="e.g. Fiesta" value={model} onChange={e => setModel(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-lg">Year</Label>
                                <Input className="h-12 text-lg" type="number" placeholder="2018" value={year} onChange={e => setYear(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-lg">Mileage</Label>
                                <Input className="h-12 text-lg" type="number" placeholder="45k" value={mileage} onChange={e => setMileage(e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Chat Interface */}
                <Card className="flex flex-col flex-1 min-h-0 border-2 border-primary/20 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                    <CardHeader className="py-6 border-b bg-muted/20">
                        <CardTitle className="text-lg font-medium flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-primary" />
                            </div>
                            <span>Live Diagnostics Channel</span>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'bot' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                                        }`}>
                                        {msg.role === 'bot' ? <Bot className="h-6 w-6" /> : <User className="h-6 w-6" />}
                                    </div>

                                    <div className={`rounded-2xl p-5 text-base shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted rounded-tl-none border border-border prose prose-lg dark:prose-invert max-w-none'
                                        }`}>
                                        {msg.role === 'bot' ? (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>

                                {/* Video Link Button */}
                                {msg.video_link && (
                                    <div className="ml-14 mb-2 animate-in zoom-in duration-300">
                                        <a
                                            href={msg.video_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all hover:scale-105 shadow-md text-base font-bold"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                            {msg.video_label || "Watch Repair Video"}
                                        </a>
                                    </div>
                                )}

                                {/* Suggestions Chips */}
                                {msg.suggestions && msg.suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 ml-14 mt-1">
                                        {msg.suggestions.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={(e) => handleSubmit(e, suggestion)}
                                                className="flex items-center gap-2 text-sm bg-background border border-border hover:border-primary hover:text-primary hover:bg-primary/5 px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-sm"
                                            >
                                                <Sparkles className="h-3 w-3" />
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Bot className="h-6 w-6 text-primary" />
                                </div>
                                <div className="bg-muted rounded-2xl p-5 rounded-tl-none">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        <span className="text-base">Analyzing diagnostics...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </CardContent>

                    <CardFooter className="p-6 border-t bg-muted/20">
                        <form onSubmit={(e) => handleSubmit(e)} className="flex w-full gap-4 relative">
                            <Textarea
                                placeholder="Describe the issue (e.g., 'Clunking noise from rear wheel')..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="min-h-[60px] resize-none text-lg p-4 rounded-xl border-2 focus-visible:ring-primary shadow-sm pr-16"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <Button type="submit" size="icon" className="h-[60px] w-[60px] rounded-xl absolute right-0 top-0 shadow-md hover:scale-105 transition-transform" disabled={isLoading || !query.trim()}>
                                <Send className="h-6 w-6" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
