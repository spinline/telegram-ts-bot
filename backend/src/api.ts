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

export async function getAllUsers(page: number = 1, take: number = 100): Promise<{ users: any[], total: number }> {
  try {
    const response = await apiClient.get('/api/users', {
      params: { page, take }
    });
    const data: any = response.data;

    let users: any[] = [];
    let total = 0;

    // RemnaWave API response formats:
    // Format 1: { response: { users: [...], total: X } }
    if (data.response && data.response.users && Array.isArray(data.response.users)) {
      users = data.response.users;
      total = data.response.total || users.length;
    }
    // Format 2: { response: [...] }
    else if (data.response && Array.isArray(data.response)) {
      users = data.response;
      total = users.length;
    }
    // Format 3: { data: [...] }
    else if (data.data && Array.isArray(data.data)) {
      users = data.data;
      total = users.length;
    }
    // Format 4: Direct array
    else if (Array.isArray(data)) {
      users = data;
      total = users.length;
    } else {
      console.error('⚠️ Unexpected API response format:', JSON.stringify(data).substring(0, 100));
    }

    return { users, total };
  } catch (error: any) {
    console.error('❌ Failed to get users:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı listesi alınamadı.");
  }
}

export async function getInternalSquads(): Promise<any[]> {
  try {
    const response = await apiClient.get("/api/internal-squads");
    const data = response.data as any;
    return data.response.internalSquads;
  } catch (error: any) {
    console.error("Failed to get internal squads:", error);
    return [];
  }
}

export async function getUserHwidDevices(userUuid: string): Promise<any> {
  try {
    const response = await apiClient.get(`/api/hwid/devices/${userUuid}`);
    const data = response.data as any;
    return data.response;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { total: 0, devices: [] };
    }
    console.error(`Failed to get HWID devices for user ${userUuid}:`, error?.response?.data || error.message);
    return { total: 0, devices: [] };
  }
}

export async function deleteUserHwidDevice(userUuid: string, hwid: string): Promise<any> {
  try {
    const response = await apiClient.post("/api/hwid/devices/delete", {
      userUuid,
      hwid,
    });
    const data = response.data as any;
    return data.response;
  } catch (error: any) {
    console.error(`Failed to delete HWID device for user ${userUuid}:`, error?.response?.data || error.message);
    throw new Error(error?.response?.data?.message || "Cihaz silinemedi.");
  }
}

export async function createUser(userData: any) {
  try {
    const { password, ...rest } = userData; // Şifreyi kaldır
    console.log("Creating user with data:", JSON.stringify(rest, null, 2));
    const response = await apiClient.post("/api/users", rest);
    const data: any = response.data;
    return data.response;
  } catch (error: any) {
    const { password, ...rest } = userData;
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("Failed to create user:", data || error.message);
    console.error("Request data was:", JSON.stringify(rest, null, 2));
    const message = data?.message || error.message || "Kullanıcı oluşturulamadı.";
    const code = data?.errorCode || status;
    throw new Error(code ? `${message} [${code}]` : message);
  }
}

export async function updateUser(uuid: string, userData: any) {
  try {
    // API expects PATCH /api/users with uuid in body
    const response = await apiClient.patch(`/api/users`, {
      uuid,
      ...userData
    });
    const data: any = response.data;
    return data.response;
  } catch (error: any) {
    console.error(`Failed to update user ${uuid}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı güncellenemedi.");
  }
}

export async function deleteUser(uuid: string) {
  try {
    const response = await apiClient.delete(`/api/users/${uuid}`);
    const data: any = response.data;
    return data.response?.isDeleted;
  } catch (error: any) {
    console.error(`Failed to delete user ${uuid}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı silinemedi.");
  }
}

export async function enableUser(uuid: string) {
  try {
    const response = await apiClient.post(`/api/users/${uuid}/actions/enable`);
    const data: any = response.data;
    return data.response;
  } catch (error: any) {
    console.error(`Failed to enable user ${uuid}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı aktif edilemedi.");
  }
}

export async function disableUser(uuid: string) {
  try {
    const response = await apiClient.post(`/api/users/${uuid}/actions/disable`);
    const data: any = response.data;
    return data.response;
  } catch (error: any) {
    console.error(`Failed to disable user ${uuid}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Kullanıcı devre dışı bırakılamadı.");
  }
}

export async function resetAllUserDevices(userUuid: string) {
  try {
    // 1. Mevcut cihazları çek
    const { devices } = await getUserHwidDevices(userUuid);
    
    if (!devices || devices.length === 0) {
      return { success: true, count: 0 };
    }

    // 2. Hepsini tek tek sil (API toplu silmeyi desteklemiyorsa)
    let deletedCount = 0;
    for (const device of devices) {
      await deleteUserHwidDevice(userUuid, device.hwid);
      deletedCount++;
    }

    return { success: true, count: deletedCount };
  } catch (error: any) {
    console.error(`Failed to reset devices for ${userUuid}:`, error.message);
    throw new Error("Cihazlar sıfırlanırken hata oluştu.");
  }
}
