const Store = require("../sessionStore/mongo-store.js");
const { generateId } = require("../Lork/hashing.js");
const MemoryStore = require("../sessionStore/memoryStore.js");

/**
 * @typedef {Object} SessionOptions
 * @property {boolean} [resave] - Forces the session to be saved back to the session store, even if the session was never modified during the request.
 * @property {boolean} [saveUninitialized] - Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
 * @property {any} [store] - Setup a store for your session.
 * @property {Object} cookie - Options for setting the session cookie.
 * @property {string} [cookie.key="connect.sid"] - The name of the session cookie.
 * @property {string} cookie.secretKey - A secret key for signing the session ID cookie.
 * @property {Date} [cookie.expires] - The expiration date of the cookie. If not specified, the cookie will be a session cookie.
 * @property {number} [cookie.maxAge] - The maximum age of the cookie in milliseconds.
 * @property {string} [cookie.domain] - The domain for which the cookie is valid.
 * @property {string} [cookie.path] - The path within the domain for which the cookie is valid.
 * @property {boolean} [cookie.secure] - Indicates if the cookie should only be sent over secure (HTTPS) connections.
 * @property {boolean} [cookie.httpOnly] - Indicates if the cookie is inaccessible to client-side JavaScript.
 * @property {string} [cookie.sameSite] - Specifies the SameSite attribute of the cookie ('Strict', 'Lax', 'None').
 */

/**
 * Middleware function for setting up session handling.
 * @param {SessionOptions} options - Options for session setup.
 * @returns {function} Express middleware function for session handling.
 */
function session(options) {
  validateOptions(options);
  const store = options.store ? new Store(options.store) : new MemoryStore();
  setupCleanup(store);

  // Returning middleware
  return async (req, res, next) => {
    try {
      const session = await getSession(options, store);
      req.session = createSessionProxy(session, store, res, options);
      next();
    } catch (error) {
      console.error("Session middleware error:", error);
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  };
}

/**
 * Validates and sets default values for session options.
 * @param {SessionOptions} options - Options for session setup.
 * @throws {Error} Throws an error if a required option is missing or invalid.
 */
function validateOptions(options) {
  options.cookie.value = options.cookie.value || generateId();
  options.cookie.key = options.cookie.key || "connect.sid";
  if (!options.cookie.secretKey) {
    throw new Error("A secretKey for the session must be provided");
  }
}

/**
 * Sets up periodic cleanup of expired sessions.
 * @param {Store} store - The session store instance.
 */
function setupCleanup(store) {
  setInterval(async () => {
    try {
      await store.cleanUpExpiredSessions();
    } catch (error) {
      console.error("Session cleanup error:", error);
    }
  }, 10000);
}

/**
 * Determines the expiration date for the session cookie.
 * @param {SessionOptions} options - Options for session setup.
 * @returns {Date|null} The expiration date for the session cookie, or null if session cookie is a session cookie.
 */
function getExpirationDate(options) {
  if (!options.cookie.expires) {
    return options.cookie.maxAge
      ? new Date(Date.now() + options.cookie.maxAge)
      : null;
  } else {
    return options.cookie.expires;
  }
}

/**
 * Initializes the session by setting the session cookie.
 * @param {ServerResponse} res - The server response object.
 * @param {SessionOptions} options - Options for session setup.
 * @returns {Date | null} The expiration date for the session cookie.
 * @throws {Error} Throws an error if setting the cookie fails.
 */
function initializeSession(res, options) {
  try {
    res.signedCookie(options.cookie);
    return getExpirationDate(options);
  } catch (error) {
    console.error("Error setting session cookie:", error);
    throw new Error("Failed to set session cookie");
  }
}

/**
 * Retrieves or initializes a session from the session store.
 * @param {SessionOptions} options - Options for session setup.
 * @param {Store} store - The session store instance.
 * @returns {Promise<Object>} A Promise resolving to the session object.
 * @throws {Error} Throws an error if session retrieval or initialization fails.
 */
async function getSession(options, store) {
  const sid = options.cookie.value;
  if (sid) {
    try {
      let session = await store.get(sid);
      if (!session) {
        session = {
          sid: sid,
          data: {},
          expires: null,
        };
      }
      return session;
    } catch (error) {
      console.error("Error retrieving session:", error);
      throw new Error("Failed to retrieve session");
    }
  } else {
    throw new Error("Session ID not provided in cookie");
  }
}

/**
 * Creates a proxy object for session data with setters for automatic session updates.
 * @param {Object} session - The session object containing session ID, data, and expiration date.
 * @param {Store} store - The session store instance.
 * @param {ServerResponse} res - The server response object.
 * @param {SessionOptions} options - Options for session setup.
 * @returns {Object} A proxied session object with automatic updates.
 */
function createSessionProxy(session, store, res, options) {
  /**
   * The proxied session data object.
   * @type {Object}
   * @property {any} sid - The session ID.
   * @property {Object} data - The session data object.
   * @property {Date|null} expiration - The expiration date of the session, or null if not specified.
   */
  const handleSessionUpdate = async (session, property, options, res, store) => {
    if (property != "expires") {
      session.expires = initializeSession(res, options);
      try {
        await store.set(session);
      } catch (error) {
        console.error("Error updating session:", error);
        throw new Error("Failed to update session");
      }
    }
  };
  const proxiedSessionData = new Proxy(session, {
    set: async (target, property, value) => {
      target[property] = value;
      await handleSessionUpdate(session, property, options, res, store);
      return true;
    },
    deleteProperty: async (target, property) => {
      delete target[property];
      await handleSessionUpdate(session, property, options, res, store);
      return true;
    },
  });
  session = proxiedSessionData;
  return session;
}

module.exports = { session };


