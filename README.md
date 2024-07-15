# Lork Framework

Lork is a lightweight and flexible Node.js framework designed for building backend applications. It provides essential features like routing, session management, and authentication, all while giving you the freedom to implement custom logic.

## Features

- **Custom Routing**: Define routes effortlessly.
- **Session Management**: Built-in support for session handling, including memory and custom stores.
- **Authentication**: Easily integrate authentication systems.
- **Response Handling**: Custom response methods for sending JSON, HTML, and cookies.
- **Lightweight**: Minimal footprint, focused on core functionalities.

## Installation

To install Lork, use npm:

```bash
npm install lork
```

## Getting Started
Here's a simple example to get you started:

```javascript
const { Lork } = require('lork');

const app = new Lork();

app.get('/', (req, res) => {
  console.log(req.fields); // your body fields are stored here.
  console.log(req.files); // your files are stored here.
  res.send('Hello, world!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

## Middleware
### Session Middleware
To use session management:
```javascript
const { session } = require('lork');

app.use(session({
  cookie: {
    key: 'connect.sid',
    secretKey: 'your-secret-key',
    maxAge: 3600000, // 1 hour
  },
  store: /* your store options here */
}));
```
### Authentication middleware

```javascript
const { LocalAuth } = require("lork");
const User = require("path/to/your/user/model");

const auth = LocalAuth({User: User});
app.post("/login", auth.authenticate(), (req, res) => {
  if(req.session.userId){
    res.json({msg: "successfully authenticated"});
  }else{
    res.status(400).json({msg: "bad request"});
  }
});
```


## Response Methods
Lork provides several methods for response handling:

- `res.send(data)`: Send plain text response.
- `res.json(data)`: Send JSON response.
- `res.render(fileName)`: Render an HTML file from the views directory.
- `res.status(statusCode)`: Set response status code.
- `res.redirect(url)`: Redirect to a different URL.
- `res.cookie(options)`: Set a cookie.
- `res.signedCookie(options)`: Set a signed cookie.
- `res.deleteCookie(cookieName)`: Delete a cookie.

## Contributing
Contributions are welcome! This software needs some improvements. Please open an issue or submit a pull request.
## License
This project is licensed under the MIT License - see the LICENSE file for details.
## Acknowledgments
Thanks to allah and to the open-source community for inspiration and resources
