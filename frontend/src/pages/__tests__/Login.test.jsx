import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

jest.mock('../../utils/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    guestLogin: jest.fn(),
    getWechatConfig: jest.fn().mockResolvedValue({
      success: true,
      data: {
        enabled: false,
      },
    }),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Login page', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders email login and wechat login area without phone registration', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('微信扫码登录');
    expect(container.textContent).toContain('邮箱');
    expect(container.textContent).not.toContain('手机号');
  });
});
