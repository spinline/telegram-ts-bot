import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Wifi, User, Headset } from "lucide-react"
import { useTelegram } from "@/hooks/useTelegram"

function WelcomeScreen({
    onAccountClick,
    onSupportClick
}: {
    onAccountClick?: () => void
    onSupportClick?: () => void
}) {
    const { haptic } = useTelegram()

    const handleAccountClick = () => {
        haptic('light')
        onAccountClick?.()
    }

    const handleSupportClick = () => {
        haptic('light')
        onSupportClick?.()
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 to-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md space-y-8">
                {/* Hero Section */}
                <div className="text-center space-y-4 animate-slide-in">
                    <div className="mx-auto w-24 h-24 bg-teal-600/20 rounded-3xl flex items-center justify-center mb-6 ring-4 ring-teal-600/10">
                        <Shield className="w-12 h-12 text-teal-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">AuronVPN</h1>
                    <p className="text-slate-400 text-lg">Güvenli ve Hızlı Bağlantı</p>

                    <div className="pt-2">
                        <Badge variant="outline" className="border-teal-500/50 text-teal-400 px-4 py-1">
                            <Wifi className="w-3 h-3 mr-2" />
                            Çevrimiçi
                        </Badge>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="grid gap-4 w-full pt-8 animate-scale-in">
                    <Card
                        className="bg-slate-900/50 border-teal-800/30 hover:bg-slate-800/50 transition-all cursor-pointer group backdrop-blur"
                        onClick={handleAccountClick}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-teal-900/30 group-hover:bg-teal-900/50 transition-colors">
                                <User className="w-6 h-6 text-teal-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-white">Hesabım</h3>
                                <p className="text-slate-400 text-sm">Abonelik ve cihaz yönetimi</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="bg-slate-900/50 border-teal-800/30 hover:bg-slate-800/50 transition-all cursor-pointer group backdrop-blur"
                        onClick={handleSupportClick}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-teal-900/30 group-hover:bg-teal-900/50 transition-colors">
                                <Headset className="w-6 h-6 text-teal-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-white">Destek</h3>
                                <p className="text-slate-400 text-sm">Yardım merkezine ulaşın</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default WelcomeScreen
