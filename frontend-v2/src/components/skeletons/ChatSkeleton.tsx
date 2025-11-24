import { Skeleton } from "@/components/ui/skeleton"

export function ChatSkeleton() {
    return (
        <div className="max-w-md mx-auto p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                >
                    {i % 2 !== 0 && (
                        <Skeleton className="h-8 w-8 rounded-full mt-1" />
                    )}
                    <div className={`space-y-1 ${i % 2 === 0 ? 'items-end flex flex-col' : ''}`}>
                        <Skeleton className={`h-12 w-48 rounded-xl ${i % 2 === 0 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} />
                        <Skeleton className="h-3 w-12" />
                    </div>
                    {i % 2 === 0 && (
                        <Skeleton className="h-8 w-8 rounded-full mt-1" />
                    )}
                </div>
            ))}
        </div>
    )
}
