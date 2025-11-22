import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SupportSettingsService {
  
  async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await prisma.supportSettings.findUnique({ where: { key } });
    return setting ? setting.value : defaultValue;
  }

  async setSetting(key: string, value: string) {
    return await prisma.supportSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  async isSupportEnabled() {
    return (await this.getSetting('support_enabled', 'true')) === 'true';
  }
}

export const supportSettingsService = new SupportSettingsService();
