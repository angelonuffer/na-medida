const DB_NAME = 'na-medida';
const DB_VERSION = 5;
const STORE_ALIMENTOS = 'alimentos';
const STORE_CONSUMOS = 'consumos';
const STORE_MEDIDAS = 'medidas';

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
      if (!db.objectStoreNames.contains(STORE_MEDIDAS)) {
        db.createObjectStore(STORE_MEDIDAS, { keyPath: 'id', autoIncrement: true });
      }
      for (const storeAntiga of ['pesos', 'biometria']) {
        if (db.objectStoreNames.contains(storeAntiga)) {
          const cursorRequest = tx.objectStore(storeAntiga).openCursor();
          cursorRequest.onsuccess = (cursorEvent) => {
            const cursor = cursorEvent.target.result;
            if (cursor) {
              tx.objectStore(STORE_MEDIDAS).put(cursor.value);
              cursor.continue();
            } else {
              db.deleteObjectStore(storeAntiga);
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

export async function adicionarMedida(registro) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIDAS, 'readwrite');
    const store = tx.objectStore(STORE_MEDIDAS);
    const request = store.add(registro);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function atualizarMedida(id, registro) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIDAS, 'readwrite');
    const store = tx.objectStore(STORE_MEDIDAS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const medidaAtual = getRequest.result;
      if (!medidaAtual) {
        reject(new Error('Medida não encontrada.'));
        return;
      }

      const versaoAnterior = {
        data: medidaAtual.data,
        peso: medidaAtual.peso,
        alturaCm: medidaAtual.alturaCm,
        imc: medidaAtual.imc,
        editadoEm: new Date().toISOString()
      };
      const request = store.put({
        ...medidaAtual,
        ...registro,
        id,
        historico: [...(medidaAtual.historico ?? []), versaoAnterior]
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function listarMedidas() {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIDAS, 'readonly');
    const store = tx.objectStore(STORE_MEDIDAS);
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
