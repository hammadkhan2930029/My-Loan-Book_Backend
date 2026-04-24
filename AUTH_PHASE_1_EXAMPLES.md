# Phase 1 Auth API Examples

Base URL:

```text
http://localhost:5000/api/auth
```

## Register

`POST /register`

Request:

```json
{
  "fullName": "Sara Khan",
  "email": "sara.khan@example.com",
  "phone": "+923001234567",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Registration successful",
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": null,
    "createdAt": "2026-04-22T19:20:00.000Z",
    "updatedAt": "2026-04-22T19:20:00.000Z"
  }
}
```

## Login

`POST /login`

Request:

```json
{
  "phone": "+923001234567",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN_HERE",
  "reg_code": "A7K2P9",
  "user": {
    "id": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": "A7K2P9",
    "createdAt": "2026-04-22T19:20:00.000Z",
    "updatedAt": "2026-04-22T19:25:00.000Z"
  }
}
```

Each successful login generates a fresh 6-character uppercase alphanumeric
`reg_code`, saves it on the user, and returns it in the response.

## Forgot Password

`POST /forgot-password`

Request:

```json
{
  "email": "sara.khan@example.com"
}
```

Success response:

```json
{
  "success": true,
  "message": "Password reset token generated",
  "resetToken": "9e8b7a6c5d4f3e2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a",
  "expiresInMinutes": 15
}
```

The plain `resetToken` is returned only for Phase 1 manual testing. Later it
should be emailed instead of exposed in the API response.

## Reset Password

`POST /reset-password`

Request:

```json
{
  "token": "9e8b7a6c5d4f3e2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Password reset successful",
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": "A7K2P9",
    "createdAt": "2026-04-22T19:20:00.000Z",
    "updatedAt": "2026-04-22T19:30:00.000Z"
  }
}
```

## Get Current User

`GET /me`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Success response:

```json
{
  "success": true,
  "message": "Current user profile fetched",
  "user": {
    "id": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Khan",
    "email": "sara.khan@example.com",
    "phone": "+923001234567",
    "reg_code": "A7K2P9",
    "createdAt": "2026-04-22T19:20:00.000Z",
    "updatedAt": "2026-04-22T19:30:00.000Z"
  }
}
```

## Update Current User

`PATCH /me`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Request:

```json
{
  "fullName": "Sara Ahmed",
  "email": "sara.ahmed@example.com",
  "phone": "+923001234568",
  "profilePhoto": "https://example.com/sara.jpg"
}
```

