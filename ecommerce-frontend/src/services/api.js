import axios from "axios";

const inFlightGetRequests = new Map();
const recentGetResponses = new Map();
const GET_DEDUPE_WINDOW_MS = 700;
const ACCESS_TOKEN_KEY = "token";

let refreshRequestPromise = null;

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
  const entries = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`,
  );
  return `{${entries.join(",")}}`;
};

const buildGetRequestKey = (url, config = {}) => {
  const paramsPart = stableStringify(config.params || {});
  return `${url}::${paramsPart}`;
};

const purgeExpiredRecentResponses = () => {
  const now = Date.now();
  for (const [key, cached] of recentGetResponses.entries()) {
    if (now - cached.timestamp > GET_DEDUPE_WINDOW_MS) {
      recentGetResponses.delete(key);
    }
  }
};

const api = axios.create({
  baseURL: "http://localhost:8080/api", // nhờ proxy ở trên
  timeout: 30000, // Tăng timeout lên 30 giây
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const extractAuthTokens = (payload = {}, headers = {}) => {
  const rawAccessToken =
    payload?.token ||
    payload?.access_token ||
    payload?.accessToken ||
    payload?.data?.token ||
    payload?.data?.access_token ||
    payload?.data?.accessToken ||
    headers?.authorization ||
    headers?.Authorization;

  const accessToken =
    typeof rawAccessToken === "string"
      ? rawAccessToken.replace(/^Bearer\s+/i, "").trim()
      : "";

  return {
    accessToken,
  };
};

const persistAuthTokens = ({ accessToken }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
};

const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
};

const isRefreshRequest = (config) => {
  const url = config?.url || "";
  return url.includes("/auth/refresh");
};

const isAuthEndpointRequest = (config) => {
  const url = config?.url || "";
  return url.includes("/auth/");
};

const shouldClearTokensAfterRefreshFailure = (error) => {
  const status = error?.response?.status;
  return status === 400 || status === 401 || status === 403;
};

const requestNewAccessToken = async () => {
  const response = await axios.post(
    "http://localhost:8080/api/auth/refresh",
    {},
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  const tokens = extractAuthTokens(response.data, response.headers || {});
  if (!tokens.accessToken) {
    throw new Error("Refresh response không chứa access token");
  }

  persistAuthTokens(tokens);
  return tokens;
};

// Interceptor thêm token (không gửi token cho auth endpoints)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const requestUrl = config.url || "";

  if (token && !requestUrl.includes("/auth")) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (!originalRequest || status !== 401) {
      throw error;
    }

    if (isRefreshRequest(originalRequest)) {
      clearAuthTokens();
      throw error;
    }

    // Khong refresh cho login/register/verify... de tranh loop khong can thiet.
    if (
      isAuthEndpointRequest(originalRequest) ||
      originalRequest?.skipAuthRefresh
    ) {
      throw error;
    }

    if (originalRequest._retry) {
      throw error;
    }

    try {
      if (!refreshRequestPromise) {
        refreshRequestPromise = requestNewAccessToken().finally(() => {
          refreshRequestPromise = null;
        });
      }

      const tokens = await refreshRequestPromise;
      originalRequest._retry = true;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      if (shouldClearTokensAfterRefreshFailure(refreshError)) {
        clearAuthTokens();
      }
      throw refreshError;
    }
  },
);

export const apiGet = (url, config = {}) => {
  const key = buildGetRequestKey(url, config);
  purgeExpiredRecentResponses();

  const recent = recentGetResponses.get(key);
  if (recent) {
    return Promise.resolve(recent.response);
  }

  const pending = inFlightGetRequests.get(key);
  if (pending) {
    return pending;
  }

  const requestPromise = api
    .get(url, config)
    .then((response) => {
      recentGetResponses.set(key, {
        timestamp: Date.now(),
        response,
      });
      return response;
    })
    .finally(() => {
      inFlightGetRequests.delete(key);
    });

  inFlightGetRequests.set(key, requestPromise);
  return requestPromise;
};

export default api;
