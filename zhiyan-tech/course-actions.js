(() => {
  const buttons = document.querySelectorAll('[data-copy-wechat]');
  if (!buttons.length) return;

  async function copyWechat(button) {
    const value = button.dataset.copyWechat;
    const status = button.closest('section')?.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(value);
      if (status) status.textContent = '已复制';
    } catch {
      if (status) status.textContent = `请手动复制：${value}`;
    }
  }

  buttons.forEach((button) => button.addEventListener('click', () => copyWechat(button)));
})();
