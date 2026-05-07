import api, { apiGet } from "./api";

const USER_BASE_PATH = "/users";
const ADDRESS_BASE_PATH = "/addresses";

export const userService = {
  getUserProfile: async (id) => {
    const response = await apiGet(`${USER_BASE_PATH}/me/profile`, {
      ...(id ? { params: { id } } : {}),
    });
    return response.data;
  },

  getUsers: async ({
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

    const response = await apiGet(`${USER_BASE_PATH}/list`, { params });
    return response.data;
  },

  createUser: async (payload) => {
    const response = await api.post(`${USER_BASE_PATH}/create`, payload);
    return response.data;
  },

  updateUser: async (id, payload) => {
    await api.put(`${USER_BASE_PATH}/update/${id}`, payload);
  },

  updateProfile: async (id, payload) => {
    await api.put(`${USER_BASE_PATH}/update-profile/${id}`, payload);
  },

  deleteUser: async (id) => {
    await api.delete(`${USER_BASE_PATH}/delete/${id}`);
  },

  changePassword: async (id, payload) => {
    await api.put(`${USER_BASE_PATH}/change-password/${id}`, payload);
  },

  getAddresses: async () => {
    const response = await apiGet(`${ADDRESS_BASE_PATH}/list`);
    return Array.isArray(response.data) ? response.data : [];
  },

  addAddress: async (payload) => {
    await api.post(`${ADDRESS_BASE_PATH}/add`, payload);
  },

  updateAddress: async (addressId, payload) => {
    await api.put(`${ADDRESS_BASE_PATH}/update/${addressId}`, payload);
  },

  deleteAddress: async (addressId) => {
    await api.delete(`${ADDRESS_BASE_PATH}/delete/${addressId}`);
  },

  setDefaultAddress: async (addressId) => {
    await api.put(`${ADDRESS_BASE_PATH}/${addressId}/default`);
  },
};
