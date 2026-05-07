// src/pages/auth/VerifyCode.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function VerifyCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  // Lấy email từ state (được set từ Register)
  const email = location.state?.email;

  useEffect(() => {
    // Nếu không có email, redirect về register
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleInputChange = (index, value) => {
    // Chỉ cho phép số
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Lấy ký tự cuối cùng

    setCode(newCode);

    // Tự động focus sang ô tiếp theo nếu có số
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Quay lại ô trước nếu nhấn Backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const verificationCode = code.join("");

    // Validate
    if (verificationCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số");
      return;
    }

    setLoading(true);

    try {
      // Gửi request xác thực mã
      const response = await api.post("/auth/verify-code", {
        email: email,
        code: verificationCode,
      });

      toast.success("Xác thực thành công! Chào mừng bạn!");
      // Redirect về trang chủ hoặc dashboard
      navigate("/admin");
    } catch (err) {
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // Xử lý error từ ApiErrorResponse của backend
      const errorData = err.response?.data;
      let errorMessage = "Xác thực thất bại. Vui lòng thử lại.";

      if (errorData) {
        // Backend trả về format: { message, status, error, timestamp }
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        console.error("Full error data:", {
          message: errorData.message,
          error: errorData.error,
          status: errorData.status,
          timestamp: errorData.timestamp,
        });
      } else if (err.message) {
        errorMessage = err.message; // Network error, timeout, etc.
      }

      toast.error(errorMessage);
      setError(errorMessage);
      // Reset code
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);

    try {
      // Gửi request để gửi lại mã
      await api.post("/auth/resend-code", {
        email: email,
      });

      toast.success("Đã gửi lại mã xác thực. Vui lòng kiểm tra email.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } catch (err) {
      console.error("Error response:", err.response?.data);

      // Xử lý error từ ApiErrorResponse
      const errorData = err.response?.data;
      let errorMessage = "Không thể gửi lại mã. Vui lòng thử lại.";

      if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        console.error("Full error data:", {
          message: errorData.message,
          error: errorData.error,
          status: errorData.status,
        });
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-xl">
        {/* Icon và tiêu đề */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Xác thực tài khoản
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Chúng tôi đã gửi mã xác thực 6 số đến email{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {email}
            </span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Nhập mã 6 số */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Nhập mã xác thực
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Nút xác thực */}
          <button
            type="submit"
            disabled={loading || code.join("").length !== 6}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang xác thực..." : "Xác thực"}
          </button>

          {/* Gửi lại mã */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Không nhận được mã?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gửi lại
              </button>
            </p>
          </div>
        </form>

        {/* Link quay lại đăng ký */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Muốn đăng ký lại?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              Quay lại đăng ký
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
