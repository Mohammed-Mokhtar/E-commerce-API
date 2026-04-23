# Ecommerce API

Backend API for an e-commerce application built with Express, MongoDB, Stripe, Cloudinary, and JWT authentication.

## Features

- Authentication with email verification and password reset OTP
- Role-based authorization for `user` and `admin`
- User profile management with soft delete, restore, and avatar upload
- Category and subcategory management with Cloudinary image uploads
- Product management with main image upload, gallery upload, filtering, sorting, and pagination
- Cart management with stock validation
- Checkout with `cash on delivery` or Stripe card payment
- Coupon management with local coupon rules and Stripe coupon/promotion-code creation
- Optional coupon discounts during checkout with usage limits and max discount amount
- Stripe webhook handling for successful, failed, and expired checkout sessions
- Joi validation, basic injection detection, Helmet headers, CORS, and security logging

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT
- Joi
- Nodemailer
- Stripe
- Cloudinary
- Multer
- Helmet
- CORS
- Winston

## Project Structure

```txt
src/
  app.controller.js
  main.js
  common/
    email/
  database/
    connection.js
    models/
      cart.model.js
      category.model.js
      checkoutSessionState.model.js
      coupons.model.js
      order.model.js
      product.model.js
      subcategory.model.js
      user.model.js
  middleware/
    auth.js
    imageUpload.js
    sharp.js
  modules/
    auth/
    cart/
    category/
    coupon/
    order/
    product/
    subcategory/
    user/
  utils/
    APIFeatures.js
    cloudinary.js
    detectInjection.js
    logger.js
    validation.js
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
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MAX_FILE_SIZE=5242880
```

`MAX_FILE_SIZE` is used by Multer as a byte limit. For example, `5242880` is 5 MB.

### 3. Optional: create initial admin user

```bash
node scripts/create-admin.js
```

The script uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SALT_ROUNDS`, and `MONGODB_URI`.

### 4. Run the server

```bash
npm start
```

Server starts on:

```txt
http://localhost:PORT
```

Base API URL:

```txt
http://localhost:PORT/api/v1
```

The current CORS configuration allows requests from `http://localhost:3000`.

## Authentication

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

`accessToken` and `refreshToken` are returned from `POST /api/v1/auth/login`.

## File Uploads

Routes that accept images use `multipart/form-data`.

- User profile avatar field: `avatar`
- Category image field: `avatar`
- Subcategory image field: `image`
- Product main image field: `image`
- Product gallery field: `gallery`, up to 5 files

Only image MIME types are accepted. Uploaded images are sent to Cloudinary and stored as secure URLs on the related document.

## API Endpoints

This section explains every mounted API route in the project.

### Quick Index

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | Public | Register user |
| POST | `/api/v1/auth/login` | Public | Login and get tokens |
| GET | `/api/v1/auth/verify-email/:token` | Public | Verify account email |
| POST | `/api/v1/auth/resend-verification` | Public | Send another verification email |
| POST | `/api/v1/auth/forgot-password` | Public | Send OTP for password reset |
| POST | `/api/v1/auth/reset-password` | Public | Reset password with OTP |
| GET | `/api/v1/users/profile` | User/Admin | Get my profile |
| PUT | `/api/v1/users/profile` | User/Admin | Update my profile and avatar |
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
| GET | `/api/v1/products` | Public | List products with filter/sort/pagination |
| GET | `/api/v1/products/:id` | Public | Get product by id |
| GET | `/api/v1/products/category/:categoryId` | Public | Get products by category |
| GET | `/api/v1/products/subcategory/:subcategoryId` | Public | Get products by subcategory |
| POST | `/api/v1/cart` | User/Admin | Add item to cart |
| GET | `/api/v1/cart` | User/Admin | Get my cart |
| PUT | `/api/v1/cart/:productId` | User/Admin | Change item quantity |
| DELETE | `/api/v1/cart/:productId` | User/Admin | Delete one item from cart |
| DELETE | `/api/v1/cart` | User/Admin | Clear my cart |
| POST | `/api/v1/orders/checkout` | User/Admin | Checkout cart with `cod` or `card` |
| GET | `/api/v1/orders` | User/Admin | Get my orders |
| GET | `/api/v1/orders/:id` | User/Admin | Get one of my orders |
| GET | `/api/v1/admin/orders` | Admin | Get all orders |
| PATCH | `/api/v1/admin/orders/:id/status` | Admin | Update order status |
| POST | `/api/v1/admin/coupons` | Admin | Create coupon |
| GET | `/api/v1/admin/coupons` | Admin | List coupons |
| PATCH | `/api/v1/admin/coupons/:id` | Admin | Update coupon |
| DELETE | `/api/v1/admin/coupons/:id` | Admin | Deactivate coupon |
| PATCH | `/api/v1/admin/coupons/activate/:id` | Admin | Activate coupon |
| POST | `/api/v1/coupons` | User/Admin | Check coupon availability |
| POST | `/webhook` | Stripe | Handle Stripe checkout events |

