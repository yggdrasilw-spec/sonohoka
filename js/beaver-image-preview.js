// Originals are requested only after the learner opens a picture.
(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'beaver-image-preview';
  dialog.setAttribute('aria-label', '絵を大きく見る');
  dialog.innerHTML = '<button type="button" autofocus>閉じる（Esc）</button><img alt="">';
  document.body.append(dialog);
  const image = dialog.querySelector('img');
  image.referrerPolicy = 'no-referrer';
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('close', () => image.removeAttribute('src'));
  window.addEventListener('keydown', event => {
    if (dialog.open && event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      dialog.close();
    }
  }, true);
  const photos = document.querySelectorAll('img[data-full-src], #beaver-carrier');
  for (const photo of photos) {
    photo.tabIndex = 0;
    photo.setAttribute('role', 'button');
    photo.setAttribute('aria-haspopup', 'dialog');
    photo.setAttribute('aria-label', `${photo.alt || 'ビーバーの絵'}を大きく見る`);
    photo.title = 'タップして大きく見る';
    photo.style.cursor = 'zoom-in';
    photo.style.pointerEvents = 'auto';
    const open = event => {
      event.stopPropagation();
      if (!photo.getAttribute('src')) return;
      image.alt = photo.alt || '材料を運ぶビーバー';
      image.src = photo.dataset.fullSrc || photo.src.replace('/img/display/', '/img/').replace(/\.webp$/, '.png');
      dialog.showModal();
    };
    photo.addEventListener('click', open);
    photo.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(event); }
    });
  }
})();
