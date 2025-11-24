import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, MessageCircle, Clock } from "lucide-react"

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
    const [tickets] = useState<Ticket[]>([
        {
            id: 1,
            title: "Test Ticket",
            status: "OPEN",
            createdAt: "2025-11-24",
            lastMessage: "Merhaba, yardıma ihtiyacım var"
        },
        {
            id: 2,
            title: "Bağlantı Sorunu",
            status: "ANSWERED",
            createdAt: "2025-11-23",
            lastMessage: "Sorun çözüldü, teşekkürler!"
        }
    ])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-blue-600"
            case "ANSWERED": return "bg-green-600"
            case "CLOSED": return "bg-slate-600"
            default: return "bg-slate-600"
        }
    }

    const handleCreateTicket = () => {
        // TODO: Implement ticket creation
        console.log("Creating ticket:", { title, message })
        setShowNewTicket(false)
        setTitle("")
        setMessage("")
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 p-6">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-2xl font-bold text-white">Destek</h1>
                    </div>
                    {!showNewTicket && (
                        <Button
                            size="icon"
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() => setShowNewTicket(true)}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* New Ticket Form */}
                {showNewTicket && (
                    <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
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
                                    disabled={!title || !message}
                                >
                                    Gönder
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
                <div className="space-y-3">
                    {tickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="bg-slate-900/50 border-teal-800/30 backdrop-blur cursor-pointer hover:bg-slate-900/70 transition-colors"
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
                                                {ticket.createdAt}
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
                </div>
            </div>
        </div>
    )
}

export default SupportScreen
