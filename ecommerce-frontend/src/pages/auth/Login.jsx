// src/pages/auth/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errorHandler";
import { userService } from "../../services/userService";
import {
  extractUserIdFromLoginResponse,
  syncUserIdFromToken,
  syncRoleFromToken,
  syncPermissionsFromToken,
} from "../../utils/authSession";

const extractLoginToken = (response) => {
  const rawToken =
    response.data?.token ||
    response.data?.access_token ||
    response.data?.accessToken ||
    response.data?.data?.token ||
    response.data?.data?.access_token ||
    response.data?.data?.accessToken ||
    response.headers?.authorization ||
    response.headers?.Authorization;

  return typeof rawToken === "string"
    ? rawToken.replace(/^Bearer\s+/i, "").trim()
    : "";
};

const redirectByRole = (role, navigate) => {
  if (role === "ADMIN") {
    navigate("/admin");
    return;
  }

  if (role === "STAFF") {
    navigate("/admin/profile");
    return;
  }

  navigate("/");
};

const syncUserContext = async (response, token, role) => {
  const userId = extractUserIdFromLoginResponse(response.data);
  if (userId) {
    localStorage.setItem("userId", String(userId));
    return;
  }

  const tokenUserId = syncUserIdFromToken(token);
  if (tokenUserId) {
    return;
  }

  // Customer/User khong can ep goi profile ngay khi login.
  if (role === "CUSTOMER" || role === "USER") {
    return;
  }

  try {
    const profile = await userService.getUserProfile();
    if (profile?.id) {
      localStorage.setItem("userId", String(profile.id));
    }
  } catch {
    // Bỏ qua để không chặn flow login nếu profile fetch lỗi tạm thời.
  }
};

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const token = extractLoginToken(response);

      if (!token) {
        throw new Error("Không nhận được token từ API đăng nhập");
      }

      localStorage.setItem("token", token);
      const role = syncRoleFromToken(token);
      syncPermissionsFromToken(token);
      await syncUserContext(response, token, role);

      toast.success("Đăng nhập thành công!");
      redirectByRole(role, navigate);
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Đăng nhập thất bại. Vui lòng thử lại.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Đăng nhập vào hệ thống
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Quản lý cửa hàng của bạn
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username
              </label>
              <div className="mt-1 relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="username123"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
