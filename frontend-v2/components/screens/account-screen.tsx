"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Wifi, Calendar, HardDrive } from "lucide-react"
import { useTelegram } from "@/hooks/useTelegram"

interface AccountData {
    username: string
    telegramId: string
    tag: string
    status: string
    expireAt: string
    usedTrafficBytes: number
    trafficLimitBytes: number
    hwid: { total: number }
    hwidDeviceLimit: number
    onlineAt: string | null
}

export default function AccountScreen({ initialAccount }: { initialAccount: AccountData | null }) {
    const { haptic } = useTelegram()

    // API'den veri alınamazsa hiçbir şey gösterme veya hata göster
    const account = initialAccount

    const displayAccount = account && {
        ...account,
        subscriptionType: account.status === 'ACTIVE' ? 'Premium' : 'Free',
        expiryDate: account.expireAt ? new Date(account.expireAt).toLocaleDateString('tr-TR') : "-",
        usedTraffic: (account.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(2),
        trafficLimit: (account.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0),
        devicesUsed: account.hwid.total,
        devicesLimit: account.hwidDeviceLimit,
        isOnline: !!account.onlineAt
    }



    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 p-6 animate-in fade-in duration-500">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Hesabım</h1>
                </div>

                {!initialAccount && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-200 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Hesap bilgisi alınamadı. Lütfen tekrar deneyin.
                    </div>
                )}

                {/* Profile Card */}
                {displayAccount && (
                    <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-teal-600/20 flex items-center justify-center ring-1 ring-teal-500/30">
                                    <User className="h-8 w-8 text-teal-400" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-white">{displayAccount.username}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                                        <span>ID: {displayAccount.telegramId}</span>
                                        {displayAccount.tag !== "-" && (
                                            <Badge variant="outline" className="border-teal-500/30 text-teal-400 text-xs">
                                                {displayAccount.tag}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant={displayAccount.isOnline ? "default" : "secondary"} className={displayAccount.isOnline ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-700"}>
                                            <Wifi className="h-3 w-3 mr-1" />
                                            {displayAccount.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                )}

                {/* Subscription Card */}
                {displayAccount && (
                    <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Shield className="h-5 w-5 text-teal-400" />
                                Abonelik Bilgileri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Plan</span>
                                <Badge className="bg-teal-600 hover:bg-teal-700">{displayAccount.subscriptionType}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Son Kullanma
                                </span>
                                <span className="text-white font-medium">{displayAccount.expiryDate}</span>
                            </div>

                            {/* Bandwidth Usage */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <Wifi className="h-4 w-4" />
                                        Kullanım
                                    </span>
                                    <span className="text-white font-medium">
                                        {displayAccount.usedTraffic} GB / {displayAccount.trafficLimit} GB
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-teal-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min((Number(displayAccount.usedTraffic) / Number(displayAccount.trafficLimit)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Device Usage */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <HardDrive className="h-4 w-4" />
                                        Cihazlar
                                    </span>
                                    <span className="text-white font-medium">
                                        {displayAccount.devicesUsed} / {displayAccount.devicesLimit}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-teal-600 h-2 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(displayAccount.devicesUsed / displayAccount.devicesLimit) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white transition-all hover:scale-[1.02] shadow-lg shadow-teal-900/20"
                        onClick={() => {
                            haptic('light')
                            // Handle subscription renewal
                        }}
                    >
                        Aboneliği Yenile
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full border-slate-700 text-white hover:bg-slate-800 transition-all hover:scale-[1.02]"
                        onClick={() => {
                            haptic('light')
                            // Handle device management
                        }}
                    >
                        Cihazları Yönet
                    </Button>
                </div>
            </div>
        </div>
    )
}
