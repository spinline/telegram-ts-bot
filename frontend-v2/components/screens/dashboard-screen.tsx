"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, ShoppingCart, Settings, Headset, User } from "lucide-react"
import { useTelegram } from "@/hooks/useTelegram"
import { useRouter } from "next/navigation"

export default function DashboardScreen() {
    const { haptic } = useTelegram()
    const router = useRouter()

    const handleNavigation = (path: string) => {
        haptic('light')
        router.push(path)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-md w-full space-y-8">
                {/* Logo/Icon */}
                <div className="mx-auto w-32 h-32 bg-teal-500/10 rounded-full flex items-center justify-center mb-8 ring-1 ring-teal-500/30 shadow-[0_0_40px_-5px_rgba(20,184,166,0.4)] relative">
                    <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-pulse" />
                    <Shield className="w-16 h-16 text-teal-400 relative z-10" />
                </div>

                {/* Title */}
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-4xl font-bold text-white">
                        Aeron<span className="text-teal-400">VPN</span>
                    </h1>
                    <p className="text-slate-400">
                        Güvenli ve hızlı internet erişimi
                    </p>
                </div>

                {/* Main Action Buttons */}
                <div className="space-y-4">
                    {/* Buy Subscription */}
                    <Card
                        className="bg-gradient-to-br from-teal-600 to-teal-700 border-teal-500 cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-teal-900/30"
                        onClick={() => handleNavigation('/buy')}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur">
                                <ShoppingCart className="h-7 w-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Abonelik Satın Al
                                </h3>
                                <p className="text-sm text-teal-100">
                                    Premium planları inceleyin
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Setup/Installation */}
                    <Card
                        className="bg-slate-900/50 border-teal-800/30 backdrop-blur cursor-pointer hover:bg-slate-900/70 hover:scale-[1.02] transition-all duration-300"
                        onClick={() => handleNavigation('/account')}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-teal-500/10 flex items-center justify-center ring-1 ring-teal-500/30">
                                <Settings className="h-7 w-7 text-teal-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Kurulum
                                </h3>
                                <p className="text-sm text-slate-400">
                                    VPN yapılandırma ve kurulum
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account and Support - Side by Side */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* My Account */}
                        <Card
                            className="bg-slate-900/50 border-teal-800/30 backdrop-blur cursor-pointer hover:bg-slate-900/70 hover:scale-[1.02] transition-all duration-300"
                            onClick={() => handleNavigation('/account')}
                        >
                            <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                                <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center ring-1 ring-teal-500/30">
                                    <User className="h-6 w-6 text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        Hesabım
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Hesap bilgileri
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Support */}
                        <Card
                            className="bg-slate-900/50 border-teal-800/30 backdrop-blur cursor-pointer hover:bg-slate-900/70 hover:scale-[1.02] transition-all duration-300"
                            onClick={() => handleNavigation('/support')}
                        >
                            <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                                <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center ring-1 ring-teal-500/30">
                                    <Headset className="h-6 w-6 text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        Destek
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Teknik destek
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center mt-8">
                    <p className="text-xs text-slate-500">
                        Sınırsız bant genişliği • 50+ sunucu • 7/24 destek
                    </p>
                </div>
            </div>
        </div>
    )
}
