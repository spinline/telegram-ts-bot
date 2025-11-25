"use client"

import { useBackButton } from "@/hooks/useBackButton"

export default function BackButtonProvider({ children }: { children: React.ReactNode }) {
    useBackButton()
    return <>{children}</>
}
