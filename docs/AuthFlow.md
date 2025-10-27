## Auth Flow

- Users register at /register
- They then login at /login
- They get a JWT token and refresh token as a cookie to authenticate themselves
- JWT is sent in the Authorization header as a Bearer Token
- When the JWT is expired, use /refresh endpoint to get a new JWT
- Log out with /logout with revokes refresh tokens
