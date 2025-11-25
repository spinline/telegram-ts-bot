
// Session yönetimi Telegram WebApp tabanlı auth ile gereksizdir.
// Bu fonksiyonlar sadece uyumluluk için bırakılmıştır.
export async function getSession() {
    console.warn('getSession: Telegram WebApp tabanlı auth kullanılıyor, session yok.')
    return null
}
export async function createSession() {
    console.warn('createSession: Telegram WebApp tabanlı auth kullanılıyor, session yok.')
}
export async function deleteSession() {
    console.warn('deleteSession: Telegram WebApp tabanlı auth kullanılıyor, session yok.')
}
