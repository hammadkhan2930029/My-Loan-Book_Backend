# Phase 1 Auth Backend Postman Testing Guide

Base URL:

```text
http://localhost:5000
```

Before testing:

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```text
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/myloanbook
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

3. Start MongoDB locally.

4. Start server:

```bash
npm run dev
```

Expected terminal output:

```text
MongoDB connected: 127.0.0.1
Server running in development mode on port 5000
```

## 1. Database Connection Verification

Request:

```text
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "API health check passed"
}
```

If the server starts and this route works, Express is running. If terminal shows
`MongoDB connected`, database connection is working.

## 2. Register User

Request:

```text
POST http://localhost:5000/api/auth/register
```

Body:

```json
{
  "fullName": "Sara Khan",
  "email": "sara.khan@example.com",
  "phone": "+923001234567",
  "password": "password123"
}
```

Expected success:

```json
{
  "success": true,
  "message": "Registration successful",
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": "USER_ID",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": null
  }
}
```

Save the returned `token` if needed, though the login token is usually used for
the next tests.

## 3. Login User

Request:

```text
POST http://localhost:5000/api/auth/login
```

Body:

```json
{
  "phone": "+923001234567",
  "password": "password123"
}
```

Expected success:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN_HERE",
  "reg_code": "A7K2P9",
  "user": {
    "id": "USER_ID",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": "A7K2P9"
  }
}
```

Copy the returned `token` for `/me`.

## 4. Verify reg_code Is Generated On Login

Check these points in the login response:

```text
reg_code exists
reg_code length is 6
reg_code has only A-Z and 0-9
user.reg_code matches top-level reg_code
```

Example valid values:

```text
A7K2P9
Q9Z1MX
71ABCD
```

Login again with the same user. Expected result:

```text
A new reg_code should be generated and saved.
```

## 5. Get Current User /me With Bearer Token

Request:

```text
GET http://localhost:5000/api/auth/me
```

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Expected success:

```json
{
  "success": true,
  "message": "Current user profile fetched",
  "user": {
    "id": "USER_ID",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": "A7K2P9"
  }
}
```

Expected: no `password` field in response.

## 6. Forgot Password Flow

Request:

```text
POST http://localhost:5000/api/auth/forgot-password
```

Body:

```json
{
  "email": "sara.khan@example.com"
}
```

Expected success:

```json
{
  "success": true,
  "message": "Password reset token generated",
  "resetToken": "RESET_TOKEN_HERE",
  "expiresInMinutes": 15
}
```

Copy `resetToken` for the next step.

## 7. Reset Password Flow

Request:

```text
POST http://localhost:5000/api/auth/reset-password
```

Body:

```json
{
  "token": "RESET_TOKEN_HERE",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

Expected success:

```json
{
  "success": true,
  "message": "Password reset successful",
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": "USER_ID",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": "A7K2P9"
  }
}
```

Now test login:

```json
{
  "phone": "+923001234567",
  "password": "newpassword123"
}
```

Expected: login succeeds and returns a fresh `reg_code`.

## 8. Invalid Login Test

Request:

```text
POST http://localhost:5000/api/auth/login
```

Body:

```json
{
  "phone": "+923001234567",
  "password": "wrongpassword"
}
```

Expected failure:

```json
{
  "success": false,
  "message": "Invalid phone number or password"
}
```

Expected status:

```text
401 Unauthorized
```

## 9. Duplicate Email Test

Request:

```text
POST http://localhost:5000/api/auth/register
```

Use the same email again:

```json
{
  "fullName": "Sara Khan",
  "email": "sara.khan@example.com",
  "phone": "+923009999999",
  "password": "password123"
}
```

Expected failure:

```json
{
  "success": false,
  "message": "Email is already registered"
}
```

Expected status:

```text
409 Conflict
```

## 10. Missing Token Test

Request:

```text
GET http://localhost:5000/api/auth/me
```

Do not send the `Authorization` header.

Expected failure:

```json
{
  "success": false,
  "message": "Authentication token is required"
}
```

Expected status:

```text
401 Unauthorized
```

## 11. Invalid Token Test

Request:

```text
GET http://localhost:5000/api/auth/me
```

Headers:

```text
Authorization: Bearer invalid.token.value
```

Expected failure:

```json
{
  "success": false,
  "message": "Authentication token is invalid or expired"
}
```

Expected status:

```text
401 Unauthorized
```

## 12. Expected Success Cases

These should pass:

```text
GET /api/health
POST /api/auth/register with unique email and phone
POST /api/auth/login with correct credentials
GET /api/auth/me with valid bearer token
POST /api/auth/forgot-password with registered email
POST /api/auth/reset-password with valid reset token
POST /api/auth/login with new password after reset
```

## 13. Expected Failure Cases

These should fail cleanly:

```text
Register without fullName
Register with invalid email
Register with password shorter than 8 characters
Register with duplicate email
Register with duplicate phone
Login with wrong password
Login with unknown phone
Forgot password with unknown email
Reset password with invalid token
Reset password with expired token
/me without token
/me with invalid token
/me with expired token
Unknown route such as /api/auth/not-real
```

## Postman Tip

Create an environment variable:

```text
base_url = http://localhost:5000
token = JWT_TOKEN_HERE
resetToken = RESET_TOKEN_HERE
```

Then use:

```text
{{base_url}}/api/auth/login
Authorization: Bearer {{token}}
```
