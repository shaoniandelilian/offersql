export const WECHAT_SCRIPT_ID = 'offersql-wechat-login-sdk';
export const WECHAT_SCRIPT_SRC = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';

export function loadWechatLoginScript() {
  if (window.WxLogin) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(WECHAT_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = WECHAT_SCRIPT_ID;
    script.src = WECHAT_SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
