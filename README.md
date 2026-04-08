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

This section explains every API route in the project.

### Quick Index

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | Public | Register user |
| POST | `/api/v1/auth/login` | Public | Login and get tokens |
| GET | `/api/v1/auth/verify-email/:token` | Public | Verify account email |
| POST | `/api/v1/auth/resend-verification` | Public | Send another verification email |
| POST | `/api/v1/auth/forgot-password` | Public | Send OTP for reset |
| POST | `/api/v1/auth/reset-password` | Public | Reset password with OTP |
| GET | `/api/v1/users/profile` | User/Admin | Get my profile |
| PUT | `/api/v1/users/profile` | User/Admin | Update my profile |
| DELETE | `/api/v1/users/profile` | User/Admin | Soft-delete my account |
| PATCH | `/api/v1/users/profile/restore-user/:id` | Admin | Restore soft-deleted user |
| POST | `/api/v1/categories` | Admin | Create category |
| PUT | `/api/v1/categories/:id` | Admin | Update category |
| DELETE | `/api/v1/categories/:id` | Admin | Soft-delete category |
| GET | `/api/v1/categories` | Public | Get all active categories |
| GET | `/api/v1/categories/:id/subcategories` | Public | Get subcategories by category |
| POST | `/api/v1/subcategories` | Admin | Create subcategory |
| PUT | `/api/v1/subcategories/:id` | Admin | Update subcategory |
| DELETE | `/api/v1/subcategories/:id` | Admin | Soft-delete subcategory |
| GET | `/api/v1/subcategories/:id` | Public | Get subcategory details |
| POST | `/api/v1/products` | Admin | Create product |
| PUT | `/api/v1/products/:id` | Admin | Update product |
| PATCH | `/api/v1/products/:id/stock` | Admin | Update product stock |
| DELETE | `/api/v1/products/:id` | Admin | Soft-delete product |
| GET | `/api/v1/products` | Public | List products (filter/sort/paginate) |
| GET | `/api/v1/products/:id` | Public | Get product by id |
| GET | `/api/v1/products/category/:categoryId` | Public | Get products by category |
| GET | `/api/v1/products/subcategory/:subcategoryId` | Public | Get products by subcategory |
| POST | `/api/v1/cart` | User/Admin | Add item to cart |
| GET | `/api/v1/cart` | User/Admin | Get my cart |
| PUT | `/api/v1/cart/:productId` | User/Admin | Change item quantity |
| DELETE | `/api/v1/cart/:productId` | User/Admin | Delete one item from cart |
| DELETE | `/api/v1/cart` | User/Admin | Clear my cart |
| POST | `/api/v1/orders/checkout` | User/Admin | Checkout cart (`cod` or `card`) |
| GET | `/api/v1/orders` | User/Admin | Get my orders |
| GET | `/api/v1/orders/:id` | User/Admin | Get one of my orders |
| GET | `/api/v1/admin/orders` | Admin | Get all orders |
| PATCH | `/api/v1/admin/orders/:id/status` | Admin | Update order status |
| POST | `/webhook` | Stripe | Handle Stripe checkout events |

### Request/Response Notes

- Most routes return JSON with at least `message`.
- Auth routes and validation errors may return `details` array for Joi errors.
- `GET /api/v1/auth/verify-email/:token` returns HTML (not JSON).
- Protected routes need:

```http
Authorization: Bearer <accessToken>
```

### 1) Auth APIs

#### `POST /api/v1/auth/signup`

- Purpose: create a new user and send verification email.
- Body:

```json
{
  "name": "Mohamed",
  "email": "mohamed@example.com",
  "password": "Strong@123",
  "phone": "01000000000",
  "shippingAddress": {
    "city": "Cairo"
  }
}
```

- Validation:
  - `name`: 2-100 chars
  - `email`: valid email
  - `password`: 6-50 chars, must include upper/lower/number/special
  - `phone`: optional, 10-20 chars
  - `shippingAddress.city`: optional object, if provided city is required
- Success: `201` with message about email verification.
- Common errors: `409` email exists, `400` validation error.

#### `POST /api/v1/auth/login`

- Purpose: login verified user.
- Body:

```json
{
  "email": "mohamed@example.com",
  "password": "Strong@123"
}
```

- Success: `200` with `accessToken` and `refreshToken`.
- Common errors:
  - `401` wrong email/password
  - `403` user not verified

#### `GET /api/v1/auth/verify-email/:token`

