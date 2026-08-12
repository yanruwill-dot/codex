(() => {
  const courseUrl = 'https://yanruwill-dot.github.io/codex/zhiyan-tech/ai-small-class.html';
  const courseMessage = `长沙想把 AI 真正用进工作，不要只学一个工具。颜汝 AI 小班课支持 Windows 实操，课程不止 OpenClaw，也包含 Codex、行业＋AI和商业化落地。带着真实问题到场，课堂里做出可检查、可继续修改的成果。具体日期、场地、费用、名额和退款约定，以当期书面课程通知为准。\n\n课程详情：${courseUrl}`;
  const buttons = document.querySelectorAll('[data-copy-wechat], [data-copy-course], [data-copy-text]');

  async function writeText(value) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('copy failed');
  }

  function copySpec(button) {
    if (button.dataset.copyText) return { value: button.dataset.copyText, success: button.dataset.copySuccess || '内容已复制' };
    if (button.dataset.copyWechat) return { value: button.dataset.copyWechat, success: '微信号已复制' };
    if (button.dataset.copyCourse === 'url') return { value: courseUrl, success: '课程链接已复制' };
    return { value: courseMessage, success: '转发文案已复制' };
  }

  async function copy(button) {
    const spec = copySpec(button);
    const status = button.closest('section, header')?.querySelector('[data-action-status]');
    try {
      await writeText(spec.value);
      if (status) status.textContent = spec.success;
    } catch {
      if (status) status.textContent = `请手动复制：${spec.value}`;
    }
  }

  buttons.forEach((button) => button.addEventListener('click', () => copy(button)));

  const preparationForm = document.querySelector('[data-course-preparation-form]');
  const preparationResult = document.querySelector('[data-course-preparation-result]');
  const preparationText = document.querySelector('[data-course-preparation-text]');
  const preparationCopy = document.querySelector('[data-copy-preparation]');
  const preparationStatus = document.querySelector('[data-preparation-status]');

  function buildPreparationCard(form) {
    const data = new FormData(form);
    return `AI 小班课咨询准备卡\n\n我的行业 / 身份：${data.get('profile')}\n电脑系统：${data.get('system')}\n重点方向：${data.get('focus')}\n现场想解决的问题：${data.get('problem')}\n\n我愿意带电脑动手，并已了解课程不承诺收入、流量或成交结果。\n请帮我核对当期课程是否匹配，以及日期、长沙具体场地、费用、名额、电脑配置、课程版本和退款约定。`;
  }

  preparationForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    preparationText.textContent = buildPreparationCard(preparationForm);
    preparationResult.hidden = false;
    preparationResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    preparationCopy.focus({ preventScroll: true });
  });

  preparationCopy?.addEventListener('click', async () => {
    try {
      await writeText(preparationText.textContent);
      preparationStatus.textContent = '咨询准备卡已复制';
    } catch {
      preparationStatus.textContent = '复制失败，请选中上方内容手动复制';
    }
  });
})();
