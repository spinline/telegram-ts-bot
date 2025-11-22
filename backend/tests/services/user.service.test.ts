import { userService } from '../../src/services/user.service';
import { getAllUsers } from '../../src/api';

// Mock the API module
jest.mock('../../src/api');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return users from API', async () => {
      const mockUsers = [
        { username: 'user1', status: 'ACTIVE', usedTrafficBytes: 1024 },
        { username: 'user2', status: 'LIMITED', usedTrafficBytes: 2048 },
      ];

      (getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getUsers(1, 10);

      expect(result).toEqual(mockUsers);
      expect(getAllUsers).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getStatistics', () => {
    it('should calculate correct statistics', async () => {
      const mockUsers = [
        {
          username: 'user1',
          status: 'ACTIVE',
          usedTrafficBytes: '1073741824' // 1 GB
        },
        {
          username: 'user2',
          status: 'LIMITED',
          usedTrafficBytes: '2147483648' // 2 GB
        },
        {
          username: 'user3',
          status: 'EXPIRED',
          usedTrafficBytes: '1073741824' // 1 GB
        },
      ];

      (getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const stats = await userService.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.limited).toBe(1);
      expect(stats.expired).toBe(1);
      expect(stats.totalTraffic).toBe(4294967296); // 4 GB
    });

    it('should handle empty user list', async () => {
      (getAllUsers as jest.Mock).mockResolvedValue([]);

      const stats = await userService.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.totalTraffic).toBe(0);
      expect(stats.avgTraffic).toBe(0);
    });
  });

  describe('formatUserDetails', () => {
    it('should format user details correctly', () => {
      const mockUser = {
        username: 'testuser',
        uuid: '123-456-789',
        status: 'ACTIVE',
        tag: 'PREMIUM',
        usedTrafficBytes: 1073741824, // 1 GB
        trafficLimitBytes: 10737418240, // 10 GB
        expireAt: new Date('2025-12-31').toISOString(),
        telegramId: '123456789',
        email: 'test@example.com',
        createdAt: new Date('2025-01-01').toISOString(),
      };

      const result = userService.formatUserDetails(mockUser);

      expect(result).toContain('testuser');
      expect(result).toContain('ACTIVE');
      expect(result).toContain('PREMIUM');
      expect(result).toContain('1.00 GB');
      expect(result).toContain('10 GB');
    });
  });
});

