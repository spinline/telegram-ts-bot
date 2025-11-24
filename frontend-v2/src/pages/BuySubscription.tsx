import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Zap } from "lucide-react"

interface Plan {
    id: number
    duration: string
    price: string
    devices: number
    popular?: boolean
}

function BuySubscription({ onBack }: { onBack: () => void }) {
    const [selectedPlan, setSelectedPlan] = useState<number>(2)

    const plans: Plan[] = [
        { id: 1, duration: "1 Ay", price: "₺99", devices: 3 },
        { id: 2, duration: "3 Ay", price: "₺249", devices: 5, popular: true },
        { id: 3, duration: "6 Ay", price: "₺449", devices: 5 },
        { id: 4, duration: "12 Ay", price: "₺799", devices: 10 }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 p-6">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Abonelik Satın Al</h1>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-2 gap-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`cursor-pointer transition-all ${selectedPlan === plan.id
                                    ? 'bg-teal-600/20 border-teal-500 ring-2 ring-teal-500'
                                    : 'bg-slate-900/50 border-teal-800/30 hover:border-teal-700/50'
                                } backdrop-blur relative`}
                            onClick={() => setSelectedPlan(plan.id)}
                        >
                            {plan.popular && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-yellow-600">
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
                                    <div className="mt-2 flex items-center gap-1 text-teal-400 text-sm">
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
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-lg"
                    onClick={() => console.log("Purchasing plan:", selectedPlan)}
                >
                    Satın Al - {plans.find(p => p.id === selectedPlan)?.price}
                </Button>
            </div>
        </div>
    )
}

export default BuySubscription
