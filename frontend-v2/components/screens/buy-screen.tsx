"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, ArrowLeft, Loader2 } from "lucide-react"
import { useTelegram } from "@/hooks/useTelegram"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Plan {
    id: number
    duration: string
    price: string
    devices: number
    popular?: boolean
}

export default function BuyScreen() {
    const { haptic } = useTelegram()
    const router = useRouter()
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)



    const plans: Plan[] = [
        { id: 1, duration: "1 Ay", price: "₺99", devices: 3 },
        { id: 2, duration: "3 Ay", price: "₺249", devices: 5, popular: true },
        { id: 3, duration: "6 Ay", price: "₺449", devices: 5 },
        { id: 4, duration: "12 Ay", price: "₺799", devices: 10 }
    ]

    const handlePurchase = async () => {
        if (!selectedPlan) return

        haptic('medium')
        setIsProcessing(true)

        // Mock purchase delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsProcessing(false)
        toast.success("Ödeme işlemi başlatıldı (Demo)")
        haptic('success')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 p-6 animate-in fade-in duration-500">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/account')} className="text-white hover:bg-white/10">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Abonelik Satın Al</h1>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-2 gap-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`cursor-pointer transition-all duration-300 ${selectedPlan === plan.id
                                ? 'bg-teal-600/20 border-teal-500 ring-2 ring-teal-500 scale-[1.02]'
                                : 'bg-slate-900/50 border-teal-800/30 hover:border-teal-700/50 hover:bg-slate-900/70'
                                } backdrop-blur relative`}
                            onClick={() => {
                                haptic('selection')
                                setSelectedPlan(plan.id)
                            }}
                        >
                            {plan.popular && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                                    <Badge className="bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-900/20">
                                        <Zap className="h-3 w-3 mr-1" />
                                        Popüler
                                    </Badge>
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white text-lg">{plan.duration}</CardTitle>
                                <CardDescription className="text-slate-300 text-2xl font-bold">
                                    {plan.price}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-slate-400">{plan.devices} Cihaz</p>
                                {selectedPlan === plan.id && (
                                    <div className="mt-2 flex items-center gap-1 text-teal-400 text-sm animate-in zoom-in duration-300">
                                        <Check className="h-4 w-4" />
                                        Seçildi
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Features */}
                <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-white">Paket Özellikleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-slate-300">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-teal-400 shrink-0" />
                                <span>Sınırsız bant genişliği</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-teal-400 shrink-0" />
                                <span>50+ sunucu konumu</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-teal-400 shrink-0" />
                                <span>7/24 teknik destek</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-teal-400 shrink-0" />
                                <span>Otomatik yenileme</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Purchase Button */}
                <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-lg shadow-lg shadow-teal-900/20 transition-all hover:scale-[1.02]"
                    onClick={handlePurchase}
                    disabled={!selectedPlan || isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            İşleniyor...
                        </>
                    ) : (
                        `Satın Al ${selectedPlan ? `- ${plans.find(p => p.id === selectedPlan)?.price}` : ''}`
                    )}
                </Button>
            </div>
        </div>
    )
}
