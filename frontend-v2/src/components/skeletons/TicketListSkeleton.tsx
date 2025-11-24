import { Skeleton } from "@/components/ui/skeleton"

export function TicketListSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
            ))}
        </div>
    )
}
