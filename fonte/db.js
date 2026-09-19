const DB_NAME = 'na-medida';
const DB_VERSION = 1;
const STORE_ALIMENTOS = 'alimentos';

function abrirBanco() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_ALIMENTOS)) {
        db.createObjectStore(STORE_ALIMENTOS, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function adicionarAlimento(alimento) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ALIMENTOS, 'readwrite');
    const store = tx.objectStore(STORE_ALIMENTOS);
    const request = store.add(alimento);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listarAlimentos() {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ALIMENTOS, 'readonly');
    const store = tx.objectStore(STORE_ALIMENTOS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removerAlimento(id) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ALIMENTOS, 'readwrite');
    const store = tx.objectStore(STORE_ALIMENTOS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
