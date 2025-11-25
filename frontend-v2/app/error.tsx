'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-red-500/10 p-4 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Bir şeyler yanlış gitti!</h2>
            <p className="text-slate-400 mb-6 max-w-xs">
                Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
            </p>
            <Button
                onClick={reset}
                className="bg-teal-600 hover:bg-teal-700 text-white"
            >
                Tekrar Dene
            </Button>
        </div>
    )
}
