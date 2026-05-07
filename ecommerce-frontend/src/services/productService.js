import api, { apiGet } from "./api";

const PRODUCT_BASE_PATH = "/products";

const serializeParams = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

export const productService = {
  getProducts: async ({
    filter = {},
    page = 0,
    size = 10,
    sortBy,
    sortDir,
  } = {}) => {
    const params = {
      ...filter,
      page,
      size,
      ...(sortBy ? { sortBy } : {}),
      ...(sortDir ? { sortDir } : {}),
    };

    const queryString = serializeParams(params);
    const listUrl = queryString
      ? `${PRODUCT_BASE_PATH}/list?${queryString}`
      : `${PRODUCT_BASE_PATH}/list`;

    const response = await apiGet(listUrl);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiGet(`${PRODUCT_BASE_PATH}/${id}`);
    return response.data;
  },

  createProduct: async (payload) => {
    const response = await api.post(`${PRODUCT_BASE_PATH}/create`, payload);
    return response.data;
  },

  updateProduct: async (id, payload) => {
    await api.put(`${PRODUCT_BASE_PATH}/update/${id}`, payload);
  },

  deleteProduct: async (id) => {
    await api.delete(`${PRODUCT_BASE_PATH}/delete/${id}`);
  },

  getProductVariants: async (productId) => {
    const response = await apiGet(`${PRODUCT_BASE_PATH}/${productId}/variants`);
    return response.data;
  },

  addProductVariant: async (productId, payload) => {
    const response = await api.post(
      `${PRODUCT_BASE_PATH}/${productId}/variants`,
      payload,
    );
    return response.data;
  },

  updateProductVariant: async (variantId, payload) => {
    await api.put(`${PRODUCT_BASE_PATH}/variants/${variantId}`, payload);
  },

  deleteProductVariant: async (variantId) => {
    await api.delete(`${PRODUCT_BASE_PATH}/variants/${variantId}`);
  },

  uploadProductImage: async (
    productId,
    { file, variantId, isMain = false, sortOrder = 0 },
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("variantId", String(variantId));
    formData.append("isMain", String(Boolean(isMain)));
    formData.append("sortOrder", String(sortOrder));

    await api.post(`${PRODUCT_BASE_PATH}/${productId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteProductImage: async (imageId) => {
    await api.delete(`${PRODUCT_BASE_PATH}/images/${imageId}`);
  },
};
