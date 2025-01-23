# Backend for a Blog Application

The backend is built with Express.js and TypeScript, the database is managed using the Mongoose ODM, Redis for Chacing, Cloudinary for saving the image, and authentication is implemented with JsonWebToken and OAuth2 for Google Login. It includes mailing features for OTP registration and order notifications using Nodemailer and EJS. We can post a blog, like it, add a comment and reply it.

## Run Locally

Clone the project

```bash
  git clone https://github.com/faukiofficial/blog-mern-ts.git
```

Go to the project directory

```bash
  cd backend
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`NODE_ENV`

`CLIENT_URL`

`PORT`

`MONGODB_URI`

`REDIS_URI`

`CLOUDINARY_CLOUD_NAME`

`CLOUDINARY_API_KEY`

`CLOUDINARY_API_SECRET`

`ACTIVATION_TOKEN_SECRET`

`JWT_SECRET`

`JWT_SECRET_REFRESH_TOKEN`

`SMTP_HOST`

`SMTP_PORT`

`SMTP_SERVICE`

`SMTP_MAIL`

`SMTP_PASSWORD`
