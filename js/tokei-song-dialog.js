(() => {
  'use strict';
  const dialog = document.getElementById('tokeiSongDialog');
  const frame = document.getElementById('tokeiSongFrame');
  let opener;
  document.querySelectorAll('[data-tokei-song]').forEach(button => {
    button.addEventListener('click', () => {
      // Close the existing menu through its own focus/scroll management.
      const menu = button.closest('.global-guide-overlay');
      menu?.querySelector('.global-guide-close')?.click();
      opener = menu ? document.getElementById(menu.id === 'learningMenuOverlay' ? 'learningMenuBtn' : 'referenceVideoBtn') : button;
      frame.src = 'tokei_song.html';
      dialog.showModal();
    });
  });
  document.getElementById('tokeiSongClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    // Unload the player so audio always stops, including after Escape/backdrop.
    frame.src = 'about:blank';
    opener?.focus({preventScroll:true});
  });
  window.addEventListener('message', event => {
    if (event.source === frame.contentWindow && event.data?.type === 'tokei-song-close' && dialog.open) dialog.close();
  });
})();
