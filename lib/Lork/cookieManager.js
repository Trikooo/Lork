const { signCookie, verifySignedCookie } = require("./hashing");

/**
 * Parses cookies from the request headers.
 * @param {Object} req - The HTTP request object.
 * @returns {Object} An object containing parsed regular and signed cookies.
 */
/**
 * Parses cookies from the request headers.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {string} secretKey - The secret key used for signing the cookie.
 * @returns {void} Modifies req.cookies to include parsed regular and signed cookies.
 */
function parseCookies(req, res, secretKey) {
  const { cookie } = req.headers;
  let parsedCookies = {
    cookies: {},
    signedCookies: {},
  };

  if (cookie) {
    const cookieArray = cookie.split(";");
    for (let cookieStr of cookieArray) {
      cookieStr = cookieStr.trim();
      const matchSigned = cookieStr.match(/^([^=]+)=(.+)\.(.+)$/); // Regex for signed cookies
      const matchUnsigned = cookieStr.match(/^([^=]+)=(.+)$/); // Regex for unsigned cookies

      if (matchSigned && secretKey) {
        const [, key, value, signature] = matchSigned;
        if (verifySignedCookie(value, signature, secretKey)) {
          parsedCookies.signedCookies[key] = { value, signature };
        } else {
          res.deleteCookie(key);
          console.log(
            `Invalid signed cookie detected for ${key}, cookie has been deleted.`
          );
        }
      } else if (matchUnsigned) {
        const [, key, value] = matchUnsigned;
        if (!value.includes(".")) parsedCookies.cookies[key] = value;
      }
    }
  }
  return parsedCookies;
}
/**
 * Generates a string representation of a cookie based on the provided options.
 * @param {Object} options - The options for creating the cookie string.
 * @param {string} options.key - The name of the cookie.
 * @param {string} options.value - The value of the cookie.
 * @param {string} [options.secretKey] - The secret key of the cookie.
 * @param {Date} [options.expires] - The expiration date of the cookie.
 * @param {number} [options.maxAge] - The maximum age of the cookie in seconds.
 * @param {string} [options.domain] - The domain associated with the cookie.
 * @param {string} [options.path] - The path within the domain where the cookie is valid.
 * @param {boolean} [options.secure] - Indicates if the cookie should only be sent over secure (HTTPS) connections.
 * @param {boolean} [options.httpOnly] - Indicates if the cookie should be inaccessible to client-side JavaScript.
 * @param {string} [options.sameSite] - Specifies the SameSite attribute of the cookie ('Strict', 'Lax', 'None').
 * @returns {string} The string representation of the cookie.
 */
function cookieStringifier(options = {}) {
  let cookieString = "";
  if (!options.secretKey) {
    cookieString = `${options.key}=${options.value}`;
  } else {
    cookieString = signCookie(options.key, options.value, options.secretKey);
  }

  if (options.expires)
    cookieString += `; Expires=${options.expires.toUTCString()}`;
  if (options.maxAge) cookieString += `; Max-Age=${options.maxAge / 1000}`;
  if (options.domain) cookieString += `; Domain=${options.domain}`;
  if (options.path) cookieString += `; Path=${options.path}`;
  if (options.secure) cookieString += `; Secure`;
  if (options.httpOnly) cookieString += `; HttpOnly`;
  if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
  return cookieString;
}
module.exports = { parseCookies, cookieStringifier };
