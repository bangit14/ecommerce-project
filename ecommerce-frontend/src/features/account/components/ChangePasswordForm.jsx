import { useState } from "react";
import toast from "react-hot-toast";
import { userService } from "../../../services/userService";
import { getErrorMessage } from "../../../utils/errorHandler";
import { getCurrentUserId } from "../../../utils/authSession";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      toast.error("Không xác định được người dùng đăng nhập");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(currentUserId, {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      localStorage.setItem("userId", String(currentUserId));
      setForm((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      toast.success("Đổi mật khẩu thành công");
    } catch (err) {
      toast.error(getErrorMessage(err, "Đổi mật khẩu thất bại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-white dark:bg-gray-800 p-5 rounded-xl shadow"
    >
      <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
      <input
        name="oldPassword"
        type="password"
        value={form.oldPassword}
        onChange={handleChange}
        placeholder="Mật khẩu hiện tại"
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      />
      <input
        name="newPassword"
        type="password"
        value={form.newPassword}
        onChange={handleChange}
        placeholder="Mật khẩu mới"
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      />
      <input
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        placeholder="Xác nhận mật khẩu mới"
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
