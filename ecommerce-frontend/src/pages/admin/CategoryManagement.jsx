import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { categoryService } from "../../services/categoryService";
import { getErrorMessage } from "../../utils/errorHandler";

const initialCreateForm = {
  name: "",
  slug: "",
  description: "",
  parentId: null,
  displayOrder: 0,
  active: true,
};

const initialEditForm = {
  name: "",
  slug: "",
  description: "",
  parentId: null,
  displayOrder: 0,
  active: true,
};

export default function CategoryManagement() {
  const hasFetchedOnMount = useRef(false);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pageInput, setPageInput] = useState("1");
  const [categoriesPage, setCategoriesPage] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    pageNumber: 0,
    size: 10,
  });

  const [parentOptions, setParentOptions] = useState([]);

  const [query, setQuery] = useState({
    name: "",
    slug: "",
    parentId: "",
    path: "",
    page: 0,
    size: 10,
    sortBy: "id",
    sortDir: "asc",
  });

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [detailsTarget, setDetailsTarget] = useState(null);

  // Fetch parent categories for select options
  const fetchParentOptions = async () => {
    try {
      const data = await categoryService.getAvailableParents();
      setParentOptions(data || []);
    } catch (err) {
      console.error("Failed to load parent categories", err);
    }
  };

  const fetchCategories = async (nextQuery = query) => {
    setLoading(true);
    try {
      const filter = {
        ...(nextQuery.name ? { name: nextQuery.name } : {}),
        ...(nextQuery.slug ? { slug: nextQuery.slug } : {}),
        ...(nextQuery.parentId
          ? { parentId: Number.parseInt(nextQuery.parentId, 10) }
          : {}),
        ...(nextQuery.path ? { path: nextQuery.path } : {}),
      };

      const data = await categoryService.getCategories({
        filter,
        page: nextQuery.page,
        size: nextQuery.size,
        sortBy: nextQuery.sortBy,
        sortDir: nextQuery.sortDir,
      });
      setCategoriesPage(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải danh sách danh mục."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedOnMount.current) {
      return;
    }

    hasFetchedOnMount.current = true;
    fetchCategories();
    fetchParentOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPageInput(String((categoriesPage.pageNumber || 0) + 1));
  }, [categoriesPage.pageNumber]);

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

  const applyFilter = async (e) => {
    e.preventDefault();
    const next = { ...query, page: 0 };
    setQuery(next);
    await fetchCategories(next);
  };

  const resetFilter = async () => {
    const next = {
      name: "",
      slug: "",
      parentId: "",
      path: "",
      page: 0,
      size: query.size,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    };
    setQuery(next);
    await fetchCategories(next);
  };

  const handleChangePage = async (nextPage) => {
    const next = { ...query, page: nextPage };
    setQuery(next);
    await fetchCategories(next);
  };

  const handleJumpToPage = async (e) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const totalPages = Math.max(1, categoriesPage.totalPages || 1);
    const parsedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsedPage)) {
      setPageInput(String((categoriesPage.pageNumber || 0) + 1));
      return;
    }

    const boundedPage = Math.min(Math.max(parsedPage, 1), totalPages) - 1;
    await handleChangePage(boundedPage);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...createForm,
        parentId: createForm.parentId
          ? Number.parseInt(createForm.parentId, 10)
          : null,
        displayOrder: Number.parseInt(createForm.displayOrder, 10) || 0,
      };
      await categoryService.createCategory(payload);
      toast.success("Tạo danh mục thành công");
      setCreateForm(initialCreateForm);
      setCreateOpen(false);
      await fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, "Tạo danh mục thất bại."));
    }
  };

  const startEdit = (category) => {
    setEditTarget(category);
    setEditForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      parentId: category.parentId || null,
      displayOrder: category.displayOrder || 0,
      active: category.active !== false,
    });
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editTarget?.id) return;
    try {
      const payload = {
        ...editForm,
        parentId: editForm.parentId
          ? Number.parseInt(editForm.parentId, 10)
          : null,
        displayOrder: Number.parseInt(editForm.displayOrder, 10) || 0,
      };
      await categoryService.updateCategory(editTarget.id, payload);
      toast.success("Cập nhật danh mục thành công");
      setEditTarget(null);
      await fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, "Cập nhật danh mục thất bại."));
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = globalThis.confirm(
      "Bạn có chắc chắn muốn xóa danh mục này?",
    );
    if (!confirmed) return;

    try {
      await categoryService.deleteCategory(id);
      toast.success("Xóa danh mục thành công");
      await fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa danh mục thất bại."));
    }
  };

  const viewDetails = (category) => {
    setDetailsTarget(category);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quản lý danh mục
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
            onClick={() => fetchCategories()}
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
                Bộ lọc danh mục
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
                  htmlFor="filter-name"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Tên danh mục
                </label>
                <input
                  id="filter-name"
                  name="name"
                  value={query.name}
                  onChange={handleFilterChange}
                  placeholder="Nhập tên danh mục"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-slug"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Slug
                </label>
                <input
                  id="filter-slug"
                  name="slug"
                  value={query.slug}
                  onChange={handleFilterChange}
                  placeholder="Nhập slug"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-parentId"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Danh mục cha
                </label>
                <select
                  id="filter-parentId"
                  name="parentId"
                  value={query.parentId}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Tất cả --</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
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
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Tên danh mục
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Đang tải...
                  </td>
                </tr>
              )}

              {!loading && categoriesPage.content.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không có danh mục nào
                  </td>
                </tr>
              )}

              {!loading &&
                categoriesPage.content.length > 0 &&
                categoriesPage.content.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {category.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {category.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => viewDetails(category)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => startEdit(category)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900"
                        title="Sửa"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                        title="Xóa"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Trang {categoriesPage.pageNumber + 1} / {categoriesPage.totalPages}{" "}
            ({categoriesPage.totalElements} danh mục)
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="category-jump-page"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Tới trang
              </label>
              <input
                id="category-jump-page"
                type="number"
                min="1"
                max={Math.max(1, categoriesPage.totalPages || 1)}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onKeyDown={handleJumpToPage}
                className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={() =>
                handleChangePage(Math.max(0, categoriesPage.pageNumber - 1))
              }
              disabled={categoriesPage.pageNumber === 0}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() =>
                handleChangePage(
                  Math.min(
                    categoriesPage.totalPages - 1,
                    categoriesPage.pageNumber + 1,
                  ),
                )
              }
              disabled={
                categoriesPage.pageNumber >= categoriesPage.totalPages - 1
              }
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Tạo danh mục mới
              </h2>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4 p-6">
              <div>
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-name"
                  name="name"
                  value={createForm.name}
                  onChange={handleCreateChange}
                  placeholder="Nhập tên danh mục"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="create-slug"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-slug"
                  name="slug"
                  value={createForm.slug}
                  onChange={handleCreateChange}
                  placeholder="Nhập slug"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="create-description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Mô tả
                </label>
                <textarea
                  id="create-description"
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateChange}
                  placeholder="Nhập mô tả"
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="create-parentId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Danh mục cha
                </label>
                <select
                  id="create-parentId"
                  name="parentId"
                  value={createForm.parentId || ""}
                  onChange={handleCreateChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Không có --</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="create-displayOrder"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Thứ tự hiển thị
                </label>
                <input
                  id="create-displayOrder"
                  name="displayOrder"
                  type="number"
                  value={createForm.displayOrder}
                  onChange={handleCreateChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="create-active"
                  name="active"
                  type="checkbox"
                  checked={createForm.active}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="create-active"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Kích hoạt
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Tạo mới
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Sửa danh mục
              </h2>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-4 p-6">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Nhập tên danh mục"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-slug"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-slug"
                  name="slug"
                  value={editForm.slug}
                  onChange={handleEditChange}
                  placeholder="Nhập slug"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Mô tả
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  placeholder="Nhập mô tả"
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-parentId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Danh mục cha
                </label>
                <select
                  id="edit-parentId"
                  name="parentId"
                  value={editForm.parentId || ""}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Không có --</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-displayOrder"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Thứ tự hiển thị
                </label>
                <input
                  id="edit-displayOrder"
                  name="displayOrder"
                  type="number"
                  value={editForm.displayOrder}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="edit-active"
                  name="active"
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="edit-active"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Kích hoạt
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Cập nhật
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && detailsTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Chi tiết danh mục
              </h2>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ID
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tên
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Slug
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.slug}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mô tả
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.description || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Danh mục cha
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.parentId
                    ? parentOptions.find((p) => p.id === detailsTarget.parentId)
                        ?.name || detailsTarget.parentId
                    : "Không có"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đường dẫn
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.path || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Thứ tự hiển thị
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.displayOrder || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Trạng thái
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detailsTarget.active ? "Kích hoạt" : "Vô hiệu"}
                </p>
              </div>
              <button
                onClick={() => setDetailsOpen(false)}
                className="w-full px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
