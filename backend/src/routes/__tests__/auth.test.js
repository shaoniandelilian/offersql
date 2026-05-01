const bcrypt = require('bcryptjs');

jest.mock('../../services/database', () => ({
  findAuthUserByUsername: jest.fn(),
  findAuthUserByEmail: jest.fn(),
  findAuthUserByPhone: jest.fn(),
  findAuthUserById: jest.fn(),
  findAuthUserByWechatOpenId: jest.fn(),
  createAuthUserWithProfile: jest.fn(),
  updateAuthUserIdentityById: jest.fn(),
}));

jest.mock('../../services/emailService', () => ({
  sendResetCode: jest.fn(),
}));

const database = require('../../services/database');
const router = require('../auth');

function getRouteHandler(method, path) {
  const layer = router.stack.find(
    (item) => item.route && item.route.path === path && item.route.methods[method]
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack[0].handle;
}

function createRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    type(contentType) {
      this.headers['content-type'] = contentType;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('auth routes', () => {
  const registerHandler = getRouteHandler('post', '/register');
  const loginHandler = getRouteHandler('post', '/login');
  const wechatConfigHandler = getRouteHandler('get', '/wechat/config');
  const wechatCallbackHandler = getRouteHandler('get', '/wechat/callback');

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.WECHAT_OPEN_APP_ID;
    delete process.env.WECHAT_OPEN_APP_SECRET;
    delete process.env.WECHAT_OPEN_CALLBACK_URL;
    delete process.env.AUTH_ADMIN_EMAIL;
    delete global.fetch;
  });

  it('registers with email and password only', async () => {
    database.findAuthUserByEmail.mockResolvedValue(null);
    database.findAuthUserByUsername.mockResolvedValue(null);
    database.createAuthUserWithProfile.mockResolvedValue(101);
    database.findAuthUserById.mockResolvedValue({
      id: 101,
      username: 'user@example.com',
      email: 'user@example.com',
      phone: null,
      role: 'USER',
      plan: 'FREE',
      library_permissions: '[]',
    });

    const req = {
      body: {
        email: 'User@example.com',
        password: 'abc12345',
      },
    };
    const res = createRes();

    await registerHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(database.createAuthUserWithProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'user@example.com',
        email: 'user@example.com',
        phone: null,
      })
    );
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('user@example.com');
  });

  it('logs in by email', async () => {
    const passwordHash = await bcrypt.hash('abc12345', 4);
    database.findAuthUserByEmail.mockResolvedValue({
      id: 7,
      username: 'admin@example.com',
      email: 'admin@example.com',
      phone: null,
      password_hash: passwordHash,
      role: 'ADMIN',
      plan: 'PRO',
      library_permissions: '[]',
      status: 'ACTIVE',
    });

    const req = {
      body: {
        email: 'admin@example.com',
        password: 'abc12345',
      },
    };
    const res = createRes();

    await loginHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@example.com');
  });

  it('returns enabled wechat config when env is present', async () => {
    process.env.WECHAT_OPEN_APP_ID = 'wx-test-appid';
    process.env.WECHAT_OPEN_APP_SECRET = 'wx-test-secret';
    process.env.WECHAT_OPEN_CALLBACK_URL = 'https://www.offersql.com/api/auth/wechat/callback';

    const req = {};
    const res = createRes();

    await wechatConfigHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enabled).toBe(true);
    expect(res.body.data.appid).toBe('wx-test-appid');
    expect(typeof res.body.data.state).toBe('string');
  });

  it('creates and logs in a user on first wechat callback', async () => {
    process.env.WECHAT_OPEN_APP_ID = 'wx-test-appid';
    process.env.WECHAT_OPEN_APP_SECRET = 'wx-test-secret';
    process.env.WECHAT_OPEN_CALLBACK_URL = 'https://www.offersql.com/api/auth/wechat/callback';

    const configRes = createRes();
    await wechatConfigHandler({}, configRes);
    const state = configRes.body.data.state;

    database.findAuthUserByWechatOpenId.mockResolvedValueOnce(null);
    database.findAuthUserByUsername
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    database.createAuthUserWithProfile.mockResolvedValue(301);
    database.findAuthUserById.mockResolvedValue({
      id: 301,
      username: '微信用户_wx9988',
      email: null,
      phone: null,
      wechat_openid: 'openid-9988',
      role: 'USER',
      plan: 'FREE',
      library_permissions: '[]',
      status: 'ACTIVE',
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'wechat-access-token',
          openid: 'openid-9988',
          unionid: 'unionid-9988',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openid: 'openid-9988',
          unionid: 'unionid-9988',
          nickname: '微信用户',
          headimgurl: 'https://img.example.com/avatar.png',
        }),
      });

    const req = {
      query: {
        code: 'wechat-code',
        state,
      },
    };
    const res = createRes();

    await wechatCallbackHandler(req, res);

    expect(database.createAuthUserWithProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        email: null,
        phone: null,
        wechatOpenId: 'openid-9988',
        wechatUnionId: 'unionid-9988',
      })
    );
    expect(res.headers['content-type']).toBe('html');
    expect(String(res.body)).toContain('localStorage.setItem');
    expect(String(res.body)).toContain('/app');
  });
});
