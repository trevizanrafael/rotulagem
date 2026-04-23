/**
 * ─────────────────────────────────────────────
 *  FoodTech Modal Engine
 *  Uso:
 *    Modal.confirm({ title, message, onConfirm, confirmText, cancelText })
 *    Modal.notify({ type: 'success'|'error'|'warning'|'info', title, message, autoClose })
 * ─────────────────────────────────────────────
 */
const Modal = (() => {
  // Elementos do DOM (injetados pelo partial _modal.ejs)
  const overlay   = () => document.getElementById('modal-overlay');
  const box       = () => document.getElementById('modal-box');
  const iconEl    = () => document.getElementById('modal-icon');
  const titleEl   = () => document.getElementById('modal-title');
  const messageEl = () => document.getElementById('modal-message');
  const confirmBtn= () => document.getElementById('modal-confirm-btn');
  const cancelBtn = () => document.getElementById('modal-cancel-btn');

  let _autoCloseTimer = null;

  // Mapa de ícones e cores por tipo
  const TYPES = {
    success: { icon: '✅', color: 'var(--success)',  bg: 'var(--success-bg)',  border: '#bbf7d0' },
    error:   { icon: '❌', color: 'var(--danger)',   bg: 'var(--danger-bg)',   border: '#fca5a5' },
    warning: { icon: '⚠️', color: '#d97706',         bg: '#fffbeb',            border: '#fde68a' },
    info:    { icon: 'ℹ️', color: 'var(--blue)',     bg: 'var(--blue-light)',  border: 'var(--blue-mid)' },
    confirm: { icon: '❓', color: 'var(--blue)',     bg: 'var(--blue-light)',  border: 'var(--blue-mid)' },
  };

  function _open() {
    overlay().classList.add('modal-visible');
    box().classList.add('modal-pop');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    clearTimeout(_autoCloseTimer);
    const o = overlay();
    if (!o) return;
    o.classList.remove('modal-visible');
    box().classList.remove('modal-pop');
    document.body.style.overflow = '';
    // Limpa handler do confirm para não acumular listeners
    confirmBtn().onclick = null;
    cancelBtn().onclick  = null;
  }

  function _render({ type = 'info', title, message, showCancel = false,
                     confirmText = 'OK', cancelText = 'Cancelar' }) {
    const t = TYPES[type] || TYPES.info;
    iconEl().textContent    = t.icon;
    iconEl().style.color    = t.color;
    titleEl().textContent   = title || '';
    messageEl().innerHTML   = message || '';

    // Botão confirmar
    confirmBtn().textContent = confirmText;
    confirmBtn().style.background = type === 'error' ? 'var(--danger)' : 'var(--blue)';

    // Botão cancelar
    cancelBtn().style.display = showCancel ? 'inline-flex' : 'none';
    cancelBtn().textContent   = cancelText;
  }

  /**
   * Modal de confirmação com callback
   */
  function confirm({ title = 'Confirmar', message = '', confirmText = 'Confirmar',
                     cancelText = 'Cancelar', onConfirm, onCancel } = {}) {
    _render({ type: 'confirm', title, message, showCancel: true, confirmText, cancelText });
    _open();

    confirmBtn().onclick = () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    };
    cancelBtn().onclick = () => {
      close();
      if (typeof onCancel === 'function') onCancel();
    };
  }

  /**
   * Modal de notificação (sucesso, erro, aviso, info)
   * @param {boolean} autoClose  — fecha automaticamente após N ms (default 3500). Passe false para desativar.
   */
  function notify({ type = 'info', title, message, confirmText = 'Fechar',
                    autoClose = 3500 } = {}) {
    _render({ type, title, message, showCancel: false, confirmText });
    _open();

    confirmBtn().onclick = close;

    if (autoClose) {
      _autoCloseTimer = setTimeout(close, autoClose);
    }
  }

  // Fecha ao clicar no overlay fora do box
  document.addEventListener('DOMContentLoaded', () => {
    overlay()?.addEventListener('click', (e) => {
      if (e.target === overlay()) close();
    });
    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  });

  return { confirm, notify, close };
})();

// ─────────────────────────────────────────────
//  Atalho global para confirmar exclusão via form
//  Uso na view: onclick="confirmDelete(this, 'Nome do item')"
// ─────────────────────────────────────────────
function confirmDelete(btn, itemName) {
  const form = btn.closest('form');
  Modal.confirm({
    title: 'Excluir registro',
    message: `Tem certeza que deseja excluir <strong>${itemName}</strong>? Esta ação não pode ser desfeita.`,
    confirmText: '🗑️ Excluir',
    cancelText: 'Cancelar',
    onConfirm: () => form.submit(),
  });
}

// ─────────────────────────────────────────────
//  Auto-notificação via elemento oculto #page-notify
//  Cada view insere: <div id="page-notify" data-type="..." data-title="..." data-message="..." data-autoclose="true|false" hidden></div>
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('page-notify');
  if (!el) return;
  const autoClose = el.dataset.autoclose !== 'false';
  Modal.notify({
    type:      el.dataset.type    || 'info',
    title:     el.dataset.title   || '',
    message:   el.dataset.message || '',
    autoClose: autoClose ? 3500 : false,
  });
});

// Toggle de senha (mantido aqui para unificar o arquivo)
function togglePassword(btn) {
  const input = btn.parentElement.querySelector('input');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('.eye-open').style.display  = isHidden ? 'none'  : 'inline';
  btn.querySelector('.eye-closed').style.display = isHidden ? 'inline' : 'none';
}
