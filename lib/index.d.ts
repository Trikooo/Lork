declare module "Lork" {
  // Define custom request type
  interface LorkRequest {
    session?: { [key: string]: any }; // Stores session data
    fields: { [key: string]: any }; // Stores parsed request fields
    files: {[key: string]: any}; // Stores file information
    user?: any; // Optional user object after authentication
    [key: string]: any; // Allow additional properties
  }

  // Define custom response type
  interface LorkResponse {
    send(data: any): this;
    json(data: any): this;
    render(fileName: string): void;
    status(statusCode: number): this;
    redirect(url: string): void;
    cookie(options: {
      key: string;
      value: string;
      expires?: Date;
      maxAge?: number;
      domain?: string;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }): void;
    signedCookie(options: {
      key: string;
      value: string;
      secretKey: string;
      expires?: Date;
      maxAge?: number;
      domain?: string;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }): void;
    deleteCookie(cookieName: string): void;
  }

  // Define type for the next function in middleware
  type NextFunction = (err?: any) => void;

  // Define the Router class
  class Router {
    constructor();

    get(url: string, ...middleware: Function[]): void;
    post(url: string, ...middleware: Function[]): void;
    put(url: string, ...middleware: Function[]): void;
    patch(url: string, ...middleware: Function[]): void;
    delete(url: string, ...middleware: Function[]): void;
    use(...middleware: Function[]): void;
  }

  // Define the LocalAuth class
  class LocalAuth {
    constructor(options: { User: any; verify?: Function; serialize?: Function; deserialize?: Function });
    initialize(): (req: LorkRequest, res: LorkResponse, next: NextFunction) => Promise<void>; // Middleware to initialize session
    authenticate(): (req: LorkRequest, res: LorkResponse, next: NextFunction) => Promise<void>; // Middleware for authentication
  }

  // Define the SessionOptions type
  interface SessionOptions {
    resave?: boolean; // Forces the session to be saved back to the session store
    saveUninitialized?: boolean; // Forces an uninitialized session to be saved
    store?: any; // Setup a store for sessions
    cookie: {
      key?: string; // The name of the session cookie
      secretKey: string; // A secret key for signing the session ID cookie
      expires?: Date; // The expiration date of the cookie
      maxAge?: number; // The maximum age of the cookie in milliseconds
      domain?: string; // The domain for which the cookie is valid
      path?: string; // The path within the domain for which the cookie is valid
      secure?: boolean; // Indicates if the cookie should only be sent over HTTPS
      httpOnly?: boolean; // Indicates if the cookie is inaccessible to client-side JavaScript
      sameSite?: "Strict" | "Lax" | "None"; // Specifies the SameSite attribute of the cookie
    };
  }

  // Define the session function type
  function session(options: SessionOptions): (req: LorkRequest, res: LorkResponse, next: NextFunction) => Promise<void>;

  // Define the Lork class
  class Lork {
    constructor(options?: { port?: number; sessionOptions?: SessionOptions }); // Optional constructor parameters
    start(): Promise<void>; // Start the server
    use(router: Router): void; // Use a router instance
    session(options?: SessionOptions): (req: LorkRequest, res: LorkResponse, next: NextFunction) => Promise<void>; // Session middleware function
  }

  // Export classes and functions
  export { Router, LocalAuth, Lork, session };
}
