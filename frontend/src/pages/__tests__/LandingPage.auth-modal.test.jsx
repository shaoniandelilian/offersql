import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LandingPage from '../LandingPage';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

jest.mock('../../utils/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    guestLogin: jest.fn(),
    getWechatConfig: jest.fn(),
    sendResetCode: jest.fn(),
    confirmResetPassword: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const renderLandingPage = async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<div>练习区</div>} />
          <Route path="/forgot-password" element={<div>找回密码页</div>} />
        </Routes>
      </MemoryRouter>
    );
  });

  return { container, root };
};

describe('LandingPage auth modal', () => {
  let intersectionObserver;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    authAPI.login.mockReset();
    authAPI.register.mockReset();
    authAPI.guestLogin.mockReset();
    authAPI.getWechatConfig.mockReset();
    authAPI.sendResetCode.mockReset();
    authAPI.confirmResetPassword.mockReset();
    authAPI.getWechatConfig.mockResolvedValue({
      success: true,
      data: {
        enabled: false,
        appid: '',
        callbackUrl: '',
        state: '',
      },
    });
    toast.success.mockClear();
    toast.error.mockClear();
    intersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = jest.fn(function mockIntersectionObserver(callback) {
      this.observe = jest.fn((target) => callback([{ isIntersecting: true, target }]));
      this.unobserve = jest.fn();
      this.disconnect = jest.fn();
    });
  });

  afterEach(() => {
    window.IntersectionObserver = intersectionObserver;
    document.body.innerHTML = '';
  });

  it('opens login modal from free start when logged out', async () => {
    const { container, root } = await renderLandingPage();
    const freeStartButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('免费开始练习')
    );
    await act(async () => {
      freeStartButton.click();
    });

    expect(container.textContent).toContain('登录 OffersSQL');
    expect(container.textContent).toContain('忘记密码？');
    expect(container.textContent).toContain('微信扫码登录');
    expect(container.textContent).not.toContain('当前环境暂不可用');
    expect(container.textContent).not.toContain('返回账号密码登录');
    expect(authAPI.getWechatConfig).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it('switches to wechat scan view only after clicking wechat login', async () => {
    const { container, root } = await renderLandingPage();
    const loginButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '登录'
    );

    await act(async () => {
      loginButton.click();
    });

    const wechatButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('微信扫码登录')
    );
    await act(async () => {
      wechatButton.click();
    });

    expect(authAPI.getWechatConfig).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('使用微信扫一扫，快速进入练习区');
    expect(container.textContent).toContain('当前环境暂不可用');
    expect(container.textContent).toContain('返回账号密码登录');

    const backButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('返回账号密码登录')
    );
    await act(async () => {
      backButton.click();
    });

    expect(container.textContent).toContain('登录 OffersSQL');
    expect(container.textContent).toContain('忘记密码？');
    expect(container.textContent).not.toContain('返回账号密码登录');

    await act(async () => {
      root.unmount();
    });
  });

  it('opens register modal and switches back to login', async () => {
    const { container, root } = await renderLandingPage();
    const registerButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('立即注册')
    );

    await act(async () => {
      registerButton.click();
    });

    expect(container.textContent).toContain('注册 OffersSQL');
    expect(container.textContent).toContain('已有账号？');
    expect(container.textContent).not.toContain('微信扫码登录');

    const switchToLogin = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('去登录')
    );
    await act(async () => {
      switchToLogin.click();
    });

    expect(container.textContent).toContain('登录 OffersSQL');

    await act(async () => {
      root.unmount();
    });
  });

  it('persists auth and navigates to app after successful login', async () => {
    authAPI.login.mockResolvedValue({
      success: true,
      data: {
        token: 'token-1',
        user: { email: 'demo@offersql.com' },
      },
    });
    const { container, root } = await renderLandingPage();
    const loginButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '登录'
    );

    await act(async () => {
      loginButton.click();
    });

    const [emailInput, passwordInput] = container.querySelectorAll('input');
    await act(async () => {
      Simulate.change(emailInput, { target: { name: 'email', value: 'demo@offersql.com' } });
      Simulate.change(passwordInput, { target: { name: 'password', value: 'password123' } });
    });

    const modalLoginButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '登录' && button.type === 'submit'
    );
    await act(async () => {
      modalLoginButton.click();
    });

    expect(authAPI.login).toHaveBeenCalledWith('demo@offersql.com', 'password123', {
      suppressErrorToast: true,
    });
    expect(localStorage.getItem('auth_token')).toBe('token-1');
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
    expect(container.textContent).toContain('练习区');

    await act(async () => {
      root.unmount();
    });
  });

  it('shows register errors inside modal without triggering global toast', async () => {
    authAPI.register.mockRejectedValue({
      response: {
        data: {
          error: '密码需 8-20 位，且包含字母和数字',
        },
      },
    });
    const { container, root } = await renderLandingPage();
    const registerButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('立即注册')
    );

    await act(async () => {
      registerButton.click();
    });

    const [emailInput, passwordInput] = container.querySelectorAll('input');
    await act(async () => {
      Simulate.change(emailInput, { target: { name: 'email', value: 'demo@offersql.com' } });
      Simulate.change(passwordInput, { target: { name: 'password', value: '12345678' } });
    });

    const modalRegisterButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '立即注册' && button.type === 'submit'
    );
    await act(async () => {
      modalRegisterButton.click();
    });

    expect(authAPI.register).toHaveBeenCalledWith('demo@offersql.com', '12345678', {
      suppressErrorToast: true,
    });
    expect(container.textContent).toContain('密码需 8-20 位，且包含字母和数字');
    expect(toast.error).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it('opens forgot password flow inside modal without phone fields', async () => {
    const { container, root } = await renderLandingPage();
    const loginButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '登录'
    );

    await act(async () => {
      loginButton.click();
    });

    const forgotButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('忘记密码？')
    );
    await act(async () => {
      forgotButton.click();
    });

    expect(container.textContent).toContain('找回密码');
    expect(container.textContent).toContain('发送验证码');
    expect(container.textContent).toContain('新密码');
    expect(container.textContent).toContain('确认新密码');
    expect(container.textContent).not.toContain('微信扫码登录');
    expect(container.textContent).not.toContain('找回密码页');
    expect(container.textContent).not.toContain('手机号');

    await act(async () => {
      root.unmount();
    });
  });

  it('sends email code and returns to login after password reset', async () => {
    authAPI.sendResetCode.mockResolvedValue({
      success: true,
      debugCode: '123456',
    });
    authAPI.confirmResetPassword.mockResolvedValue({
      success: true,
    });
    const { container, root } = await renderLandingPage();
    const loginButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '登录'
    );

    await act(async () => {
      loginButton.click();
    });
    const forgotButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('忘记密码？')
    );
    await act(async () => {
      forgotButton.click();
    });

    const [emailInput, codeInput, newPasswordInput, confirmPasswordInput] = container.querySelectorAll('input');
    await act(async () => {
      Simulate.change(emailInput, { target: { name: 'email', value: 'demo@offersql.com' } });
    });

    const sendCodeButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('发送验证码')
    );
    await act(async () => {
      sendCodeButton.click();
    });

    expect(authAPI.sendResetCode).toHaveBeenCalledWith('demo@offersql.com', {
      suppressErrorToast: true,
    });
    expect(container.textContent).toContain('开发模式验证码：123456');

    await act(async () => {
      Simulate.change(codeInput, { target: { name: 'code', value: '123456' } });
      Simulate.change(newPasswordInput, { target: { name: 'newPassword', value: 'newpass123' } });
      Simulate.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'newpass123' } });
    });

    const resetButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '重置密码' && button.type === 'submit'
    );
    await act(async () => {
      resetButton.click();
    });

    expect(authAPI.confirmResetPassword).toHaveBeenCalledWith('demo@offersql.com', '123456', 'newpass123', {
      suppressErrorToast: true,
    });
    expect(container.textContent).toContain('登录 OffersSQL');
    expect(toast.success).toHaveBeenCalledWith('密码重置成功，请重新登录');

    await act(async () => {
      root.unmount();
    });
  });
});