### Request/Response Notes

- Most routes return JSON with at least `message`.
- Validation errors return `400` with a `details` array.
- `GET /api/v1/auth/verify-email/:token` returns HTML.
- Protected routes require `Authorization: Bearer <accessToken>`.
- Image upload routes should use `multipart/form-data`; non-file fields are submitted as normal text fields.
- `/webhook` uses a raw `application/json` body before the global JSON parser so Stripe signatures can be verified.

## Auth APIs

### `POST /api/v1/auth/signup`

- Access: public.
- Purpose: create a new user and send a verification email.
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
  - `name`: required, 2-100 chars
  - `email`: required, valid email
  - `password`: required, 6-50 chars, must include uppercase, lowercase, number, and special character
  - `phone`: optional, 10-20 chars
  - `shippingAddress.city`: optional object, required when `shippingAddress` is sent
- Success: `201` with a message asking the user to verify their account.
- Common errors: `409` email already exists, `400` validation error.

### `POST /api/v1/auth/login`

- Access: public.
- Purpose: login a verified user.
- Body:

```json
{
  "email": "mohamed@example.com",
  "password": "Strong@123"
}
```

- Success: `200` with `accessToken` and `refreshToken`.
- Common errors: `401` wrong credentials, `403` account is not verified.

### `GET /api/v1/auth/verify-email/:token`

- Access: public.
- Purpose: verify an account from the email verification link.
- Success: `200` HTML page.
- Common errors: invalid, expired, missing, or already-used token returns an HTML error response.

### `POST /api/v1/auth/resend-verification`

- Access: public.
- Purpose: send a new verification email.
- Body:

```json
{
  "email": "mohamed@example.com"
}
```

- Success: `200`.
- Common errors: `404` user not found, `409` account already verified.

### `POST /api/v1/auth/forgot-password`

- Access: public.
- Purpose: generate a 6-digit OTP and email it to the user.
- Body:

```json
{
  "email": "mohamed@example.com"
}
```

- Success: `200`.
- Common errors: `404` user not found.

### `POST /api/v1/auth/reset-password`

- Access: public.
- Purpose: reset a password using the emailed OTP.
- Body:

```json
{
  "email": "mohamed@example.com",
  "otp": 123456,
  "newPassword": "NewStrong@123"
}
```

- Success: `200`.
- Common errors: `404` user not found, `400` wrong OTP.

## User APIs

All user routes require authentication.

### `GET /api/v1/users/profile`

- Purpose: return the authenticated user's profile.
- Success: `200` with `profile`.

### `PUT /api/v1/users/profile`

- Purpose: update profile fields and optionally upload an avatar.
- Content type: `multipart/form-data` when uploading `avatar`.
- Form fields:

```txt
name=Mohamed Mokhtar
phone=01000000000
city=Giza
avatar=@avatar.jpg
```

- Validation:
  - `name`: optional, 3-50 chars
  - `phone`: optional, 10-20 chars
  - `city`: optional, 2-50 chars
  - `avatar`: optional image file uploaded to Cloudinary
- Success: `200` with updated `profile`.
- Note: see Known Caveats for the current `city`/`shippingAddress` mismatch.

### `DELETE /api/v1/users/profile`

- Purpose: soft-delete the authenticated user by setting `isDeleted = true`.
- Success: `200`.

### `PATCH /api/v1/users/profile/restore-user/:id`

- Access: admin only.
- Purpose: restore a soft-deleted user.
- Success: `200`.
- Common errors: `404` user not found, `409` user is already active.

## Category APIs

### `POST /api/v1/categories`

- Access: admin only.
- Purpose: create a category.
- Content type: `multipart/form-data` when uploading `avatar`; JSON also works for name-only requests.
- Form fields:

```txt
name=Electronics
avatar=@category.jpg
```

- Validation:
  - `name`: required, 2-50 chars
  - `avatar`: optional image file uploaded to Cloudinary
- Success: `201` with `addedCategory`.
- Common errors: `409` category already exists, `400` validation error.

### `PUT /api/v1/categories/:id`

