/**
 * In-memory store for session management.
 * @class
 */
class MemoryStore {
  /**
   * Creates an instance of MemoryStore.
   */
  constructor() {
    this.memoryStore = {};
  }

  /**
   * Retrieves a session from the memory store.
   * @param {string} sid - The session ID.
   * @returns {Promise<Object|null>} A Promise resolving to the session object if found, or null if not found.
   */
  async get(sid) {
    const thisSession = this.memoryStore[sid];
    if (thisSession) {
      let session = {
        sid: sid,
        data: thisSession.data,
        expiration: thisSession.expiration,
      };
      if (thisSession.modified !== undefined) {
        session.modified = thisSession.modified;
      }
      return session;
    } else {
      return null;
    }
  }

  /**
   * Stores a session in the memory store.
   * @param {Object} session - The session object to store.
   * @returns {Promise<void>} A Promise that resolves when the session is stored.
   */
  async set(session) {
    this.memoryStore[session.sid] = {
      data: session.data,
      expiration: session.expiration,
    };
    if (session.modified !== undefined) {
      this.memoryStore[session.sid].modified = session.modified;
    }
  }

  /**
   * Destroys a session in the memory store.
   * @param {string} sid - The session ID to destroy.
   * @returns {Promise<void>} A Promise that resolves when the session is destroyed.
   */
  async destroy(sid) {
    delete this.memoryStore[sid];
  }
}

module.exports = MemoryStore;
