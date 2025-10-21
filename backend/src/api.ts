import axios from "axios";
import "dotenv/config";

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

if (!API_BASE_URL || !API_TOKEN) {
  console.error("API_BASE_URL or API_TOKEN environment variables not set.");
  process.exit(1);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    common: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  },
});

export async function getUserByTelegramId(telegramId: number) {
  try {
    const response = await apiClient.get(`/api/users/by-telegram-id/${telegramId}`);
    // API, bir dizi döndürür. Dizi boş değilse, kullanıcı var demektir.
    const data: any = response.data;
    return data.response.length > 0 ? data.response[0] : null;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // Kullanıcı bulunamadı, bu yeni kayıt için beklenen bir durum.
    }
    console.error(`Failed to get user by Telegram ID ${telegramId}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı bilgisi alınamadı.");
  }
}

export async function getUserByUsername(username: string) {
  try {
    const response = await apiClient.get(`/api/users/by-username/${username}`);
    const data: any = response.data;
    return data.response;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // Kullanıcı bulunamadı
    }
    console.error(`Failed to get user ${username}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı bilgisi alınamadı.");
  }
}

export async function getInternalSquads() {
  try {
    const response = await apiClient.get("/api/internal-squads");
    const data: any = response.data;
    return data.response.internalSquads;
  } catch (error) {
    console.error("Failed to get internal squads:", error);
    return [];
  }
}

export async function createUser(userData: any) {
  try {
    const { password, ...rest } = userData; // Şifreyi kaldır
    const response = await apiClient.post("/api/users", rest);
    const data: any = response.data;
    return data.response;
  } catch (error: any) {
    console.error("Failed to create user:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı oluşturulamadı.");
  }
}