- Access: admin only.
- Purpose: update category name and optionally replace its avatar.
- Content type: `multipart/form-data` when uploading `avatar`.
- Form fields:

```txt
name=Home Appliances
avatar=@category.jpg
```

- Validation:
  - `name`: required, 2-50 chars
  - `avatar`: optional image file uploaded to Cloudinary
- Success: `200` with `category`.

### `DELETE /api/v1/categories/:id`

- Access: admin only.
- Purpose: soft-delete category.
- Success: `200`.
- Common errors: `404` category not found or already deleted.

### `GET /api/v1/categories`

- Access: public.
- Purpose: list non-deleted categories with populated `subcategories`.
- Success: `200` with `categories`.

### `GET /api/v1/categories/:id/subcategories`

- Access: public.
- Purpose: list subcategories belonging to a category id.
- Success: `200` with `subcategories`.

## Subcategory APIs

### `POST /api/v1/subcategories`

- Access: admin only.
- Purpose: create a subcategory under an existing, active category.
- Content type: `multipart/form-data` when uploading `image`; JSON also works for text-only requests.
- Form fields:

```txt
name=Laptops
categoryId=CATEGORY_OBJECT_ID
image=@subcategory.jpg
```

- Validation:
  - `name`: required, 2-50 chars
  - `categoryId`: required
  - `image`: optional image file uploaded to Cloudinary
- Success: `201` with `addedSubcategory`.
- Common errors: `404` category not found, `400` validation error.

### `PUT /api/v1/subcategories/:id`

- Access: admin only.
- Purpose: update subcategory name/category and optionally replace its image.
- Content type: `multipart/form-data` when uploading `image`.
- Form fields:

```txt
name=Gaming Laptops
categoryId=CATEGORY_OBJECT_ID
image=@subcategory.jpg
```

- Validation:
  - `name`: required, 2-50 chars
  - `categoryId`: required
  - `image`: optional image file uploaded to Cloudinary
- Success: `200` with `subcategory`.

### `DELETE /api/v1/subcategories/:id`

- Access: admin only.
- Purpose: soft-delete subcategory.
- Success: `200`.
- Common errors: `404` subcategory not found or already deleted.

### `GET /api/v1/subcategories/:id`

- Access: public.
- Purpose: get subcategory details.
- Success: `200` with `subcategory`.
- Common errors: `404` subcategory not found or deleted.

## Product APIs

### `POST /api/v1/products`

- Access: admin only.
- Purpose: create a product.
- Content type: `multipart/form-data` when uploading `image` or `gallery`.
- Form fields:

```txt
name=iPhone 15
description=128 GB
price=50000
stock=10
category=CATEGORY_OBJECT_ID
subcategory=SUBCATEGORY_OBJECT_ID
image=@main-product.jpg
gallery=@gallery-1.jpg
gallery=@gallery-2.jpg
```

- Validation:
  - `name`: required, 2-100 chars
  - `description`: optional
  - `price`: required, minimum `0`
  - `stock`: required integer, minimum `0`
  - `category`: required
  - `subcategory`: required
  - `image`: optional single image file
  - `gallery`: optional, up to 5 image files
- Success: `201` with `product`.

### `PUT /api/v1/products/:id`

- Access: admin only.
- Purpose: update product fields and optionally replace product images.
- Content type: `multipart/form-data` when uploading `image` or `gallery`.
- Form fields: any editable text field from create plus optional `image` and `gallery` files.
- Success: `200` with updated `product`.
- Common errors: `404` product not found, `400` validation error.

### `PATCH /api/v1/products/:id/stock`

- Access: admin only.
- Purpose: set product stock directly.
- Body:

```json
{
  "stock": 25
}
```

- Validation:
  - `stock`: required integer, minimum `0`
- Success: `200` with updated `product`.
- Note: the product model automatically marks products with `stock === 0` as deleted during save.

### `DELETE /api/v1/products/:id`

- Access: admin only.
- Purpose: soft-delete product.
- Success: `200`.
- Common errors: `404` product not found or already deleted.

### `GET /api/v1/products`

- Access: public.
- Purpose: list non-deleted products with filtering, sorting, and pagination.
- Supported query params:
  - `page`: default `1`
  - `limit`: default `20`
  - `sort`: comma-separated fields, for example `price,-createdAt`
  - `minPrice`
  - `maxPrice`
  - string fields are treated as case-insensitive regex filters
- Example:

```http
GET /api/v1/products?page=1&limit=10&sort=price,-createdAt&minPrice=100&maxPrice=1000&name=phone
```

