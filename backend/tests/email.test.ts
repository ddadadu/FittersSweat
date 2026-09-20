import { EmailService } from '../src/services/email.service';

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('falls back to mock logging when in test env without RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY;
    process.env.NODE_ENV = 'test';

    const result = await EmailService.sendVerificationEmail({
      to: 'runner@test.com',
      code: '123456',
    });

    expect(result).toBe(true);
  });

  it('calls Resend HTTPS REST API when RESEND_API_KEY is provided', async () => {
    process.env.RESEND_API_KEY = 're_test_mock_key_123';
    
    // Mock global fetch
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_msg_12345' }),
    });
    global.fetch = mockFetch as any;

    const result = await EmailService.sendVerificationEmail({
      to: 'runner@test.com',
      code: '987654',
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_mock_key_123',
        }),
      })
    );
  });

  it('falls back gracefully when Resend API returns error', async () => {
    process.env.RESEND_API_KEY = 're_test_failing_key';
    process.env.NODE_ENV = 'test';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid API key' }),
    });
    global.fetch = mockFetch as any;

    const result = await EmailService.sendVerificationEmail({
      to: 'runner@test.com',
      code: '112233',
    });

    // In test env, falls back to mock logger and returns true
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
