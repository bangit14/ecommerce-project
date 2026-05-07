import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../utils/errorHandler";

const initialCreateForm = {
  username: "",
  password: "",
  email: "",
  fullName: "",
  phone: "",
  role: "USER",
  dateOfBirth: "",
};

const initialEditForm = {
  username: "",
  email: "",
  fullName: "",
  phone: "",
  role: "USER",
  dateOfBirth: "",
};

export default function UsersManagement() {
  const hasFetchedOnMount = useRef(false);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pageInput, setPageInput] = useState("1");
  const [usersPage, setUsersPage] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
  });

  const [query, setQuery] = useState({
    username: "",
    email: "",
    active: "",
    roleName: "",
    createdFrom: "",
    createdTo: "",
    page: 0,
    size: 10,
    sortBy: "id",
    sortDir: "desc",
  });

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  const fetchUsers = async (nextQuery = query) => {
    setLoading(true);
    try {
      const filter = {
        ...(nextQuery.username ? { username: nextQuery.username } : {}),
        ...(nextQuery.email ? { email: nextQuery.email } : {}),
        ...(nextQuery.active === ""
          ? {}
          : { active: nextQuery.active === "true" }),
        ...(nextQuery.roleName ? { roleName: nextQuery.roleName } : {}),
        ...(nextQuery.createdFrom
          ? { createdFrom: nextQuery.createdFrom }
          : {}),
        ...(nextQuery.createdTo ? { createdTo: nextQuery.createdTo } : {}),
      };

      const data = await userService.getUsers({
        filter,
        page: nextQuery.page,
        size: nextQuery.size,
        sortBy: nextQuery.sortBy,
        sortDir: nextQuery.sortDir,
      });
      setUsersPage(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải danh sách người dùng."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedOnMount.current) {
      return;
    }

    hasFetchedOnMount.current = true;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPageInput(String((usersPage.number || 0) + 1));
  }, [usersPage.number]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setQuery((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const resolveUserRole = (user) => {
    if (typeof user?.role === "string" && user.role.trim()) {
      return user.role.trim().toUpperCase();
    }

    if (Array.isArray(user?.roles) && user.roles.length > 0) {
      const firstRole = user.roles[0];
      if (typeof firstRole === "string" && firstRole.trim()) {
        return firstRole.trim().toUpperCase();
      }
      if (
        firstRole &&
        typeof firstRole === "object" &&
        typeof firstRole.name === "string" &&
        firstRole.name.trim()
      ) {
        return firstRole.name.trim().toUpperCase();
      }
    }

    return "USER";
  };

  const applyFilter = async (e) => {
    e.preventDefault();
    const next = { ...query, page: 0 };
    setQuery(next);
    await fetchUsers(next);
  };

  const resetFilter = async () => {
    const next = {
      username: "",
      email: "",
      active: "",
      roleName: "",
      createdFrom: "",
      createdTo: "",
      page: 0,
      size: query.size,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    };
    setQuery(next);
    await fetchUsers(next);
  };

  const handleChangePage = async (nextPage) => {
    const next = { ...query, page: nextPage };
    setQuery(next);
    await fetchUsers(next);
  };

  const handleJumpToPage = async (e) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const totalPages = Math.max(1, usersPage.totalPages || 1);
    const parsedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsedPage)) {
      setPageInput(String((usersPage.number || 0) + 1));
      return;
    }

    const boundedPage = Math.min(Math.max(parsedPage, 1), totalPages) - 1;
    await handleChangePage(boundedPage);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser({
        ...createForm,
        dateOfBirth: createForm.dateOfBirth || null,
      });
      toast.success("Tạo người dùng thành công");
      setCreateForm(initialCreateForm);
      setCreateOpen(false);
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Tạo người dùng thất bại."));
    }
  };

  const startEdit = (user) => {
    setEditTarget(user);
    setEditForm({
      username: user.username || "",
      email: user.email || "",
      fullName: user.fullName || "",
      phone: user.phone || "",
      role: resolveUserRole(user),
      dateOfBirth: user.dateOfBirth || "",
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editTarget?.id) return;
    try {
      await userService.updateUser(editTarget.id, {
        ...editForm,
        role: editForm.role,
        dateOfBirth: editForm.dateOfBirth || null,
      });
      toast.success("Cập nhật người dùng thành công");
      setEditTarget(null);
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Cập nhật người dùng thất bại."));
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = globalThis.confirm(
      "Bạn có chắc chắn muốn xóa người dùng này?",
    );
    if (!confirmed) return;

    try {
      await userService.deleteUser(id);
      toast.success("Xóa người dùng thành công");
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa người dùng thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quản lý người dùng
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FunnelIcon className="h-4 w-4" />
            Bộ lọc
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4" />
            Tạo mới
          </button>
          <button
            onClick={() => fetchUsers()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Đóng bộ lọc"
            onClick={() => setFilterOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bộ lọc người dùng
              </h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Đóng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={applyFilter} className="space-y-3 p-5">
              <div>
                <label
                  htmlFor="filter-username"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Username
                </label>
                <input
                  id="filter-username"
                  name="username"
                  value={query.username}
                  onChange={handleFilterChange}
                  placeholder="Nhập username"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-email"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  id="filter-email"
                  name="email"
                  value={query.email}
                  onChange={handleFilterChange}
                  placeholder="Nhập email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-active"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Trạng thái
                </label>
                <select
                  id="filter-active"
                  name="active"
                  value={query.active}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="">Tất cả</option>
                  <option value="true">Đang active</option>
                  <option value="false">Đã khóa</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="filter-role-name"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Vai trò
                </label>
                <input
                  id="filter-role-name"
                  name="roleName"
                  value={query.roleName}
                  onChange={handleFilterChange}
                  placeholder="VD: ADMIN"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-created-from"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Ngày bắt đầu
                </label>
                <input
                  id="filter-created-from"
                  name="createdFrom"
                  type="date"
                  value={query.createdFrom}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-created-to"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Ngày kết thúc
                </label>
                <input
                  id="filter-created-to"
                  name="createdTo"
                  type="date"
                  value={query.createdTo}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-sort-by"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Sắp xếp theo
                </label>
                <select
                  id="filter-sort-by"
                  name="sortBy"
                  value={query.sortBy}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="id">ID</option>
                  <option value="username">Username</option>
                  <option value="email">Email</option>
                  <option value="createdAt">Ngày tạo</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="filter-sort-dir"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Sắp xếp
                </label>
                <select
                  id="filter-sort-dir"
                  name="sortDir"
                  value={query.sortDir}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Tìm kiếm
                </button>
                <button
                  type="button"
                  onClick={resetFilter}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Xóa lọc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Họ tên</th>
              <th className="py-2 pr-4">SĐT</th>
              <th className="py-2 pr-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && usersPage.content?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {!loading &&
              usersPage.content?.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="py-2 pr-4">{user.id}</td>
                  <td className="py-2 pr-4">{user.username}</td>
                  <td className="py-2 pr-4">{user.email}</td>
                  <td className="py-2 pr-4">{user.fullName}</td>
                  <td className="py-2 pr-4">{user.phone}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <TrashIcon className="h-4 w-4" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Trang {(usersPage.number || 0) + 1} / {usersPage.totalPages || 1} (
            {usersPage.totalElements || 0} người dùng)
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="user-jump-page"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Tới trang
              </label>
              <input
                id="user-jump-page"
                type="number"
                min="1"
                max={Math.max(1, usersPage.totalPages || 1)}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onKeyDown={handleJumpToPage}
                className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              disabled={loading || usersPage.number <= 0}
              onClick={() =>
                handleChangePage(Math.max(0, usersPage.number - 1))
              }
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={
                loading ||
                (usersPage.number || 0) >=
                  Math.max(0, (usersPage.totalPages || 1) - 1)
              }
              onClick={() =>
                handleChangePage(
                  Math.min(
                    Math.max(0, (usersPage.totalPages || 1) - 1),
                    usersPage.number + 1,
                  ),
                )
              }
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreateUser}
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl p-5 space-y-3 shadow-2xl"
          >
            <h3 className="text-lg font-semibold">Tạo người dùng mới</h3>
            <input
              name="username"
              value={createForm.username}
              onChange={handleCreateChange}
              placeholder="Username"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <input
              name="password"
              type="password"
              value={createForm.password}
              onChange={handleCreateChange}
              placeholder="Password"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <input
              name="email"
              type="email"
              value={createForm.email}
              onChange={handleCreateChange}
              placeholder="Email"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <input
              name="fullName"
              value={createForm.fullName}
              onChange={handleCreateChange}
              placeholder="Họ và tên"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <input
              name="phone"
              value={createForm.phone}
              onChange={handleCreateChange}
              placeholder="Số điện thoại"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <select
              name="role"
              value={createForm.role}
              onChange={handleCreateChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="USER">User</option>
              <option value="SELLER">Seller</option>
            </select>
            <input
              name="dateOfBirth"
              type="date"
              value={createForm.dateOfBirth}
              onChange={handleCreateChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setCreateForm(initialCreateForm);
                }}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Tạo mới
              </button>
            </div>
          </form>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleUpdateUser}
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl p-5 space-y-3 shadow-2xl"
          >
            <h3 className="text-lg font-semibold">
              Cập nhật người dùng #{editTarget.id}
            </h3>
            <div>
              <label htmlFor="edit-username" className="block mb-1 text-sm">
                Username
              </label>
              <input
                id="edit-username"
                name="username"
                value={editForm.username}
                onChange={handleEditChange}
                placeholder="Username"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block mb-1 text-sm">
                Email
              </label>
              <input
                id="edit-email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleEditChange}
                placeholder="Email"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label htmlFor="edit-fullName" className="block mb-1 text-sm">
                Họ và tên
              </label>
              <input
                id="edit-fullName"
                name="fullName"
                value={editForm.fullName}
                onChange={handleEditChange}
                placeholder="Họ và tên"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label htmlFor="edit-phone" className="block mb-1 text-sm">
                Số điện thoại
              </label>
              <input
                id="edit-phone"
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
                placeholder="Số điện thoại"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label htmlFor="edit-role" className="block mb-1 text-sm">
                Role
              </label>
              <select
                id="edit-role"
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="USER">User</option>
                <option value="SELLER">Seller</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-dateOfBirth" className="block mb-1 text-sm">
                Ngày sinh
              </label>
              <input
                id="edit-dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={handleEditChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