- Success: `200` with `products`.

### `GET /api/v1/products/:id`

- Access: public.
- Purpose: get one active product by id.
- Success: `200` with `product`.
- Common errors: `404` product not found.

### `GET /api/v1/products/category/:categoryId`

- Access: public.
- Purpose: list active products by category.
- Success: `200` with `products`.
- Common errors: `404` no products found.

### `GET /api/v1/products/subcategory/:subcategoryId`

- Access: public.
- Purpose: list active products by subcategory.
- Success: `200` with `products`.
- Common errors: `404` no products found.

## Cart APIs

All cart routes require authentication.

### `POST /api/v1/cart`

- Purpose: add an item to the cart, or increase quantity if the product already exists in the cart.
- Body:

```json
{
  "productId": "PRODUCT_OBJECT_ID",
  "quantity": 2
}
```

- Validation:
  - `productId`: required
  - `quantity`: required number, minimum `1`
- Success: `201` when creating a new cart, or `200` when updating an existing cart.
- Common errors: `404` product not found, `400` insufficient stock.

### `GET /api/v1/cart`

- Purpose: get the authenticated user's cart.
- Success: `200` with `myCart`.
- Common errors: `404` cart is empty.

### `PUT /api/v1/cart/:productId`

- Purpose: replace quantity for one cart item.
- Body:

```json
{
  "quantity": 3
}
```

- Validation:
  - `quantity`: required number, minimum `1`
- Success: `200` with updated `cart`.
- Common errors: `404` cart or product not found, `400` insufficient stock.

### `DELETE /api/v1/cart/:productId`

- Purpose: remove one item from the cart.
- Success: `200` with a success message and updated `cart` when items remain.
- If the deleted item was the last item, the cart document is deleted and only a success message is returned.

### `DELETE /api/v1/cart`

- Purpose: clear the authenticated user's entire cart.
- Success: `200` with deleted `cart`.
- Common errors: `404` cart is already empty.

## Order APIs (User)

### `POST /api/v1/orders/checkout`

- Access: authenticated user.
- Purpose: checkout the authenticated user's cart with cash on delivery or Stripe card payment.
- Body without coupon:

```json
{
  "paymentMethod": "cod"
}
```

- Body with coupon:

```json
{
  "paymentMethod": "card",
  "coupon": "SAVE10"
}
```

- Validation:
  - `paymentMethod`: required, one of `cod` or `card`
  - `coupon`: optional string, 1-20 chars, also accepts `""` or `null`
- Rules:
  - user profile must include phone and shipping city according to the current checkout check
  - cart must exist and contain items
  - coupon must be active and unexpired when provided
  - checkout enforces total coupon usage limit and per-user usage limit
- Discount behavior:
  - coupon discount is percentage-based using `discountValue`
  - discount amount is capped by `maxAmount`
  - order stores `totalAmountBeforeDiscount`
  - when a coupon is used, order also stores `totalAmountAfterDiscount` and `couponId`
- Payment behavior:
  - `cod`: creates an order immediately and deletes the cart
  - `card`: creates a Stripe Checkout Session and returns `url` plus `session`
  - card checkout uses EGP currency, requires billing address and phone, collects shipping address for Egypt, and expires after 2 hours
  - when no internal coupon is sent, Stripe promotion codes are allowed on the Checkout Session
- Common errors: empty cart, invalid coupon, usage limit reached, out-of-stock items, missing profile shipping data.

### `GET /api/v1/orders`

- Access: authenticated user.
- Purpose: get current user's orders sorted by newest first.
- Success: `200` with `orders`.

### `GET /api/v1/orders/:id`

- Access: authenticated user.
- Purpose: get one order belonging to the authenticated user.
- Success: `200` with `order`.
- Common errors: `404` order not found, `403` not authorized.

## Order APIs (Admin)

### `GET /api/v1/admin/orders`

- Access: admin only.
- Purpose: list all orders with user and product info.
- Success: `200` with `orders`.

### `PATCH /api/v1/admin/orders/:id/status`

- Access: admin only.
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
- Extra behavior: when status becomes `delivered` and payment method is `cod`, `paymentStatus` is automatically set to `paid`.
- Success: `200` with updated `order`.
- Common errors: `404` order not found, `400` validation error.

## Coupon APIs (Admin)

Admin coupon routes require authentication and `admin` role.

### `POST /api/v1/admin/coupons`

- Purpose: create a local coupon and create a matching Stripe coupon/promotion code.
- Body:

