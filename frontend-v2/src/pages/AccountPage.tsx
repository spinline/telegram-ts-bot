import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Wifi, Calendar, HardDrive } from "lucide-react"
import { ArrowLeft } from "lucide-react"

interface AccountData {
    username: string
    subscriptionType: string
    expiryDate: string
    devicesUsed: number
    devicesLimit: number
    isOnline: boolean
}

function AccountPage({ onBack }: { onBack: () => void }) {
    const [account] = useState<AccountData>({
        username: "Demo User",
        subscriptionType: "Premium",
        expiryDate: "2025-12-31",
        devicesUsed: 2,
        devicesLimit: 5,
        isOnline: true
    })

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 p-6">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Hesabım</h1>
                </div>

                {/* Profile Card */}
                <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-teal-600/20 flex items-center justify-center">
                                <User className="h-8 w-8 text-teal-400" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-white">{account.username}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={account.isOnline ? "default" : "secondary"} className="bg-teal-600">
                                        <Wifi className="h-3 w-3 mr-1" />
                                        {account.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Subscription Card */}
                <Card className="bg-slate-900/50 border-teal-800/30 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-teal-400" />
                            Abonelik Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Plan</span>
                            <Badge className="bg-teal-600">{account.subscriptionType}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Son Kullanma
                            </span>
                            <span className="text-white font-medium">{account.expiryDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 flex items-center gap-2">
                                <HardDrive className="h-4 w-4" />
                                Cihazlar
                            </span>
                            <span className="text-white font-medium">
                                {account.devicesUsed} / {account.devicesLimit}
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                            <div
                                className="bg-teal-600 h-2 rounded-full transition-all"
                                style={{ width: `${(account.devicesUsed / account.devicesLimit) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-3">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                        Aboneliği Yenile
                    </Button>
                    <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800">
                        Cihazları Yönet
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default AccountPage