Success response:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Ahmed",
    "email": "sara.ahmed@example.com",
    "phone": "+923001234568",
    "reg_code": "A7K2P9",
    "profilePhoto": "https://example.com/sara.jpg",
    "createdAt": "2026-04-22T19:20:00.000Z",
    "updatedAt": "2026-04-22T19:40:00.000Z"
  }
}
```

## Change Password

`PATCH /change-password`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Request:

```json
{
  "currentPassword": "password123",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Password changed successfully",
  "token": "NEW_JWT_TOKEN_HERE",
  "user": {
    "id": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Ahmed",
    "email": "sara.ahmed@example.com",
    "phone": "+923001234568",
    "reg_code": "A7K2P9",
    "profilePhoto": "https://example.com/sara.jpg",
    "createdAt": "2026-04-22T19:20:00.000Z",
    "updatedAt": "2026-04-22T19:45:00.000Z"
  }
}
```

## Contacts: List Contacts

`GET /api/contacts`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Success response:

```json
{
  "success": true,
  "message": "Contacts fetched successfully",
  "contacts": [
    {
      "id": "6628f3f8b1c2a4d5e6f78911",
      "contactUserId": "6628f3f8b1c2a4d5e6f78910",
      "userId": "47",
      "fullName": "Sara Ahmed",
      "email": "sara.ahmed@example.com",
      "phone": "+923001234568",
      "reg_code": "A7K2P9",
      "profilePhoto": "https://example.com/sara.jpg",
      "createdAt": "2026-04-22T19:50:00.000Z",
      "updatedAt": "2026-04-22T19:50:00.000Z"
    }
  ]
}
```

## Contacts: Add Contact By Reg Code

`POST /api/contacts`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Request:

```json
{
  "reg_code": "A7K2P9"
}
```

Success response:

```json
{
  "success": true,
  "message": "Contact added successfully",
  "contact": {
    "id": "6628f3f8b1c2a4d5e6f78911",
    "contactUserId": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Ahmed",
    "email": "sara.ahmed@example.com",
    "phone": "+923001234568",
    "reg_code": "A7K2P9",
    "profilePhoto": "https://example.com/sara.jpg",
    "createdAt": "2026-04-22T19:50:00.000Z",
    "updatedAt": "2026-04-22T19:50:00.000Z"
  }
}
```

## Contacts: Get Contact Detail

`GET /api/contacts/:id`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Success response:

```json
{
  "success": true,
  "message": "Contact fetched successfully",
  "contact": {
    "id": "6628f3f8b1c2a4d5e6f78911",
    "contactUserId": "6628f3f8b1c2a4d5e6f78910",
    "userId": "47",
    "fullName": "Sara Ahmed",
    "email": "sara.ahmed@example.com",
    "phone": "+923001234568",
    "reg_code": "A7K2P9",
    "profilePhoto": "https://example.com/sara.jpg",
    "createdAt": "2026-04-22T19:50:00.000Z",
    "updatedAt": "2026-04-22T19:50:00.000Z"
  }
}
```

## Transactions: Create Transaction

`POST /api/transactions`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Request:

```json
{
  "contactId": "6628f3f8b1c2a4d5e6f78911",
  "type": "gave",
  "amount": 5000,
  "transactionDate": "2026-04-23T12:00:00.000Z",
  "note": "Loan for groceries",
  "attachment": ""
}
```

Success response:

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction": {
    "id": "6628f3f8b1c2a4d5e6f78912",
    "contactId": "6628f3f8b1c2a4d5e6f78911",
    "contactUserId": "6628f3f8b1c2a4d5e6f78910",
    "contactName": "Sara Ahmed",
    "contactPhoto": "https://example.com/sara.jpg",
    "type": "gave",
    "amount": 5000,
    "transactionDate": "2026-04-23T12:00:00.000Z",
    "note": "Loan for groceries",
    "attachment": "",
    "createdAt": "2026-04-23T12:01:00.000Z",
    "updatedAt": "2026-04-23T12:01:00.000Z"
  }
}
```

## Transactions: List Transactions

`GET /api/transactions`

Optional query:

```text
?contactId=6628f3f8b1c2a4d5e6f78911&type=gave
```

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Success response:

```json
{
  "success": true,
  "message": "Transactions fetched successfully",
  "transactions": []
}
```

## Transactions: Get Transaction Detail

`GET /api/transactions/:id`

Headers:

```text
Authorization: Bearer JWT_TOKEN_HERE
```

Success response:

```json
{
  "success": true,
  "message": "Transaction fetched successfully",
  "transaction": {
    "id": "6628f3f8b1c2a4d5e6f78912",
    "contactId": "6628f3f8b1c2a4d5e6f78911",
    "contactUserId": "6628f3f8b1c2a4d5e6f78910",
    "contactName": "Sara Ahmed",
    "contactPhoto": "https://example.com/sara.jpg",
    "type": "gave",
    "amount": 5000,
    "transactionDate": "2026-04-23T12:00:00.000Z",
    "note": "Loan for groceries",
    "attachment": "",
    "createdAt": "2026-04-23T12:01:00.000Z",
    "updatedAt": "2026-04-23T12:01:00.000Z"
  }
}
```

## Common Error Examples

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    }
  ]
}
```

Missing auth token:

```json
{
  "success": false,
  "message": "Authentication token is required"
}
```

Invalid login:

```json
{
  "success": false,
  "message": "Invalid phone number or password"
}
```