- Purpose: verify account from email link.
- Success: HTML page "Email verified successfully".
- Common errors: invalid/expired token returns HTML error page.

#### `POST /api/v1/auth/resend-verification`

- Purpose: send new verification email.
- Body: `{ "email": "mohamed@example.com" }`
- Success: `200`
- Common errors: `404` user not found, `409` already verified.

#### `POST /api/v1/auth/forgot-password`

- Purpose: generate OTP and email it to user.
- Body: `{ "email": "mohamed@example.com" }`
- Success: `200` ("otp sent successfully")
- Common errors: `404` user not found.

#### `POST /api/v1/auth/reset-password`

- Purpose: reset password using OTP.
- Body:

```json
{
  "email": "mohamed@example.com",
  "otp": 123456,
  "newPassword": "NewStrong@123"
}
```

- Success: `200`
- Common errors: `404` user not found, `400` wrong OTP.

### 2) User APIs

#### `GET /api/v1/users/profile`

- Access: authenticated user.
- Purpose: return authenticated user profile.
- Success: `200` with `profile`.

#### `PUT /api/v1/users/profile`

- Access: authenticated user.
- Purpose: update profile fields.
- Body (at least one required):

```json
{
  "name": "Mohamed Mokhtar",
  "phone": "01000000000",
  "shippingAddress": {
    "city": "Giza"
  }
}
```

- Success: `200` with updated `profile`.
- Common errors: `400` if body is empty or invalid.

#### `DELETE /api/v1/users/profile`

- Access: authenticated user.
- Purpose: soft-delete current user (`isDeleted = true`).
- Success: `200`.

#### `PATCH /api/v1/users/profile/restore-user/:id`

- Access: admin only.
- Purpose: restore a deleted user.
- Success: `200`.
- Common errors: `404` user not found, `409` already active.

### 3) Category APIs

#### `POST /api/v1/categories`

- Access: admin.
- Purpose: create category.
- Body: `{ "name": "Electronics" }`
- Success: `201` with `addedCategory`.

#### `PUT /api/v1/categories/:id`

- Access: admin.
- Purpose: update category name.
- Body: `{ "name": "Home Appliances" }`
- Success: `200` with `category`.

#### `DELETE /api/v1/categories/:id`

- Access: admin.
- Purpose: soft-delete category.
- Success: `200`.
- Common errors: `404` not found or already deleted.

#### `GET /api/v1/categories`

- Access: public.
- Purpose: list non-deleted categories with populated `subcategories`.
- Success: `200` with `categories`.

#### `GET /api/v1/categories/:id/subcategories`

- Access: public.
- Purpose: list subcategories belonging to category id.
- Success: `200` with `subcategories`.

### 4) Subcategory APIs

#### `POST /api/v1/subcategories`

- Access: admin.
- Purpose: create subcategory under a category.
- Body:

```json
{
  "name": "Laptops",
  "categoryId": "CATEGORY_OBJECT_ID"
}
```

- Success: `201` with `addedSubcategory`.
- Common errors: `404` category not found.

#### `PUT /api/v1/subcategories/:id`

- Access: admin.
- Purpose: update subcategory.
- Body:

```json
{
  "name": "Gaming Laptops",
  "categoryId": "CATEGORY_OBJECT_ID"
}
```

- Success: `200` with `subcategory`.

#### `DELETE /api/v1/subcategories/:id`

- Access: admin.
- Purpose: soft-delete subcategory.
- Success: `200`.
- Common errors: `404` not found/already deleted.

#### `GET /api/v1/subcategories/:id`

- Access: public.
- Purpose: get subcategory details.
- Success: `200` with `subcategory`.

### 5) Product APIs

#### `POST /api/v1/products`

- Access: admin.
- Purpose: create product.
- Body:

```json
{
  "name": "iPhone 15",
  "description": "128 GB",
  "price": 50000,
  "stock": 10,
  "category": "CATEGORY_OBJECT_ID",
  "subcategory": "SUBCATEGORY_OBJECT_ID",
  "images": ["https://..."]
}
```

- Success: `201` with `product`.

#### `PUT /api/v1/products/:id`

- Access: admin.
- Purpose: update product fields.
- Body: any editable fields from create payload.
- Success: `200` with updated `product`.

#### `PATCH /api/v1/products/:id/stock`

- Access: admin.
- Purpose: set product stock directly.
- Body: `{ "stock": 25 }`
- Success: `200` with updated `product`.

#### `DELETE /api/v1/products/:id`

