"use client"

import { useState, useRef, useEffect, useOptimistic, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, User, Headset, MoreVertical, Loader2 } from "lucide-react"
import { sendMessage } from "@/actions/support"
import { useTelegram } from "@/hooks/useTelegram"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Message {
    id: number
    text: string
    isUser: boolean
    timestamp: string
}

interface Ticket {
    id: number
    title: string
    status: string
    messages: Message[]
}

export default function TicketDetailScreen({ ticket, ticketId }: { ticket: Ticket | null, ticketId: number }) {
    const { haptic, showBackButton, hideBackButton } = useTelegram()
    const router = useRouter()
    const [message, setMessage] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isPending, startTransition] = useTransition()

    // Optimistic UI
    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        ticket?.messages || [],
        (state, newMessage: Message) => [...state, newMessage]
    )

    useEffect(() => {
        showBackButton(() => router.push('/support'))
        return () => hideBackButton()
    }, [showBackButton, hideBackButton, router])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [optimisticMessages])

    const handleSend = async () => {
        if (!message.trim()) return

        const newMessage = {
            id: Date.now(),
            text: message,
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        haptic('light')
        startTransition(async () => {
            addOptimisticMessage(newMessage)
            setMessage("")

            const result = await sendMessage(ticketId, newMessage.text)

            if (result.error) {
                toast.error(result.error)
                // In a real app, we might want to remove the optimistic message or show an error state on it
            }
        })
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                Ticket not found
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/50 backdrop-blur bg-slate-900/30">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/support')} className="text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-white font-semibold">#{ticket.id} {ticket.title}</h2>
                            <Badge className="bg-blue-600 mt-1">{ticket.status}</Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden relative">
                <div
                    ref={scrollRef}
                    className="absolute inset-0 overflow-y-auto p-4 space-y-4 pb-20"
                >
                    <div className="max-w-md mx-auto space-y-4">
                        {optimisticMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}
                            >
                                {!msg.isUser && (
                                    <div className="mt-1">
                                        <Headset className="h-5 w-5 text-teal-400" />
                                    </div>
                                )}
                                <Card className={`max-w-[85%] p-3 ${msg.isUser
                                    ? 'bg-teal-600 border-teal-600'
                                    : 'bg-slate-800/50 border-slate-700'
                                    }`}>
                                    <p className="text-white text-sm">{msg.text}</p>
                                    <span className="text-xs text-slate-300 opacity-70 mt-1 block">
                                        {msg.timestamp}
                                    </span>
                                </Card>
                                {msg.isUser && (
                                    <div className="mt-1">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800/50 backdrop-blur bg-slate-900/30">
                <div className="max-w-md mx-auto flex gap-2">
                    <Textarea
                        placeholder="Yanıtınız..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        className="bg-slate-800/50 border-slate-700 text-white resize-none"
                        rows={1}
                    />
                    <Button
                        size="icon"
                        className="bg-teal-600 hover:bg-teal-700 shrink-0 transition-colors"
                        onClick={handleSend}
                        disabled={!message.trim() || isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
