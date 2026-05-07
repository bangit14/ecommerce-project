import api, { apiGet } from "./api";

const CART_BASE_PATH = "/carts";

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const ensureUserId = (userId) => {
  const parsedUserId = toNumberOrNull(userId);
  if (!parsedUserId) {
    throw new Error("Thiếu userId hợp lệ để thao tác giỏ hàng.");
  }

  return parsedUserId;
};

export const cartService = {
  getCartItems: async (userId) => {
    const parsedUserId = ensureUserId(userId);
    const response = await apiGet(`${CART_BASE_PATH}/items`, {
      params: { userId: parsedUserId },
    });
    return response.data;
  },

  addToCart: async (userId, cartItem) => {
    const parsedUserId = ensureUserId(userId);
    await api.post(`${CART_BASE_PATH}/add`, cartItem, {
      params: { userId: parsedUserId },
    });
  },

  updateCartItem: async ({ userId, quantity, variantId }) => {
    const parsedUserId = ensureUserId(userId);
    await api.put(
      `${CART_BASE_PATH}/update`,
      {
        variantId,
        quantity,
      },
      {
        params: {
          userId: parsedUserId,
        },
      },
    );
  },

  removeCartItem: async ({ userId, variantId }) => {
    const parsedUserId = ensureUserId(userId);
    await api.delete(`${CART_BASE_PATH}/remove`, {
      params: {
        userId: parsedUserId,
        variantId,
      },
    });
  },

  clearCart: async (userId) => {
    const parsedUserId = ensureUserId(userId);
    await api.delete(`${CART_BASE_PATH}/clear`, {
      params: { userId: parsedUserId },
    });
  },

  getCartItemCount: async (userId) => {
    const parsedUserId = ensureUserId(userId);
    const response = await apiGet(`${CART_BASE_PATH}/count`, {
      params: { userId: parsedUserId },
    });
    return response.data;
  },
};