- Access: admin.
- Purpose: soft-delete product.
- Success: `200`.
- Common errors: `404` not found/already deleted.

#### `GET /api/v1/products`

- Access: public.
- Purpose: list products (`isDeleted = false`) with filtering/sorting/pagination.
- Supported query params:
  - `page` (default `1`)
  - `limit` (default `20`)
  - `sort` (example: `price,-createdAt`)
  - `minPrice`, `maxPrice`
  - string fields are treated as case-insensitive regex filters
- Success: `200` with `products`.

#### `GET /api/v1/products/:id`

- Access: public.
- Purpose: get one active product by id.
- Success: `200` with `product`.

#### `GET /api/v1/products/category/:categoryId`

- Access: public.
- Purpose: list products by category.
- Success: `200` with `products`.

#### `GET /api/v1/products/subcategory/:subcategoryId`

- Access: public.
- Purpose: list products by subcategory.
- Success: `200` with `products`.

### 6) Cart APIs

All cart routes require authentication.

#### `POST /api/v1/cart`

- Purpose: add item to cart (or increase quantity if exists).
- Body:

```json
{
  "productId": "PRODUCT_OBJECT_ID",
  "quantity": 2
}
```

- Success: `201` (new cart) or `200` (existing cart updated).
- Common errors: `404` product not found, `400` insufficient stock.

#### `GET /api/v1/cart`

- Purpose: get current user cart.
- Success: `200` with `myCart`.
- Common errors: `404` cart is empty.

#### `PUT /api/v1/cart/:productId`

- Purpose: replace item quantity for one product.
- Body: `{ "quantity": 3 }`
- Success: `200` with updated `cart`.

#### `DELETE /api/v1/cart/:productId`

- Purpose: remove one item from cart.
- Success: `200` with updated `cart` or `deletedItem` if cart becomes empty.

#### `DELETE /api/v1/cart`

- Purpose: clear entire cart.
- Success: `200`.

### 7) Order APIs (User)

#### `POST /api/v1/orders/checkout`

- Access: authenticated user.
- Body:

```json
{
  "paymentMethod": "cod"
}
```

or

```json
{
  "paymentMethod": "card"
}
```

- Rules:
  - user profile must include `shippingAddress.city` and `phone`
  - cart must exist and not be empty
- Behavior:
  - `cod`: creates order immediately, deletes cart
  - `card`: creates Stripe Checkout Session and returns `url` + `session`
- Common errors: empty cart, out-of-stock items, invalid profile data.

#### `GET /api/v1/orders`

- Access: authenticated user.
- Purpose: get current user orders sorted by newest.
- Success: `200` with `orders`.

#### `GET /api/v1/orders/:id`

- Access: authenticated user.
- Purpose: get order details by id.
- Note: current implementation queries with `{ _id: id, user: req.user.id }`, so it returns only the authenticated user's own order.
- Success: `200` with `order`.
- Common errors: `404` order not found.

### 8) Order APIs (Admin)

#### `GET /api/v1/admin/orders`

- Access: admin.
- Purpose: list all orders with user and product info.
- Success: `200` with `orders`.

#### `PATCH /api/v1/admin/orders/:id/status`

- Access: admin.
- Purpose: update `orderStatus`.
- Body:

```json
{
  "status": "processing"
}
```

- Allowed `status` values:
  - `pending`
  - `processing`
  - `shipped`
  - `delivered`
  - `cancelled`
- Extra behavior: when status becomes `delivered` and payment method is `cod`, `paymentStatus` is auto-set to `paid`.
- Success: `200` with updated `order`.

### 9) Stripe Webhook

#### `POST /webhook`

- Access: Stripe (server-to-server).
- Content-Type: raw `application/json` body (required for signature verification).
- Handled events:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.expired`
  - `checkout.session.async_payment_failed`
- Behavior:
  - successful checkout event => `fulfillCheckout()` creates order + clears cart
  - failed/expired checkout event => `declineCheckout()` restores stock
- Local testing:

```bash
stripe listen --forward-to localhost:3000/webhook
```

Set generated secret in `WEBHOOK_SIGNING_SECRET`.

### Typical API Flow

1. `POST /api/v1/auth/signup`
2. `GET /api/v1/auth/verify-email/:token` (from email)
3. `POST /api/v1/auth/login`
4. `GET /api/v1/products`
5. `POST /api/v1/cart`
6. `POST /api/v1/orders/checkout`
7. `GET /api/v1/orders`

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
