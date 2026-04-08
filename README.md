# Ecommerce API

Backend API for an e-commerce app built with Express, MongoDB, and Stripe.

## Features

- Authentication with email verification and password reset (OTP)
- Role-based authorization (`user`, `admin`)
- User profile management (update, soft-delete, restore)
- Category and subcategory management
- Product management with filtering, sorting, and pagination
- Cart management
- Checkout with `cash on delivery` or `Stripe card payment`
- Stripe webhook handling for order fulfillment/failure
- Basic injection detection and security logging

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT
- Joi
- Nodemailer
- Stripe
- Winston

## Project Structure

```txt
src/
  app.controller.js
  main.js
  middleware/
  modules/
    auth/
    user/
    category/
    subcategory/
    product/
    cart/
    order/
  database/
    connection.js
    models/
config/
  env.service.js
scripts/
  create-admin.js
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create `config/.env`:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
VERIFY_TOKEN_EXPIRES_IN=1d
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_app_password
MAIL_FROM="Ecommerce App <your_email@example.com>"
SALT_ROUNDS=10
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
STRIPE_SECRET_KEY=sk_test_xxx
WEBHOOK_SIGNING_SECRET=whsec_xxx
```

### 3. (Optional) Create initial admin user

```bash
node scripts/create-admin.js
```

### 4. Run the server

```bash
npm start
```

Server starts on: `http://localhost:PORT`

Base API URL: `http://localhost:PORT/api/v1`

## Authentication

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

`accessToken` and `refreshToken` are returned from `POST /api/v1/auth/login`.

## API Endpoints

### Auth (`/api/v1/auth`)

- `POST /signup`
  - Body:
    - `name` (required)
    - `email` (required)
    - `password` (required, strong password)
    - `phone` (optional)
    - `shippingAddress.city` (optional)
- `POST /login`
  - Body: `email`, `password`
- `GET /verify-email/:token`
- `POST /resend-verification`
  - Body: `email`
- `POST /forgot-password`
  - Body: `email`
- `POST /reset-password`
  - Body: `email`, `otp`, `newPassword`

### Users (`/api/v1/users`)

- `GET /profile` (auth)
- `PUT /profile` (auth)
  - Body (at least one): `name`, `phone`, `shippingAddress.city`
- `DELETE /profile` (auth)
  - Soft-deletes user account
- `PATCH /profile/restore-user/:id` (auth + admin)
  - Restores soft-deleted user

### Categories (`/api/v1/categories`)

- `POST /` (auth + admin)
  - Body: `name`
- `PUT /:id` (auth + admin)
  - Body: `name`
- `DELETE /:id` (auth + admin)
  - Soft-delete
- `GET /` (public)
  - Returns non-deleted categories with their subcategories
- `GET /:id/subcategories` (public)

### Subcategories (`/api/v1/subcategories`)

- `POST /` (auth + admin)
  - Body: `name`, `categoryId`
- `PUT /:id` (auth + admin)
  - Body: `name`, `categoryId`
- `DELETE /:id` (auth + admin)
  - Soft-delete
- `GET /:id` (public)

### Products (`/api/v1/products`)

- `POST /` (auth + admin)
  - Body: `name`, `price`, `stock`, `category`, `subcategory`
  - Optional: `description`, `images`
- `PUT /:id` (auth + admin)
- `PATCH /:id/stock` (auth + admin)
  - Body: `stock`
- `DELETE /:id` (auth + admin)
  - Soft-delete
- `GET /` (public)
  - Supports query params:
    - `page`, `limit`, `sort`
    - `minPrice`, `maxPrice`
    - String-based filters (regex match), example: `name=phone`
- `GET /:id` (public)
- `GET /category/:categoryId` (public)
- `GET /subcategory/:subcategoryId` (public)

### Cart (`/api/v1/cart`)

All routes require auth.

- `POST /`
  - Body: `productId`, `quantity`
- `GET /`
- `PUT /:productId`
  - Body: `quantity`
- `DELETE /:productId`
- `DELETE /`
  - Clear full cart

### Orders (`/api/v1/orders`)

- `POST /checkout` (auth)
  - Body: `paymentMethod` (`cod` or `card`)
- `GET /` (auth)
  - Get my orders
- `GET /:id` (auth)
  - Get order details (owner or admin)

### Admin Orders (`/api/v1/admin/orders`)

- `GET /` (auth + admin)
  - Get all orders
- `PATCH /:id/status` (auth + admin)
  - Body: `status`
  - Allowed values: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

### Checkout Notes

- User must have both:
  - `shippingAddress.city`
  - `phone`
- `cod`: order is created immediately, cart is deleted.
- `card`: Stripe Checkout session is created and returned as `url`.
- The current code sets Stripe redirect URLs to `/api/v1/order/success` and `/api/v1/order/cancel`. Update these to your frontend URLs in production.

## Stripe Webhook (`/webhook`)

Stripe events handled:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`

Behavior:

- Success events create an order and clear cart.
- Failed/expired events restore product stock.

To test locally with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/webhook
```

Then set returned signing secret in `WEBHOOK_SIGNING_SECRET`.

## Typical Flow (For New Users)

1. Sign up using `POST /api/v1/auth/signup`.
2. Verify email using the link sent by email.
3. Login with `POST /api/v1/auth/login` and save `accessToken`.
4. Browse products from `GET /api/v1/products`.
5. Add items to cart via `POST /api/v1/cart`.
6. Checkout using `POST /api/v1/orders/checkout`.
7. View your orders using `GET /api/v1/orders`.

## Example Request

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "User@123"
}
```

Add to cart:

```http
POST /api/v1/cart
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "productId": "64f0c9cdbf7d1a1f2b9f0111",
  "quantity": 2
}
```

Checkout (card):

```http
POST /api/v1/orders/checkout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "paymentMethod": "card"
}
```

## Security Notes

- Input validation with Joi.
- Basic injection pattern detection in custom validator.
- Security alerts are logged to `security.log`.

## Current Script

- `npm start`: run API in watch mode (`node --watch src/main.js`)

## Suggestions for Production

- Add refresh-token persistence and rotation strategy.
- Add rate limiting for auth endpoints.
- Add centralized error handler.
- Add tests (unit + integration).
- Add API docs via Swagger/OpenAPI.
