/**
 * Session Service Tests
 * Tests for Phase 4 - Session Management
 */

describe('SessionService', () => {
  let sessionService;
  let mockDataService;

  beforeEach(() => {
    mockDataService = {
      createSession: jest.fn(),
      getSessionsByUserId: jest.fn(),
      getSessionById: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      getAllSessions: jest.fn(),
    };

    const { SessionService } = require('../services/sessionService');
    sessionService = new SessionService(mockDataService);
  });

  describe('Session Creation', () => {
    it('should create new session with device info', async () => {
      mockDataService.getSessionsByUserId.mockResolvedValue([]);
      mockDataService.createSession.mockResolvedValue(1);

      const sessionId = await sessionService.createSession(1, {
        deviceName: 'My Device',
        deviceType: 'web',
        userAgent: 'Mozilla/5.0 Chrome/96.0',
        ipAddress: '127.0.0.1',
      });

      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(64); // 32 bytes as hex
      expect(mockDataService.createSession).toHaveBeenCalled();
    });
  });

  describe('Session Validation', () => {
    it('should validate active session', async () => {
      const sessionId = 'test-session-id';
      mockDataService.getSessionById.mockResolvedValue({
        session_id: sessionId,
        user_id: 1,
        is_active: 1,
        created_at: new Date().toISOString(),
      });

      const isValid = await sessionService.isSessionValid(sessionId);

      expect(isValid).toBe(true);
    });

    it('should reject expired session', async () => {
      const sessionId = 'test-session-id';
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      mockDataService.getSessionById.mockResolvedValue({
        session_id: sessionId,
        user_id: 1,
        is_active: 1,
        created_at: oldDate.toISOString(),
      });
      mockDataService.updateSession.mockResolvedValue(true);

      const isValid = await sessionService.isSessionValid(sessionId);

      expect(isValid).toBe(false);
      expect(mockDataService.updateSession).toHaveBeenCalled();
    });

    it('should reject revoked session', async () => {
      const sessionId = 'test-session-id';
      mockDataService.getSessionById.mockResolvedValue({
        session_id: sessionId,
        user_id: 1,
        is_active: 0,
        created_at: new Date().toISOString(),
      });

      const isValid = await sessionService.isSessionValid(sessionId);

      expect(isValid).toBe(false);
    });
  });

  describe('Concurrent Session Management', () => {
    it('should enforce max session limit', async () => {
      const sessions = Array(5).fill(null).map((_, i) => ({
        session_id: `session-${i + 1}`,
        user_id: 1,
        is_active: 1,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        last_activity: new Date(Date.now() - i * 1000).toISOString(),
      }));
      mockDataService.getSessionsByUserId.mockResolvedValue(sessions);
      mockDataService.createSession.mockResolvedValue(1);
      mockDataService.updateSession.mockResolvedValue(true);

      await sessionService.createSession(1, {});

      // Should revoke oldest session when limit exceeded
      expect(mockDataService.updateSession).toHaveBeenCalled();
    });
  });

  describe('Logout Everywhere', () => {
    it('should revoke all user sessions', async () => {
      const sessions = [
        { session_id: 'session-1', user_id: 1, is_active: 1 },
        { session_id: 'session-2', user_id: 1, is_active: 1 },
        { session_id: 'session-3', user_id: 1, is_active: 1 },
      ];
      mockDataService.getSessionsByUserId.mockResolvedValue(sessions);
      mockDataService.updateSession.mockResolvedValue(true);

      await sessionService.revokeAllSessions(1);

      expect(mockDataService.updateSession).toHaveBeenCalledTimes(3);
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect suspicious login from new location', async () => {
      const sessions = [
        {
          session_id: 'session-1',
          user_id: 1,
          is_active: 1,
          location: 'US',
        },
        {
          session_id: 'session-2',
          user_id: 1,
          is_active: 1,
          location: 'UK',
        },
        {
          session_id: 'session-3',
          user_id: 1,
          is_active: 1,
          location: 'DE',
        },
      ];
      mockDataService.getSessionsByUserId.mockResolvedValue(sessions);

      const alerts = await sessionService.detectSuspiciousActivity(1);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('type');
      expect(alerts[0]).toHaveProperty('message');
    });
  });
});
