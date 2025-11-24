import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Wifi, HelpCircle } from "lucide-react"

function WelcomeScreen({
    onAccountClick,
    onSupportClick
}: {
    onAccountClick?: () => void
    onSupportClick?: () => void
}) {
    const isOnline = true

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                            <Shield className="h-24 w-24 text-primary relative" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AuronVPN</h1>
                        <p className="text-muted-foreground mt-2">Güvenli ve Hızlı Bağlantı</p>
                    </div>
                    <Badge variant={isOnline ? "default" : "secondary"} className="px-4 py-1">
                        <Wifi className="h-3 w-3 mr-2" />
                        {isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                    </Badge>
                </div>

                {/* Action Cards */}
                <div className="space-y-3">
                    <Card
                        className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-teal-700/30"
                        onClick={onAccountClick}
                    >
                        <CardHeader>
                            <CardTitle className="text-lg">Hesabım</CardTitle>
                            <CardDescription>Abonelik ve cihaz yönetimi</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-teal-700/30"
                        onClick={onSupportClick}
                    >
                        <CardHeader>
                            <CardTitle className="text-lg">
                                <HelpCircle className="inline h-5 w-5 mr-2" />
                                Destek
                            </CardTitle>
                            <CardDescription>Yardım merkezine ulaşın</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <Button variant="outline" size="sm" className="mt-4">
                        v2.0.0 - Modern UI
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default WelcomeScreen
