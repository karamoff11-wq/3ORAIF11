/**
 * Simple IndexedDB wrapper for large data (Studio Creations & Transfers)
 * Bypasses the 5-10MB limit of localStorage.
 */

const DB_NAME = 'AlArifStudioDB'
const DB_VERSION = 2 // Incremented for new store
const TRANSFERS_STORE = 'transfers'
const CREATIONS_STORE = 'creations'

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(TRANSFERS_STORE)) {
        db.createObjectStore(TRANSFERS_STORE)
      }
      if (!db.objectStoreNames.contains(CREATIONS_STORE)) {
        db.createObjectStore(CREATIONS_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// --- TRANSFERS (Temporary for page handoff) ---
export async function setTransferData(key: string, data: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSFERS_STORE, 'readwrite')
    const store = tx.objectStore(TRANSFERS_STORE)
    store.put(data, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getTransferData<T = unknown>(key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSFERS_STORE, 'readonly')
    const store = tx.objectStore(TRANSFERS_STORE)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

// --- CREATIONS (Persistent Library) ---
export async function saveCreation(creation: Record<string, unknown> & { id: string }): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CREATIONS_STORE, 'readwrite')
    const store = tx.objectStore(CREATIONS_STORE)
    store.put(creation)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllCreations<T = unknown>(): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CREATIONS_STORE, 'readonly')
    const store = tx.objectStore(CREATIONS_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCreation(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CREATIONS_STORE, 'readwrite')
    const store = tx.objectStore(CREATIONS_STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
