import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: JWTPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key)
}

export async function decrypt(input: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    })
    return payload
}

export async function getSession() {
    const session = (await cookies()).get('session')?.value
    if (!session) return null
    try {
        return await decrypt(session)
    } catch {
        return null
    }
}

export async function createSession(user: unknown, initData: string) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ user: user as JWTPayload, initData, expires })

        ; (await cookies()).set('session', session, {
            expires,
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
        })
}

export async function deleteSession() {
    ; (await cookies()).delete('session')
}
