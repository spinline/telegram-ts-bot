"use client"

import { useState, useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, MessageCircle, Clock, Loader2 } from "lucide-react"
import { createTicket, type ActionState } from "@/actions/support"
import { useTelegram } from "@/hooks/useTelegram"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Ticket {
    id: number
    title: string
    status: "OPEN" | "ANSWERED" | "CLOSED"
    createdAt: string
    lastMessage?: string
}

const initialState: ActionState = {
    error: '',
    success: false
}

export default function SupportScreen({ initialTickets }: { initialTickets: Ticket[] }) {
    const { haptic } = useTelegram()
    const router = useRouter()
    const [showNewTicket, setShowNewTicket] = useState(false)

    // Server Action State
    const [state, formAction, isPending] = useActionState(createTicket, initialState)



    useEffect(() => {
        if (state?.success) {
            setShowNewTicket(false)
            toast.success("Destek talebi oluşturuldu")
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-blue-600"
            case "ANSWERED": return "bg-green-600"
            case "CLOSED": return "bg-slate-600"
            default: return "bg-slate-600"
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 p-6 animate-in fade-in duration-500">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/account')} className="text-white hover:bg-white/10">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-2xl font-bold text-white">Destek</h1>
                    </div>
                    {!showNewTicket && (
                        <Button
                            size="icon"
                            className="bg-teal-600 hover:bg-teal-700 transition-colors"
                            onClick={() => {
                                haptic('light')
                                setShowNewTicket(true)
                            }}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* New Ticket Form */}
                {showNewTicket && (
                    <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur animate-in zoom-in-95 duration-300">
                        <CardHeader>
                            <CardTitle className="text-white">Yeni Destek Talebi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={formAction} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">Konu</label>
                                    <Input
                                        name="title"
                                        placeholder="Örn: Bağlantı sorunu"
                                        className="bg-slate-800/50 border-slate-700 text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">Mesajınız</label>
                                    <Textarea
                                        name="message"
                                        placeholder="Sorununuzu buraya yazın..."
                                        className="bg-slate-800/50 border-slate-700 text-white min-h-[120px]"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Gönderiliyor
                                            </>
                                        ) : "Gönder"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowNewTicket(false)}
                                        className="border-slate-700 text-white hover:bg-slate-800"
                                    >
                                        İptal
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Tickets List */}
                <div className="space-y-3">
                    {initialTickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="bg-slate-900/50 border-teal-800/30 backdrop-blur cursor-pointer hover:bg-slate-900/70 transition-all hover:scale-[1.01]"
                            onClick={() => router.push(`/ticket/${ticket.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-white text-base">
                                            #{ticket.id} {ticket.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className={getStatusColor(ticket.status)}>
                                                {ticket.status}
                                            </Badge>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <MessageCircle className="h-5 w-5 text-slate-400" />
                                </div>
                            </CardHeader>
                            {ticket.lastMessage && (
                                <CardContent className="pt-0">
                                    <p className="text-sm text-slate-400 truncate">{ticket.lastMessage}</p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                    {initialTickets.length === 0 && !showNewTicket && (
                        <div className="text-center py-10 text-slate-400">
                            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>Henüz destek talebiniz yok</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
