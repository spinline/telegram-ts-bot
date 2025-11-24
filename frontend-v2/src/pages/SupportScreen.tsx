import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, MessageCircle, Clock } from "lucide-react"
import { ticketService } from "@/services/api"
import { TicketListSkeleton } from "@/components/skeletons/TicketListSkeleton"
import { toast } from "sonner"
import { useTelegram } from "@/hooks/useTelegram"

interface Ticket {
    id: number
    title: string
    status: "OPEN" | "ANSWERED" | "CLOSED"
    createdAt: string
    lastMessage?: string
}

function SupportScreen({ onBack, onTicketClick }: {
    onBack: () => void
    onTicketClick: (id: number) => void
}) {
    const [showNewTicket, setShowNewTicket] = useState(false)
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const { haptic } = useTelegram()

    const queryClient = useQueryClient()

    const { data: tickets, isLoading } = useQuery({
        queryKey: ['tickets'],
        queryFn: ticketService.getTickets
    })

    const createMutation = useMutation({
        mutationFn: ticketService.createTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] })
            setShowNewTicket(false)
            setTitle("")
            setMessage("")
            toast.success("Destek talebi oluşturuldu")
        },
        onError: (error: any) => {
            console.error('Ticket creation error:', error)
            const errorMessage = error.response?.data?.error || error.response?.data?.message || "Talep oluşturulurken bir hata oluştu"
            toast.error(errorMessage)
        }
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-blue-600"
            case "ANSWERED": return "bg-green-600"
            case "CLOSED": return "bg-slate-600"
            default: return "bg-slate-600"
        }
    }

    const handleCreateTicket = () => {
        if (!title || !message) return
        haptic('medium')
        console.log('Creating ticket with:', { title, message })
        createMutation.mutate({ title, message })
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 p-6 animate-fade-in">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/10">
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
                    <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur animate-scale-in">
                        <CardHeader>
                            <CardTitle className="text-white">Yeni Destek Talebi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-300 mb-2 block">Konu</label>
                                <Input
                                    placeholder="Örn: Bağlantı sorunu"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-slate-800/50 border-slate-700 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-300 mb-2 block">Mesajınız</label>
                                <Textarea
                                    placeholder="Sorununuzu buraya yazın..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="bg-slate-800/50 border-slate-700 text-white min-h-[120px]"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                                    onClick={handleCreateTicket}
                                    disabled={!title || !message || createMutation.isPending}
                                >
                                    {createMutation.isPending ? "Gönderiliyor..." : "Gönder"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNewTicket(false)}
                                    className="border-slate-700 text-white hover:bg-slate-800"
                                >
                                    İptal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tickets List */}
                {isLoading ? (
                    <TicketListSkeleton />
                ) : (
                    <div className="space-y-3">
                        {tickets?.map((ticket: Ticket) => (
                            <Card
                                key={ticket.id}
                                className="bg-slate-900/50 border-teal-800/30 backdrop-blur cursor-pointer hover:bg-slate-900/70 transition-all hover:scale-[1.01]"
                                onClick={() => onTicketClick(ticket.id)}
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
                        {tickets?.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Henüz destek talebiniz yok</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SupportScreen