```json
{
  "name": "SAVE10",
  "discountValue": 10,
  "usageLimits": 100,
  "perUserLimit": 1,
  "maxAmount": 200,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

- Validation:
  - `name`: required, 2-20 chars
  - `discountValue`: required number, 1-100
  - `usageLimits`: required number, minimum `1`
  - `perUserLimit`: required number, minimum `1`, default `1`
  - `maxAmount`: required number, minimum `1`
  - `expiresAt`: required future date
- Stripe behavior:
  - creates a Stripe coupon with `id` equal to `name`
  - creates a Stripe promotion code with `code` equal to `name`
- Success: `201` with `couponAdded`.

### `GET /api/v1/admin/coupons`

- Purpose: list all coupons.
- Success: `200` with `coupons`.

### `PATCH /api/v1/admin/coupons/:id`

- Purpose: update a local coupon document.
- Body: any of the create fields.
- Success: `200` with `updatedCoupon`.
- Common errors: `404` coupon not found, `400` validation error.

### `DELETE /api/v1/admin/coupons/:id`

- Purpose: deactivate a coupon by setting `active = false`.
- Success: `200` with `deletedCoupon`.
- Common errors: `404` coupon not found, `400` coupon already deactivated.

### `PATCH /api/v1/admin/coupons/activate/:id`

- Purpose: reactivate a coupon by setting `active = true`.
- Success: `200` with `coupon`.
- Common errors: `404` coupon not found, `400` coupon already active.

## Coupon APIs (User)

### `POST /api/v1/coupons`

- Access: authenticated user.
- Purpose: check whether a coupon exists, is active, is not expired, and is still usable by the current user.
- Body:

```json
{
  "name": "SAVE10"
}
```

- Validation:
  - `name`: required, 2-20 chars
- Success: `200` with `couponExist`.
- Common errors:
  - `404` coupon does not exist or is inactive
  - `400` coupon expired or user reached the per-user usage limit
- Note: full checkout validation also checks the coupon's total `usageLimits`.

## Stripe Webhook

### `POST /webhook`

- Access: Stripe server-to-server.
- Content type: raw `application/json`.
- Signature verification:
  - if `WEBHOOK_SIGNING_SECRET` is set, the route verifies `stripe-signature`
  - if `WEBHOOK_SIGNING_SECRET` is not set, the route parses the raw JSON body directly
- Handled events:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.expired`
  - `checkout.session.async_payment_failed`
- Behavior:
  - successful checkout event calls `fulfillCheckout()` to create the order and clear the cart
  - failed or expired checkout event calls `declineCheckout()` to restore product stock
  - `Order.sessionId` is used to avoid creating duplicate orders for the same Stripe session
- Local testing:

```bash
stripe listen --forward-to localhost:3000/webhook
```

Set the generated webhook secret in `WEBHOOK_SIGNING_SECRET`.

## Typical API Flow

1. `POST /api/v1/auth/signup`
2. `GET /api/v1/auth/verify-email/:token` from the verification email
3. `POST /api/v1/auth/login`
4. `GET /api/v1/products`
5. `POST /api/v1/cart`
6. Optional: `POST /api/v1/coupons`
7. `POST /api/v1/orders/checkout`
8. `GET /api/v1/orders`

## Security Notes

- Input validation is handled with Joi.
- Suspicious input patterns are detected by a custom validator.
- Security alerts are logged through Winston to `security.log`.
- Helmet is enabled for HTTP security headers.
- CORS currently allows `http://localhost:3000`.
- Stripe webhook requests are parsed as raw JSON before the global JSON middleware.

## Known Caveats

- The current auth/signup and checkout flow references `shippingAddress.city`, while the user model defines `city` and the profile update validator accepts `city`. Because of this mismatch, checkout shipping-city persistence may need a code alignment before checkout works reliably for every profile update flow.
- `redis` and `express-rate-limit` are installed dependencies, but they are not wired into the current app, so this README does not describe Redis-backed behavior or active rate limiting.
- `checkoutSessionState.model.js` exists in the models folder, but current webhook idempotency is based on `Order.sessionId`.

## Current Script

- `npm start`: run API in watch mode with `node --watch src/main.js`

## Suggestions for Production

- Align user shipping data fields between validation, model, profile update, and checkout.
- Add refresh-token persistence and rotation.
- Add rate limiting for authentication endpoints.
- Add API tests for auth, cart, checkout, coupons, and webhooks.
- Add OpenAPI/Swagger documentation.
- Configure production CORS origins through environment variables.
