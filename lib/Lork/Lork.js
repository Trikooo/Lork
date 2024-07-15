const http = require("node:http");
const fs = require("node:fs");
const { parseUrl } = require("./urlParser");
const { parseCookies, cookieStringifier } = require("./cookieManager");
const { formidable } = require("formidable");
const path = require("node:path");
// const MultipartFormParser = require("../../modules/multipart/multipartParser.js");
let secretKey
// Class definition for Lork
class Lork {
  constructor() {
    this.middleware = [this.bodyParser];
    this.lork = http.createServer();
    this.#superRes(); // extend the response object
  }

  // Private method to handle request based on URL, method, and middleware
  #handleRequest(url, method, requestMiddleware) {
    // Check if URL includes parameters
    if (url.includes(":")) {
      const splitUrl = url.split(":");
      const pathWithoutParams = splitUrl[0];
      let params = { [splitUrl[1]]: "" };
      this.lork.on("request", (req, res) => {
        if (req.method === method && req.url.startsWith(pathWithoutParams)) {
          req.parsedUrl = parseUrl(req.url);
          params[splitUrl[1]] = req.url.replace(pathWithoutParams, "");
          req.params = params;
          req.parsedUrl.params = params; // Attach parameters to the parsedUrl object as well
          req.cookies = parseCookies(req, res, secretKey);
          // Execute middleware
          this.#executeMiddleware(req, res, 0, requestMiddleware);
        }
      });
    } else {
      this.lork.on("request", (req, res) => {
        if (req.method === method && req.url === url) {
          req.parsedUrl = parseUrl(req.url);
          req.params = {}; // No parameters for this URL
          req.cookies = parseCookies(req, res, secretKey);
          // Execute middleware
          this.#executeMiddleware(req, res, 0, requestMiddleware);
        }
      });
    }
  }

  // Private method to extend the response object with additional methods
  #superRes() {
    const res = http.ServerResponse.prototype;

    /**
     * Method to send plain text response.
     * @param {any} data - The data to send in the response.
     */
    res.send = function (data) {
      if (!this.statusCode) {
        this.statusCode = 200; // Default status code
      }

      if (typeof data === "object") {
        data = JSON.stringify(data);
      }
      this.writeHead(this.statusCode, { "Content-Type": "text/plain" });
      this.end(data);
    };

    /**
     * Method to send JSON response.
     * @param {any} data - The data to send in the response.
     */
    res.json = function (data) {
      if (!this.statusCode) {
        this.statusCode = 200; // Default status code
      }
      this.writeHead(this.statusCode, { "Content-Type": "application/json" });
      this.end(JSON.stringify(data));
    };

    /**
     * Method to render HTML file.
     * @param {string} fileName - The name of the HTML file to render
     * @returns {void}
     * @description The HTML file should be located in the "views" directory of the parent module.
     */
    res.render = function (fileName) {
      if (!this.statusCode) {
        this.statusCode = 200; // Default status code
      }
      const dataPath = module.parent.path + "/views/" + fileName;
      let htmlReadStream = fs.createReadStream(dataPath);
      htmlReadStream.pipe(this);
      htmlReadStream.on("error", (error) => {
        this.status(500).json({ Error: `Couldn't read HTML file. ${error}` });
      });
    };
    /**
     * Method to set response status code
     * @param {number} statusCode
     */
    res.status = function (statusCode) {
      this.statusCode = statusCode;
      return this;
      // this method doesn't write heads, it only sets the status and doesn't send it.
    };
    res.redirect = function (url) {
      this.writeHead(302, { location: url });
      this.end();
    };
    /**
     * Sets a cookie on the response object.
     * @param {Object} options - The options for creating the cookie.
     * @param {string} options.key - The name of the cookie.
     * @param {string} options.value - The value of the cookie.
     * @param {Date} [options.expires] - The expiration date of the cookie.
     * @param {number} [options.maxAge] - The maximum age of the cookie in seconds.
     * @param {string} [options.domain] - The domain associated with the cookie.
     * @param {string} [options.path] - The path within the domain where the cookie is valid.
     * @param {boolean} [options.secure] - Indicates if the cookie should only be sent over secure (HTTPS) connections.
     * @param {boolean} [options.httpOnly] - Indicates if the cookie should be inaccessible to client-side JavaScript.
     * @param {string} [options.sameSite] - Specifies the SameSite attribute of the cookie ('Strict', 'Lax', 'None').
     * @throws {Error} If either the key or value is not provided.
     */
    res.cookie = function (options = {}) {
      if (!options.key || !options.value) {
        throw new Error("Both the key and value are required to set a cookie");
      }
      const cookieString = cookieStringifier(options);
      this.setHeader("Set-Cookie", cookieString);
    };
    /**
     * Sets a  cookie on the response object.
     * @param {string} key - The name of the cookie.
     * @param {string} value - The value of the cookie.
     * @param {string} secretKey - The secret key used for signing the cookie.
     * @param {Object} options - The options for creating the cookie.
     * @param {Date} [options.expires] - The expiration date of the cookie.
     * @param {number} [options.maxAge] - The maximum age of the cookie in seconds.
     * @param {string} [options.domain] - The domain associated with the cookie.
     * @param {string} [options.path] - The path within the domain where the cookie is valid.
     * @param {boolean} [options.secure] - Indicates if the cookie should only be sent over secure (HTTPS) connections.
     * @param {boolean} [options.httpOnly] - Indicates if the cookie should be inaccessible to client-side JavaScript.
     * @param {string} [options.sameSite] - Specifies the SameSite attribute of the cookie ('Strict', 'Lax', 'None').
     * @throws {Error} If either the key, value, or secretKey is not provided.
     */
    res.signedCookie = function (options = {}) {
      if (!options.key || !options.value) {
        throw new Error("Both the key and value are require to set a cookie");
      }
      if (!options.secretKey)
        throw new Error("a secret key is required to set a signed cookie");
      secretKey = options.secretKey;
      const cookieString = cookieStringifier(options);
      this.setHeader("Set-Cookie", cookieString);
    };
    res.deleteCookie = function (cookieName) {
      const expiredCookie = `${cookieName}=deleted Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      this.setHeader("Set-Cookie", expiredCookie);
    };
  }

  // Private method to execute middleware functions
  async #executeMiddleware(req, res, index, requestMiddleware) {
    if (index === 0) this.middleware.push(...requestMiddleware);

    if (index < this.middleware.length) {
      const nextMiddleware = async () => {
        await this.#executeMiddleware(req, res, index + 1, requestMiddleware);
      };
      this.middleware[index](req, res, nextMiddleware); // Call current middleware
      if (index === this.middleware.length - 1) {
        for (const funcToRemove of requestMiddleware) {
          // Remove middleware function after execution
          this.middleware = this.middleware.filter(
            (func) => func != funcToRemove
          );
        }
      }
    }
  }

  /**
   * Method to handle GET requests.
   * @param {string} url - The URL to handle.
   * @param {...Function} args - Additional arguments (functions).
   */
  get(url, ...args) {
    this.#handleRequest(url, "GET", args);
  }

  /**
   * Method to handle POST requests.
   * @param {string} url - The URL to handle.
   * @param {...Function} args - Additional arguments (functions).
   */
  post(url, ...args) {
    this.#handleRequest(url, "POST", args);
  }

  /**
   * Method to handle PUT requests.
   * @param {string} url - The URL to handle.
   * @param {...Function} args - Additional arguments (functions).
   */
  put(url, ...args) {
    this.#handleRequest(url, "PUT", args);
  }

  /**
   * Method to handle PATCH requests.
   * @param {string} url - The URL to handle.
   * @param {...Function} args - Additional arguments (functions).
   */
  patch(url, ...args) {
    this.#handleRequest(url, "PATCH", args);
  }

  /**
   * Method to handle DELETE requests.
   * @param {string} url - The URL to handle.
   * @param {...Function} args - Additional arguments (functions).
   */
  delete(url, ...args) {
    this.#handleRequest(url, "DELETE", args);
  }

  /**
   * Method to start the server.
   * @param {number} port - The port to listen on.
   * @param {Function} callback - The callback function to execute once the server starts.
   */
  listen(port, callback) {
    this.lork.listen(port, callback);
  }

  /**
   * Method to use global middleware.
   * @param {...Function} args - The middleware functions to use.
   */
  use(...args) {
    this.middleware.push(...args);
  }

  // Method to parse the request body
  bodyParser(req, res, next) {
    // eslint-disable-next-line no-undef
    const uploadDir = path.join(__dirname, "../../uploads");

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      multiples: true,
      uploadDir,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      let normalizedFields = {};
      for (const key of Object.keys(fields)) {
        const value = fields[key];
        if (Array.isArray(value)) {
          normalizedFields[key] = value.length === 1 ? value[0] : value;
        } else {
          normalizedFields[key] = value;
        }
      }
      req.fields = normalizedFields;
      req.files = files;
      next();
    });
  }

  // Method to register router
  useRouter(router) {
    const routes = router.routes;
    for (const route of routes) {
      const url = Object.keys(route)[0];
      const method = route[url].method;
      const requestMiddleware = route[url].requestMiddleware;
      router.routerMiddleware.push(...requestMiddleware);
      this.#handleRequest(url, method, router.routerMiddleware);
      for (const funcToRemove of requestMiddleware) {
        router.routerMiddleware = router.routerMiddleware.filter(
          (func) => func != funcToRemove
        );
      }
    }
  }
}
module.exports = Lork;