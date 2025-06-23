
function openChat() {
  alert("Fonction de chat en cours de développement.");
}
function selectTimeSlot(button, slot) {
  document.getElementById('book-consultation').disabled = false;
  document.getElementById('book-consultation').innerText = "Réserver: " + slot;
}
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  document.getElementById('mobile-menu').style.transform = 'translateX(0)';
});
document.getElementById('mobile-menu-close')?.addEventListener('click', () => {
  document.getElementById('mobile-menu').style.transform = 'translateX(-100%)';
});
