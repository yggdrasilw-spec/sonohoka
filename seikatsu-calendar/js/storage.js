const EVENT_KEY = "seikatsu-calendar.events.v1";
const DB_NAME = "seikatsu-calendar";
const STORE = "images";

function db() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function transaction(mode, action) {
  return db().then(database => new Promise((resolve, reject) => {
    const request = action(database.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}
export async function getEvents() {
  const saved = localStorage.getItem(EVENT_KEY);
  if (saved) return JSON.parse(saved);
  const response = await fetch("data/events.seed.json");
  const seed = await response.json();
  localStorage.setItem(EVENT_KEY, JSON.stringify(seed.events));
  return seed.events;
}
export function saveEvents(events) { localStorage.setItem(EVENT_KEY, JSON.stringify(events)); }
export async function saveImage(file) {
  const id = `upload:${crypto.randomUUID()}`;
  await transaction("readwrite", store => store.put({ id, blob: file, name: file.name, type: file.type }));
  return id;
}
export function getImage(id) { return transaction("readonly", store => store.get(id)); }
export function getAllImages() { return transaction("readonly", store => store.getAll()); }
export async function imageUrl(id, library) {
  const item = library.find(image => image.id === id);
  if (item) return item.path;
  const saved = await getImage(id);
  return saved ? URL.createObjectURL(saved.blob) : "";
}
export async function replaceImages(images) {
  const database = await db();
  await new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite"); const store = tx.objectStore(STORE);
    store.clear(); images.forEach(item => store.put(item)); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
}
export { EVENT_KEY };
