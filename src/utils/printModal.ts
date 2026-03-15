export function printModal() {
  document.body.classList.add('print-modal');
  window.print();
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-modal');
  }, { once: true });
}
