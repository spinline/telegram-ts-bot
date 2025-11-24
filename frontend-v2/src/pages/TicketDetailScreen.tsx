import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, User, Headset, MoreVertical } from "lucide-react"
import { ticketService } from "@/services/api"
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton"
import { toast } from "sonner"
import { useTelegram } from "@/hooks/useTelegram"

interface Message {
    id: number
    text: string
    isUser: boolean
    timestamp: string
}

interface TicketDetailProps {
    ticketId: number
    onBack: () => void
}

function TicketDetailScreen({ ticketId, onBack }: TicketDetailProps) {
    const [replyText, setReplyText] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()
    const { haptic } = useTelegram()

    const { data: ticket, isLoading } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => ticketService.getTicket(ticketId)
    })

    // Mock messages for now since API might not return them yet
    // In real implementation, messages would come from ticket.messages
    const messages: Message[] = ticket?.messages || [
        { id: 1, text: "Test mesajım", isUser: true, timestamp: "19:55" },
        { id: 2, text: "Test mesajım 2", isUser: true, timestamp: "20:00" },
        { id: 3, text: "Merhaba", isUser: false, timestamp: "20:01" },
        { id: 4, text: "Ok", isUser: true, timestamp: "20:01" }
    ]

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const sendMessageMutation = useMutation({
        mutationFn: (text: string) => ticketService.sendMessage(ticketId, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
            toast.success("Mesaj gönderildi")
            setReplyText("")
        },
        onError: () => {
            toast.error("Mesaj gönderilemedi")
        }
    })

    const handleSend = () => {
        if (!replyText.trim()) return
        haptic('light')
        sendMessageMutation.mutate(replyText)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 flex flex-col">
                <div className="p-4 border-b border-slate-800/50 backdrop-blur bg-slate-900/30">
                    <div className="max-w-md mx-auto flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-10 w-32 bg-slate-800/50 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex-1">
                    <ChatSkeleton />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/50 backdrop-blur bg-slate-900/30">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-white font-semibold">#{ticketId} {ticket?.title || 'Loading...'}</h2>
                            <Badge className="bg-blue-600 mt-1">{ticket?.status || 'OPEN'}</Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div ref={scrollRef} className="max-w-md mx-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'} animate-scale-in`}
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
                </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800/50 backdrop-blur bg-slate-900/30">
                <div className="max-w-md mx-auto flex gap-2">
                    <Textarea
                        placeholder="Yanıtınız..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
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
                        disabled={!replyText.trim() || sendMessageMutation.isPending}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default TicketDetailScreen
