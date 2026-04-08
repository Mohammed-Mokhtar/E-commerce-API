import { Product } from "../../database/models/product.model.js";
import { Cart } from "../../database/models/cart.model.js";

const calcTotalItemPrice = (price, quantity) =>
  Number((price * quantity).toFixed(2));

const findUserCart = (userId) => Cart.findOne({ user: userId });

const findActiveProduct = (productId) =>
  Product.findOne({
    _id: productId,
    isDeleted: false,
  });

const findIndex = (cart, productId) => {
  return cart.items.findIndex(
    (item) => String(item.productId) === String(productId),
  );
};

export const addItemToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const product = await findActiveProduct(productId);

    if (!product) return res.status(404).json({ message: "product not found" });

    if (quantity > product.stock)
      return res.status(400).json({ message: "insufficient stock" });

    const existingCart = await findUserCart(userId);
    const totalItemPrice = calcTotalItemPrice(product.price, quantity);

    if (!existingCart) {
      const addCart = await Cart.create({
        user: userId,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity,
            totalItemPrice,
          },
        ],
      });

      return res
        .status(201)
        .json({ message: "cart added successfully", addCart });
    }

    const itemIndex = findIndex(existingCart, productId);

    if (itemIndex > -1) {
      if (existingCart.items[itemIndex].quantity + quantity > product.stock)
        return res.status(400).json({ message: "insufficient stock" });

      existingCart.items[itemIndex].quantity += quantity;
      existingCart.items[itemIndex].price = product.price;
      existingCart.items[itemIndex].totalItemPrice = calcTotalItemPrice(
        product.price,
        existingCart.items[itemIndex].quantity,
      );
    } else {
      existingCart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
        totalItemPrice,
      });
    }

    await existingCart.save();

    return res
      .status(200)
      .json({ message: "cart updated successfully", cart: existingCart });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const getMyCart = async (req, res) => {
  try {
    const myCart = await findUserCart(req.user.id);

    if (!myCart) return res.status(404).json({ message: "cart is empty" });

    return res.status(200).json({
      message: "cart found successfully",
      myCart,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await findUserCart(req.user.id);

    if (!cart) return res.status(404).json({ message: "cart not found" });

    const itemIndex = findIndex(cart, productId);

    if (itemIndex === -1)
      return res.status(404).json({ message: "product not found" });

    const product = await findActiveProduct(productId);

    if (!product) return res.status(404).json({ message: "product not found" });

    if (quantity > product.stock)
      return res.status(400).json({ message: "insufficient stock available" });

    cart.items[itemIndex].price = product.price;
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalItemPrice = calcTotalItemPrice(
      product.price,
      quantity,
    );

    await cart.save();

    return res.status(200).json({ message: "cart updated successfully", cart });
  } catch (err) {
    return res.status(500).json({
      message: "something went wrong",
      err: err.message,
      errstack: err.stack,
    });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await findUserCart(req.user.id);

    if (!cart) return res.status(404).json({ message: "cart not found" });

    const indexItem = findIndex(cart, productId);

    if (indexItem === -1)
      return res.status(404).json({ message: "product not found" });

    const deletedItem = cart.items.splice(indexItem, 1);

    if (!cart.items.length) {
      await Cart.findByIdAndDelete(cart._id);
      return res
        .status(200)
        .json({ message: "item deleted successfully", deletedItem });
    }

    await cart.save();

    return res.status(200).json({ message: "item deleted successfully", cart });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ user: req.user._id });

    if (!cart)
      return res.status(404).json({ message: "cart is already empty" });

    return res.status(200).json({ message: "cart deleted successfully", cart });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};
