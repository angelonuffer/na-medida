const DB_NAME = 'na-medida';
const DB_VERSION = 4;
const STORE_ALIMENTOS = 'alimentos';
const STORE_CONSUMOS = 'consumos';
const STORE_PESOS = 'pesos';

function abrirBanco() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const tx = event.target.transaction;
      if (!db.objectStoreNames.contains(STORE_ALIMENTOS)) {
        db.createObjectStore(STORE_ALIMENTOS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_CONSUMOS)) {
        db.createObjectStore(STORE_CONSUMOS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_PESOS)) {
        const pesos = db.createObjectStore(STORE_PESOS, { keyPath: 'id', autoIncrement: true });
        if (db.objectStoreNames.contains('biometria')) {
          const dadosAntigos = tx.objectStore('biometria').openCursor();
          dadosAntigos.onsuccess = (cursorEvent) => {
            const cursor = cursorEvent.target.result;
            if (cursor) {
              pesos.put(cursor.value);
              cursor.continue();
            } else {
              db.deleteObjectStore('biometria');
            }
          };
        }
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

export async function listarAlimentos({ arquivados = false } = {}) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ALIMENTOS, 'readonly');
    const store = tx.objectStore(STORE_ALIMENTOS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.filter((alimento) => Boolean(alimento.arquivado) === arquivados));
    request.onerror = () => reject(request.error);
  });
}

export async function adicionarConsumo(consumo) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONSUMOS, 'readwrite');
    const store = tx.objectStore(STORE_CONSUMOS);
    const request = store.add(consumo);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listarConsumos() {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONSUMOS, 'readonly');
    const store = tx.objectStore(STORE_CONSUMOS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.dataHora.localeCompare(a.dataHora)));
    request.onerror = () => reject(request.error);
  });
}

export async function adicionarPeso(registro) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PESOS, 'readwrite');
    const store = tx.objectStore(STORE_PESOS);
    const request = store.add(registro);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listarPesos() {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PESOS, 'readonly');
    const store = tx.objectStore(STORE_PESOS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.data.localeCompare(a.data)));
    request.onerror = () => reject(request.error);
  });
}

export async function arquivarAlimento(id) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ALIMENTOS, 'readwrite');
    const store = tx.objectStore(STORE_ALIMENTOS);
    const request = store.get(id);
    request.onsuccess = () => {
      const alimento = request.result;
      if (!alimento) {
        reject(new Error('Alimento não encontrado.'));
        return;
      }

      alimento.arquivado = true;
      const updateRequest = store.put(alimento);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function restaurarAlimento(id) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ALIMENTOS, 'readwrite');
    const store = tx.objectStore(STORE_ALIMENTOS);
    const request = store.get(id);
    request.onsuccess = () => {
      const alimento = request.result;
      if (!alimento) {
        reject(new Error('Alimento não encontrado.'));
        return;
      }

      alimento.arquivado = false;
      const updateRequest = store.put(alimento);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}
