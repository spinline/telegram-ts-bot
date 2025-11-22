"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByTelegramId = getUserByTelegramId;
exports.getUserByUsername = getUserByUsername;
exports.getAllUsers = getAllUsers;
exports.getInternalSquads = getInternalSquads;
exports.getUserHwidDevices = getUserHwidDevices;
exports.deleteUserHwidDevice = deleteUserHwidDevice;
exports.createUser = createUser;
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;
if (!API_BASE_URL || !API_TOKEN) {
    console.error("API_BASE_URL or API_TOKEN environment variables not set.");
    process.exit(1);
}
const apiClient = axios_1.default.create({
    baseURL: API_BASE_URL,
    headers: {
        common: {
            Authorization: `Bearer ${API_TOKEN}`,
        },
    },
});
function getUserByTelegramId(telegramId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield apiClient.get(`/api/users/by-telegram-id/${telegramId}`);
            // API, bir dizi döndürür. Dizi boş değilse, kullanıcı var demektir.
            const data = response.data;
            return data.response.length > 0 ? data.response[0] : null;
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // Kullanıcı bulunamadı, bu yeni kayıt için beklenen bir durum.
            }
            console.error(`Failed to get user by Telegram ID ${telegramId}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || "Kullanıcı bilgisi alınamadı.");
        }
    });
}
function getUserByUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield apiClient.get(`/api/users/by-username/${username}`);
            const data = response.data;
            return data.response;
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // Kullanıcı bulunamadı
            }
            console.error(`Failed to get user ${username}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || "Kullanıcı bilgisi alınamadı.");
        }
    });
}
function getAllUsers() {
    return __awaiter(this, arguments, void 0, function* (page = 1, take = 100) {
        var _a, _b, _c;
        try {
            const response = yield apiClient.get('/api/users', {
                params: { page, take }
            });
            const data = response.data;
            console.log('getAllUsers response:', JSON.stringify(data).substring(0, 200));
            // RemnaWave API response format: { response: [...] } veya { data: [...] }
            if (data.response && Array.isArray(data.response)) {
                return data.response;
            }
            else if (data.data && Array.isArray(data.data)) {
                return data.data;
            }
            else if (Array.isArray(data)) {
                return data;
            }
            console.error('Unexpected API response format:', data);
            return [];
        }
        catch (error) {
            console.error('Failed to get users:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || "Kullanıcı listesi alınamadı.");
        }
    });
}
function getInternalSquads() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield apiClient.get("/api/internal-squads");
            const data = response.data;
            return data.response.internalSquads;
        }
        catch (error) {
            console.error("Failed to get internal squads:", error);
            return [];
        }
    });
}
function getUserHwidDevices(userUuid) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const response = yield apiClient.get(`/api/hwid/devices/${userUuid}`);
            const data = response.data;
            return data.response;
        }
        catch (error) {
            if (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                return { total: 0, devices: [] };
            }
            console.error(`Failed to get HWID devices for user ${userUuid}:`, ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
            return { total: 0, devices: [] };
        }
    });
}
function deleteUserHwidDevice(userUuid, hwid) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield apiClient.post("/api/hwid/devices/delete", {
                userUuid,
                hwid,
            });
            const data = response.data;
            return data.response;
        }
        catch (error) {
            console.error(`Failed to delete HWID device for user ${userUuid}:`, ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error(((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || "Cihaz silinemedi.");
        }
    });
}
function createUser(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const { password } = userData, rest = __rest(userData, ["password"]); // Şifreyi kaldır
            console.log("Creating user with data:", JSON.stringify(rest, null, 2));
            const response = yield apiClient.post("/api/users", rest);
            const data = response.data;
            return data.response;
        }
        catch (error) {
            const { password } = userData, rest = __rest(userData, ["password"]);
            const status = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status;
            const data = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data;
            console.error("Failed to create user:", data || error.message);
            console.error("Request data was:", JSON.stringify(rest, null, 2));
            const message = (data === null || data === void 0 ? void 0 : data.message) || error.message || "Kullanıcı oluşturulamadı.";
            const code = (data === null || data === void 0 ? void 0 : data.errorCode) || status;
            throw new Error(code ? `${message} [${code}]` : message);
        }
    });
}
