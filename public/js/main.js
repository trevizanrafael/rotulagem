// Toggle visibilidade de senha
function togglePassword(btn) {
  const input = btn.parentElement.querySelector('input');
  const isHidden = input.type === 'password';

  input.type = isHidden ? 'text' : 'password';

  btn.querySelector('.eye-open').style.display  = isHidden ? 'none'  : 'inline';
  btn.querySelector('.eye-closed').style.display = isHidden ? 'inline' : 'none';
}
