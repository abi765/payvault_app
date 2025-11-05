/**
 * IndexedDB wrapper for offline data storage
 */

const DB_NAME = 'PayVaultDB';
const DB_VERSION = 1;

// Object stores (tables)
const STORES = {
  EMPLOYEES: 'employees',
  SALARY_PAYMENTS: 'salaryPayments',
  SYNC_QUEUE: 'syncQueue',
  SETTINGS: 'settings'
};

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create employees store
        if (!db.objectStoreNames.contains(STORES.EMPLOYEES)) {
          const employeeStore = db.createObjectStore(STORES.EMPLOYEES, { keyPath: 'id' });
          employeeStore.createIndex('employee_id', 'employee_id', { unique: true });
          employeeStore.createIndex('status', 'status', { unique: false });
          employeeStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Create salary payments store
        if (!db.objectStoreNames.contains(STORES.SALARY_PAYMENTS)) {
          const salaryStore = db.createObjectStore(STORES.SALARY_PAYMENTS, { keyPath: 'id' });
          salaryStore.createIndex('employee_id', 'employee_id', { unique: false });
          salaryStore.createIndex('payment_month', 'payment_month', { unique: false });
          salaryStore.createIndex('status', 'status', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('synced', 'synced', { unique: false });
          syncStore.createIndex('entity_type', 'entity_type', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  /**
   * Get all records from a store
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single record by ID
   */
  async getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get records by index
   */
  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add or update a record
   */
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add multiple records
   */
  async putMany(storeName, dataArray) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const promises = dataArray.map((data) => {
        return new Promise((res, rej) => {
          const request = store.put(data);
          request.onsuccess = () => res(request.result);
          request.onerror = () => rej(request.error);
        });
      });

      Promise.all(promises)
        .then((results) => resolve(results))
        .catch((error) => reject(error));
    });
  }

  /**
   * Delete a record
   */
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data (for logout)
   */
  async clearAll() {
    const stores = [
      STORES.EMPLOYEES,
      STORES.SALARY_PAYMENTS,
      STORES.SYNC_QUEUE,
      STORES.SETTINGS
    ];

    const promises = stores.map((store) => this.clear(store));
    return Promise.all(promises);
  }

  /**
   * Count records in a store
   */
  async count(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all employees (with caching)
   */
  async getEmployees(status = null) {
    const employees = await this.getAll(STORES.EMPLOYEES);

    if (status) {
      return employees.filter((emp) => emp.status === status);
    }

    return employees;
  }

  /**
   * Save employee (with sync queue entry)
   */
  async saveEmployee(employee, action = 'UPDATE') {
    await this.put(STORES.EMPLOYEES, employee);
    return employee;
  }

  /**
   * Get salary payments for a month
   */
  async getSalaryPayments(month) {
    return this.getByIndex(STORES.SALARY_PAYMENTS, 'payment_month', month);
  }

  /**
   * Save salary payment
   */
  async saveSalaryPayment(payment) {
    await this.put(STORES.SALARY_PAYMENTS, payment);
    return payment;
  }

  /**
   * Get setting value
   */
  async getSetting(key, defaultValue = null) {
    const setting = await this.getById(STORES.SETTINGS, key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Save setting
   */
  async saveSetting(key, value) {
    await this.put(STORES.SETTINGS, { key, value });
  }
}

// Singleton instance
let instance = null;

export const getOfflineStorage = async () => {
  if (!instance) {
    instance = new OfflineStorage();
    await instance.init();
  }
  return instance;
};

export { STORES };
export default OfflineStorage;
