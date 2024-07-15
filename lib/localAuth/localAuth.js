const { verifyPassword } = require("../Lork/hashing");

/**
 * Verifies a user's credentials.
 *
 * @param {Object} options - The options object.
 * @param {Object} options.User - The User model.
 * @param {string} options.username - The username of the user to verify.
 * @param {string} options.password - The password to verify.
 * @returns {Promise<Object>} - Returns the user object or throws an error.
 */
async function verify(options) {
  try {
    const { User, username, password } = options;
    const user = await User.findOne({ username });

    if (!user) throw new Error("User not found.");
    if (!user.salt || !user.hash)
      throw new Error("Salt and hash are expected to be defined.");

    const { salt, hash } = user;
    const isValid = verifyPassword(salt, hash, password);

    if (!isValid) throw new Error("Invalid password");

    return user; // Return the user object
  } catch (error) {
    throw new Error(`Verification error: ${error.message}`);
  }
}

/**
 * Serializes a user by returning their ID.
 *
 * @param {Object} user - The user object to serialize.
 * @returns {string} - The user ID.
 */

function serialize(user) {
  if (user.id) return user.id;
  throw new Error("Serialization error, no ID was found.");
}

/**
 * Deserializes a user by their ID.
 *
 * @param {Object} options - The options object.
 * @param {Object} options.User - The User model.
 * @param {string} options.id - The ID of the user to deserialize.
 * @returns {Promise<Object>} - Returns the user object or throws an error.
 */
async function deserialize(options) {
  try {
    const { User, id } = options;
    const user = await User.findById(id).select("-salt -hash -__v");
    if (!user) throw new Error("User not found.");
    return user; // Return the user object
  } catch (error) {
    throw new Error(`Deserialization error: ${error.message}`);
  }
}

/**
 * Auth2 class for handling user authentication.
 */
class LocalAuth {
  /**
   * @typedef {Object} Model - This represents a Mongoose model, typically corresponding to a collection in a MongoDB database.
   * It is used to interact with the database for operations like creating, reading, updating, and deleting records.
   *
   * @param {Object} options - The options object.
   * @param {Model} options.User - The User model to interact with the database.
   * @param {Function} [options.verify] - Optional custom verify function.
   * @param {Function} [options.serialize] - Optional custom serialize function.
   * @param {Function} [options.deserialize] - Optional custom deserialize function.
   *
   * @example
   * // Example custom verify function
   * const customVerify = async ({ User, username, password }) => {
   *   const user = await User.findOne({ username });
   *   if (!user) throw new Error("User not found");
   *   // Custom password verification logic
   *   const isValid = customPasswordCheck(password, user.hash, user.salt);
   *   if (!isValid) throw new Error("Invalid password");
   *   return user;
   * };
   *
   * @example
   * // Example custom serialize function
   * const customSerialize = (user) => {
   *   return user.id;
   * };
   *
   * @example
   * // Example custom deserialize function
   * const customDeserialize = async ({ User, id }) => {
   *   const user = await User.findById(id).select("-salt -hash");
   *   if (!user) throw new Error("User not found");
   *   return user;
   * };
   *
   * @throws {TypeError} If options is not an object.
   * @throws {TypeError} If provided optional functions are not functions.
   * @throws {Error} If User model is not defined when serialize or deserialize functions are provided.
   */
  constructor(options = {}) {
    const optionalFunctions = ["verify", "serialize", "deserialize"];

    for (const funcName of optionalFunctions) {
      if (
        options[funcName] !== undefined &&
        typeof options[funcName] !== "function"
      ) {
        throw new TypeError(
          `Expected type function for ${funcName}, got ${typeof options[
            funcName
          ]} instead.`
        );
      }
    }

    if (!options.User) {
      throw new Error("User model must be defined.");
    }

    this.User = options.User;
    this.verify = options.verify || verify;
    this.serialize = options.serialize || serialize;
    this.deserialize = options.deserialize || deserialize;
  }

  /**
   * Executes the serialization of a user.
   *
   * @param {Object} user - The user object to serialize.
   * @returns {string} - The user ID.
   */
  executeSerialize(user) {
    return this.serialize(user); // Directly return the user ID
  }

  /**
   * Executes the deserialization of a user by ID.
   *
   * @param {string} id - The user ID to deserialize.
   * @returns {Promise<Object>} - Returns the user object or throws an error.
   */
  async executeDeserialize(id) {
    return this.deserialize({ User: this.User, id }); // Pass options directly
  }

  /**
   * Executes the verification of user credentials.
   *
   * @param {Object} options - The options object.
   * @returns {Promise<Object>} - Returns the user object or throws an error.
   */
  async executeVerify(options) {
    return this.verify(options); // Directly return the user object
  }

  /**
   * Middleware to initialize user session from session data.
   *
   * @returns {Function} Express middleware function.
   */
  initialize() {
    return async (req, res, next) => {
      const { userId } = req.session;
      if (userId) {
        try {
          req.user = await this.executeDeserialize(userId);
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }
      }
      next();
    };
  }

  /**
   * Middleware to authenticate a user.
   *
   * @returns {Function} Express middleware function.
   */
  authenticate() {
    return async (req, res, next) => {
      const { username, password } = req.fields;
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required." });
      }

      const options = { User: this.User, username, password };
      try {
        req.session.userId = this.executeSerialize(await this.executeVerify(options));
        req.user = await this.executeDeserialize(req.session.userId);
        next();
      } catch (error) {
        return res.status(401).json({ error: error.message });
      }
    };
  }
}

module.exports = LocalAuth;
