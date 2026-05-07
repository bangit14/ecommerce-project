import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheckIcon,
  UserIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
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

const ALLOWED_ROLES = new Set(["ADMIN", "STAFF"]);

const extractLoginTokens = (response) => {
  const rawToken =
    response.data?.token ||
    response.data?.access_token ||
    response.data?.accessToken ||
    response.data?.data?.token ||
    response.data?.data?.access_token ||
    response.data?.data?.accessToken ||
    response.headers?.authorization ||
    response.headers?.Authorization;

  const token =
    typeof rawToken === "string"
      ? rawToken.replace(/^Bearer\s+/i, "").trim()
      : "";

  return {
    token,
  };
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
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

      const { token } = extractLoginTokens(response);

      if (!token) {
        throw new Error("Không nhận được token từ API đăng nhập");
      }

      localStorage.setItem("token", token);
      const role = syncRoleFromToken(token);
      syncPermissionsFromToken(token);

      if (!role || !ALLOWED_ROLES.has(role)) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        localStorage.removeItem("permissions");
        throw new Error("Tài khoản này không có quyền truy cập admin/staff");
      }

      const userId = extractUserIdFromLoginResponse(response.data);
      if (userId) {
        localStorage.setItem("userId", String(userId));
      } else {
        const tokenUserId = syncUserIdFromToken(token);
        if (!tokenUserId) {
          try {
            const profile = await userService.getUserProfile();
            if (profile?.id) {
              localStorage.setItem("userId", String(profile.id));
            }
          } catch {
            // Không chặn login nếu profile chưa fetch được.
          }
        }
      }

      toast.success("Đăng nhập quản trị thành công!");
      const fallbackPath = role === "ADMIN" ? "/admin" : "/admin/profile";
      const redirectTo = location.state?.from?.pathname || fallbackPath;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Đăng nhập quản trị thất bại. Vui lòng thử lại.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            Admin / Staff Login
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Dành cho tài khoản quản trị và vận hành
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <div className="mt-1 relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 w-full px-3 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  placeholder="admin_username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-slate-700"
              >
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 w-full px-3 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
