import api, { apiGet } from "./api";

const CATEGORY_BASE_PATH = "/categories";

export const categoryService = {
  getCategories: async ({
    filter = {},
    page = 0,
    size = 10,
    sortBy = "id",
    sortDir = "desc",
  } = {}) => {
    const params = {
      ...filter,
      page,
      size,
      sortBy,
      sortDir,
    };

    const response = await apiGet(`${CATEGORY_BASE_PATH}/list`, { params });
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await apiGet(`${CATEGORY_BASE_PATH}/${id}`);
    return response.data;
  },

  getChildCategories: async (id) => {
    const response = await apiGet(`${CATEGORY_BASE_PATH}/${id}/subcategories`);
    return response.data;
  },

  getAvailableParents: async (excludeCategoryId) => {
    const params = excludeCategoryId ? { excludeCategoryId } : {};
    const response = await apiGet(`${CATEGORY_BASE_PATH}/parent-options`, {
      params,
    });
    return response.data;
  },

  getCategoryTree: async (id) => {
    if (id) {
      const response = await apiGet(`${CATEGORY_BASE_PATH}/${id}/tree`);
      return response.data;
    }
    const response = await apiGet(`${CATEGORY_BASE_PATH}/tree`);
    return response.data;
  },

  createCategory: async (payload) => {
    const response = await api.post(`${CATEGORY_BASE_PATH}/create`, payload);
    return response.data;
  },

  updateCategory: async (id, payload) => {
    await api.put(`${CATEGORY_BASE_PATH}/update/${id}`, payload);
  },

  deleteCategory: async (id) => {
    await api.delete(`${CATEGORY_BASE_PATH}/delete/${id}`);
  },
};
