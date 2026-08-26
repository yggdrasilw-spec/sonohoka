import { getAllImages, replaceImages, saveEvents } from "./storage.js";
const toData = blob => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob); });
const toBlob = async data => (await fetch(data)).blob();
export async function downloadBackup(events) {
  const images = await Promise.all((await getAllImages()).map(async image => ({ ...image, blob: await toData(image.blob) })));
  const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), events, images })], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: `seikatsu-calendar-${new Date().toISOString().slice(0,10)}.json` });
  a.click(); URL.revokeObjectURL(a.href);
}
export async function restoreBackup(file) {
  const backup = JSON.parse(await file.text());
  if (!Array.isArray(backup.events) || !Array.isArray(backup.images)) throw new Error("バックアップファイルの形式が違います。");
  const images = await Promise.all(backup.images.map(async image => ({ ...image, blob: await toBlob(image.blob) })));
  saveEvents(backup.events); await replaceImages(images); return backup.events;
}
