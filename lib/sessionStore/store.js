const Session = require("./models/session.model.js");

/**
 * MongoDB store for session management.
 * @class
 */
class Store {
  /**
   * Creates an instance of Store.
   * @param {MongoClient} mongoClient - The MongoDB client instance.
   */
  constructor(mongoClient) {
    this.client = mongoClient;
    this.db = this.client.db();
  }

  /**
   * Retrieves a session from MongoDB.
   * @param {string} sid - The session ID.
   * @returns {Promise<Object|null>} A Promise resolving to the session object if found, or null if not found.
   */
  async get(sid) {
    try {
      const session = await Session.findById(sid).select(
        "-__v -updatedAt -createdAt"
      );
      if (session) {
        session.sid = session._id;
        delete session._id;
        return session;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  /**
   * Stores or updates a session in MongoDB.
   * @param {Object} session - The session object to store or update.
   * @param {string} session.sid - The session ID.
   * @param {Object} session.sessionData - The session data to store.
   * @param {Date} session.expiration - The expiration date of the session.
   * @returns {Promise<void>} A Promise that resolves when the session is stored or updated.
   */
  async set(session) {
    const { sid, ...restOfData } = session;
    try {

      await Session.updateOne(
        { _id: sid },
        { $set: { ...restOfData } },
        { upsert: true }
      );
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  /**
   * Deletes a session from MongoDB based on its ID.
   * @param {string} sid - The session ID to delete.
   * @returns {Promise<void>} A Promise that resolves when the session is deleted.
   */
  async destroy(sid) {
    try {
      await Session.deleteOne({ _id: sid });
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  /**
   * Cleans up expired sessions from MongoDB.
   * @returns {Promise<void>} A Promise that resolves when expired sessions are cleaned up.
   */
  async cleanUpExpiredSessions() {
    try {
      const now = new Date();
      await Session.deleteMany({ expires: { $lt: now } });
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
}

module.exports = Store;
