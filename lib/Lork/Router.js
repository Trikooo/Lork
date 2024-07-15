/**
 * Router class for defining routes and middleware.
 */
class Router {
  /**
   * Constructs a new Router instance.
   */
  constructor() {
    /**
     * An array to store defined routes.
     * @type {Array<Object>}
     */
    this.routes = [];

    /**
     * An array to store middleware functions applied to this route instance
     * @type {Array<Function>}
     */
    this.routerMiddleware = [];
  }

  /**
   * Adds a GET route to the router.
   * @param {string} url - The URL path for the route.
   * @param {...Function} args - Request middleware functions for the route.
   */
  get(url, ...args) {
    this.routes.push({
      [url]: {
        method: "GET",
        requestMiddleware: args,
      },
    });
  }

  /**
   * Adds a POST route to the router.
   * @param {string} url - The URL path for the route.
   * @param {...Function} args - Request middleware functions for the route.
   */
  post(url, ...args) {
    this.routes.push({
      [url]: {
        method: "POST",
        requestMiddleware: args,
      },
    });
  }

  /**
   * Adds a PUT route to the router.
   * @param {string} url - The URL path for the route.
   * @param {...Function} args - Request middleware functions for the route.
   */
  put(url, ...args) {
    this.routes.push({
      [url]: {
        method: "PUT",
        requestMiddleware: args,
      },
    });
  }

  /**
   * Adds a PATCH route to the router.
   * @param {string} url - The URL path for the route.
   * @param {...Function} args - Request middleware functions for the route.
   */
  patch(url, ...args) {
    this.routes.push({
      [url]: {
        method: "PATCH",
        requestMiddleware: args,
      },
    });
  }

  /**
   * Adds a DELETE route to the router.
   * @param {string} url - The URL path for the route.
   * @param {...Function} args - Request middleware functions for the route.
   */
  delete(url, ...args) {
    this.routes.push({
      [url]: {
        method: "DELETE",
        requestMiddleware: args,
      },
    });
  }

  /**
   * Adds middleware functions to be applied to all routes.
   * @param {...Function} args - Middleware functions.
   */
  use(...args) {
    for(const arg of args){
      const routes = arg.routes
      for(const route of routes){
        this.routes.push(route)
      }

    }
  }
}

module.exports = Router;
