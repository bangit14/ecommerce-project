import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { userService } from "../../../services/userService";
import { getErrorMessage } from "../../../utils/errorHandler";

const toInputDate = (value) => {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
};

const toReadableDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("vi-VN");
};

export default function ProfileUpdateForm() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const data = await userService.getUserProfile();
        setProfile(data);
        if (data?.id) {
          localStorage.setItem("userId", String(data.id));
        }
        setForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
          dateOfBirth: toInputDate(data.dateOfBirth),
        });
      } catch (err) {
        toast.error(getErrorMessage(err, "Không thể tải hồ sơ người dùng."));
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUserId = profile?.id;
    if (!currentUserId) {
      toast.error("Không xác định được người dùng đăng nhập");
      return;
    }

    setSubmitting(true);
    try {
      await userService.updateProfile(currentUserId, {
        fullName: form.fullName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || null,
      });
      localStorage.setItem("userId", String(currentUserId));
      toast.success("Cập nhật profile thành công");

      const refreshed = await userService.getUserProfile();
      setProfile(refreshed);
      setForm({
        fullName: refreshed.fullName || "",
        phone: refreshed.phone || "",
        dateOfBirth: toInputDate(refreshed.dateOfBirth),
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Cập nhật profile thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đang tải hồ sơ...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-white dark:bg-gray-800 p-5 rounded-xl shadow"
    >
      <h2 className="text-lg font-semibold">Cập nhật profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="profile-id"
            className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
          >
            ID
          </label>
          <input
            id="profile-id"
            value={profile?.id ?? ""}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70"
          />
        </div>
        <div>
          <label
            htmlFor="profile-username"
            className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
          >
            Username
          </label>
          <input
            id="profile-username"
            value={profile?.username || ""}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="profile-email"
          className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
        >
          Email (cố định)
        </label>
        <input
          id="profile-email"
          value={profile?.email || ""}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70"
        />
      </div>

      <input
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        placeholder="Họ và tên"
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      />
      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Số điện thoại"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      />
      <input
        name="dateOfBirth"
        type="date"
        value={form.dateOfBirth}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="profile-active"
            className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
          >
            Trạng thái
          </label>
          <input
            id="profile-active"
            value={profile?.active ? "Đang hoạt động" : "Không hoạt động"}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70"
          />
        </div>
        <div>
          <label
            htmlFor="profile-email-verified"
            className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
          >
            Email verified
          </label>
          <input
            id="profile-email-verified"
            value={profile?.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="profile-created-at"
          className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
        >
          Ngày tạo
        </label>
        <input
          id="profile-created-at"
          value={toReadableDateTime(profile?.createdAt)}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70"
        />
      </div>

      <div>
        <label
          htmlFor="profile-roles"
          className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
        >
          Roles
        </label>
        <input
          id="profile-roles"
          value={profile?.roles?.length ? profile.roles.join(", ") : "-"}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Đang cập nhật..." : "Cập nhật profile"}
      </button>
    </form>
  );
}
