import { Toaster } from 'sonner'

export function AppToaster() {
    return (
        <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
                style: {
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                },
            }}
        />
    )
}
