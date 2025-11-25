"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Zap, Globe, ArrowRight, Loader2 } from "lucide-react"
import { useTelegram } from "@/hooks/useTelegram"
import { login } from "@/actions/auth"
import { toast } from "sonner"

export default function WelcomeScreen() {
    const { webApp, haptic } = useTelegram()
    const [isAuthenticating, setIsAuthenticating] = useState(false)

    useEffect(() => {
        if (webApp && webApp.initData && !isAuthenticating) {
            handleLogin(webApp.initData)
        }
    }, [webApp, isAuthenticating])

    const handleLogin = async (initData: string) => {
        setIsAuthenticating(true)
        try {
            await login(initData)
        } catch (error) {
            console.error("Login failed:", error)
            toast.error("Giriş yapılamadı")
            setIsAuthenticating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* Logo/Icon */}
                <div className="mx-auto w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center mb-8 ring-1 ring-teal-500/30 shadow-[0_0_30px_-5px_rgba(20,184,166,0.3)]">
                    <Shield className="w-12 h-12 text-teal-400" />
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Secure<span className="text-teal-400">VPN</span>
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Hızlı, güvenli ve sınırsız internet erişimi için en iyi çözüm.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 py-8">
                    <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-400" />
                            <span className="text-sm font-medium text-slate-200">Yüksek Hız</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                            <Globe className="w-6 h-6 text-blue-400" />
                            <span className="text-sm font-medium text-slate-200">Global Erişim</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Button */}
                <div className="space-y-4">
                    <Button
                        size="lg"
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold h-14 text-lg shadow-lg shadow-teal-900/20 transition-all hover:scale-[1.02]"
                        onClick={() => {
                            haptic('medium')
                            if (webApp?.initData) {
                                handleLogin(webApp.initData)
                            } else {
                                toast.error("Telegram verisi bulunamadı")
                            }
                        }}
                        disabled={isAuthenticating}
                    >
                        {isAuthenticating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Giriş Yapılıyor...
                            </>
                        ) : (
                            <>
                                Başla
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-slate-500">
                        Devam ederek Kullanım Koşulları&apos;nı kabul etmiş olursunuz.
                    </p>
                </div>
            </div>
        </div>
    )
}
