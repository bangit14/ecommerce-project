import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
  EyeIcon,
  RectangleStackIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { categoryService } from "../../services/categoryService";
import { productService } from "../../services/productService";
import { getErrorMessage } from "../../utils/errorHandler";

const PANEL_DETAIL = "detail";
const PANEL_EDIT = "edit";
const PANEL_VARIANTS = "variants";
const PANEL_IMAGES = "images";

const initialProductForm = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  weight: "",
  active: true,
  categoryIds: [],
  primaryCategoryId: "",
};

const initialVariantForm = {
  sku: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "0",
  weight: "",
  attributes: "",
  isDefault: false,
};

const initialImageForm = {
  file: null,
  variantId: "",
  isMain: false,
};

const initialListQuery = {
  name: "",
  slug: "",
  brand: "",
  categoryIds: [],
  status: "",
  minPrice: "",
  maxPrice: "",
  page: 0,
  size: 10,
  sortBy: "id",
  sortDir: "asc",
};

const toNullableFloat = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("vi-VN");
};

const formatAttributesForForm = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  if (typeof value !== "string") {
    return String(value);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    return value;
  }

  return value;
};

const normalizeAttributesForPayload = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }

  const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksLikeJson) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return JSON.stringify(parsed);
    }

    throw new Error(
      'Thuộc tính JSON phải là object, ví dụ: {"Size":"S","Màu sắc":"Đen"}',
    );
  } catch (error) {
    if (error instanceof Error && error.name !== "SyntaxError") {
      throw error;
    }

    throw new Error(
      "Thuộc tính phải là JSON hợp lệ khi nhập dạng JSON object.",
    );
  }
};

const parseAttributesToEntries = (value) => {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  let parsed = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [];
  }

  return Object.entries(parsed).map(([key, attrValue]) => ({
    key,
    value:
      attrValue === null || attrValue === undefined ? "" : String(attrValue),
  }));
};

const createVariantAttributeId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createEmptyVariantAttribute = () => ({
  id: createVariantAttributeId(),
  key: "",
  value: "",
});

const buildAttributesFromEntries = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return "";
  }

  const attributesObject = {};

  for (const entry of entries) {
    const key = (entry?.key || "").trim();
    if (!key) {
      continue;
    }

    if (Object.hasOwn(attributesObject, key)) {
      throw new Error(
        `Thuộc tính "${key}" bị trùng. Vui lòng đổi tên thuộc tính.`,
      );
    }

    attributesObject[key] = String(entry?.value ?? "").trim();
  }

  return Object.keys(attributesObject).length > 0
    ? JSON.stringify(attributesObject)
    : "";
};

const buildAttributesPreview = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return "{}";
  }

  const previewObject = {};

  for (const entry of entries) {
    const key = (entry?.key || "").trim();
    if (!key || Object.hasOwn(previewObject, key)) {
      continue;
    }

    previewObject[key] = String(entry?.value ?? "").trim();
  }

  return JSON.stringify(previewObject, null, 2);
};

export default function ProductManagement() {
  const hasFetchedOnMount = useRef(false);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [submittingVariant, setSubmittingVariant] = useState(false);
  const [submittingImage, setSubmittingImage] = useState(false);

  const [lookupIdInput, setLookupIdInput] = useState("");
  const [pageInput, setPageInput] = useState("1");
  const [query, setQuery] = useState(initialListQuery);
  const [productsPage, setProductsPage] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    pageNumber: 0,
    pageSize: 5,
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createCategorySearch, setCreateCategorySearch] = useState("");

  const [productVariants, setProductVariants] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [createForm, setCreateForm] = useState(initialProductForm);
  const [updateForm, setUpdateForm] = useState(initialProductForm);
  const [createVariantForm, setCreateVariantForm] =
    useState(initialVariantForm);
  const [createVariantAttributes, setCreateVariantAttributes] = useState([
    createEmptyVariantAttribute(),
  ]);
  const [editVariantTarget, setEditVariantTarget] = useState(null);
  const [detailVariantTarget, setDetailVariantTarget] = useState(null);
  const [editVariantForm, setEditVariantForm] = useState(initialVariantForm);
  const [imageForm, setImageForm] = useState(initialImageForm);

  const resetCreateVariantDraft = () => {
    setCreateVariantForm(initialVariantForm);
    setCreateVariantAttributes([createEmptyVariantAttribute()]);
  };

  const syncUpdateFormFromProduct = (product) => {
    setUpdateForm({
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      brand: product?.brand || "",
      weight:
        product?.weight === null || product?.weight === undefined
          ? ""
          : String(product.weight),
      active: product?.active !== false,
      categoryIds: (product?.categories || []).map((category) =>
        String(category.id),
      ),
      primaryCategoryId: product?.primaryCategory?.id
        ? String(product.primaryCategory.id)
        : "",
    });
  };

  const fetchProducts = async (nextQuery = query) => {
    setLoadingList(true);

    try {
      const parsedCategoryIds = Array.isArray(nextQuery.categoryIds)
        ? nextQuery.categoryIds
            .map((id) => Number.parseInt(id, 10))
            .filter((id) => Number.isInteger(id))
        : [];

      const filter = {
        ...(nextQuery.name ? { name: nextQuery.name } : {}),
        ...(nextQuery.slug ? { slug: nextQuery.slug } : {}),
        ...(nextQuery.brand ? { brand: nextQuery.brand } : {}),
        ...(parsedCategoryIds.length > 0
          ? { categoryId: parsedCategoryIds }
          : {}),
        ...(nextQuery.status ? { status: nextQuery.status } : {}),
        ...(nextQuery.minPrice ? { minPrice: nextQuery.minPrice } : {}),
        ...(nextQuery.maxPrice ? { maxPrice: nextQuery.maxPrice } : {}),
      };

      const data = await productService.getProducts({
        filter,
        page: nextQuery.page,
        size: nextQuery.size,
        sortBy: nextQuery.sortBy,
        sortDir: nextQuery.sortDir,
      });

      setProductsPage(
        data || {
          content: [],
          totalElements: 0,
          totalPages: 0,
          pageNumber: nextQuery.page,
          pageSize: nextQuery.size,
        },
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải danh sách sản phẩm."));
    } finally {
      setLoadingList(false);
    }
  };

  const fetchCategoryOptions = async () => {
    try {
      const data = await categoryService.getAvailableParents();
      setCategoryOptions(data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải danh sách danh mục."));
    }
  };

  const fetchVariants = async (productId) => {
    try {
      const variants = await productService.getProductVariants(productId);
      setProductVariants(Array.isArray(variants) ? variants : []);
    } catch (err) {
      setProductVariants([]);
      toast.error(getErrorMessage(err, "Không thể tải biến thể sản phẩm."));
    }
  };

  const fetchProductById = async (
    productId,
    { panel = PANEL_DETAIL, syncPanel = true } = {},
  ) => {
    setLoadingProduct(true);
    try {
      const data = await productService.getProductById(productId);
      setSelectedProduct(data);
      setSelectedProductId(data.id);
      syncUpdateFormFromProduct(data);
      await fetchVariants(productId);

      if (syncPanel && panel) {
        setActivePanel(panel);
      }

      return data;
    } catch (err) {
      toast.error(getErrorMessage(err, "Không tìm thấy sản phẩm."));
      return null;
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    if (hasFetchedOnMount.current) {
      return;
    }

    hasFetchedOnMount.current = true;
    fetchCategoryOptions();
    fetchProducts();
    // Intentionally run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPageInput(String((productsPage.pageNumber || 0) + 1));
  }, [productsPage.pageNumber]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setQuery((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterCategoryToggle = (categoryId) => {
    const categoryIdString = String(categoryId);
    setQuery((prev) => {
      const existed = prev.categoryIds.includes(categoryIdString);
      return {
        ...prev,
        categoryIds: existed
          ? prev.categoryIds.filter((id) => id !== categoryIdString)
          : [...prev.categoryIds, categoryIdString],
      };
    });
  };

  const applyFilter = async (event) => {
    event.preventDefault();
    const next = { ...query, page: 0 };
    setQuery(next);
    await fetchProducts(next);
    setFilterOpen(false);
  };

  const resetFilter = async () => {
    const next = {
      ...initialListQuery,
      size: query.size,
    };
    setQuery(next);
    await fetchProducts(next);
  };

  const handleChangePage = async (nextPage) => {
    const next = { ...query, page: nextPage };
    setQuery(next);
    await fetchProducts(next);
  };

  const handleJumpToPage = async (e) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const totalPages = Math.max(1, productsPage.totalPages || 1);
    const parsedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsedPage)) {
      setPageInput(String((productsPage.pageNumber || 0) + 1));
      return;
    }

    const boundedPage = Math.min(Math.max(parsedPage, 1), totalPages) - 1;
    await handleChangePage(boundedPage);
  };

  const handleSortBy = async (field) => {
    let nextSortDir = "asc";
    if (query.sortBy === field) {
      nextSortDir = query.sortDir === "asc" ? "desc" : "asc";
    }

    const next = {
      ...query,
      sortBy: field,
      sortDir: nextSortDir,
      page: 0,
    };
    setQuery(next);
    await fetchProducts(next);
  };

  const handleCategoryMultiSelect = (event, setForm) => {
    const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value,
    );

    setForm((prev) => {
      const keepPrimary = selected.includes(String(prev.primaryCategoryId));
      return {
        ...prev,
        categoryIds: selected,
        primaryCategoryId: keepPrimary ? prev.primaryCategoryId : "",
      };
    });
  };

  const handleCreateCategoryToggle = (categoryId) => {
    const categoryIdString = String(categoryId);
    setCreateForm((prev) => {
      const existed = prev.categoryIds.includes(categoryIdString);
      const nextCategoryIds = existed
        ? prev.categoryIds.filter((id) => id !== categoryIdString)
        : [...prev.categoryIds, categoryIdString];
      const keepPrimary = nextCategoryIds.includes(
        String(prev.primaryCategoryId),
      );

      return {
        ...prev,
        categoryIds: nextCategoryIds,
        primaryCategoryId: keepPrimary ? prev.primaryCategoryId : "",
      };
    });
  };

  const buildProductPayload = (form) => {
    const categoryIds = form.categoryIds
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id));

    const primaryCategoryId = Number.parseInt(form.primaryCategoryId, 10);

    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      weight: toNullableFloat(form.weight),
      active: Boolean(form.active),
      categoryIds,
      primaryCategoryId:
        Number.isInteger(primaryCategoryId) &&
        categoryIds.includes(primaryCategoryId)
          ? primaryCategoryId
          : null,
    };
  };

  const handleLookupProduct = async () => {
    const parsedId = Number.parseInt(lookupIdInput, 10);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      toast.error("Vui lòng nhập Product ID hợp lệ.");
      return;
    }

    await fetchProductById(parsedId, { panel: PANEL_DETAIL, syncPanel: true });
  };

  const handleSelectProduct = async (productId) => {
    await fetchProductById(productId, { panel: PANEL_DETAIL, syncPanel: true });
  };

  const handleOpenDetailFromTable = async (productId) => {
    await fetchProductById(productId, { panel: PANEL_DETAIL, syncPanel: true });
  };

  const handleOpenEditFromTable = async (productId) => {
    await fetchProductById(productId, { panel: PANEL_EDIT, syncPanel: true });
  };

  const handleOpenDeleteFromTable = async (productId) => {
    const product = await fetchProductById(productId, {
      panel: null,
      syncPanel: false,
    });

    if (!product) {
      return;
    }

    await handleDeleteProduct(product.id, product.name);
  };

  const handleOpenVariantsFromTable = async (productId) => {
    resetCreateVariantDraft();
    await fetchProductById(productId, {
      panel: PANEL_VARIANTS,
      syncPanel: true,
    });
  };

  const handleOpenImagesFromTable = async (productId) => {
    await fetchProductById(productId, {
      panel: PANEL_IMAGES,
      syncPanel: true,
    });
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setSubmittingCreate(true);
    try {
      const payload = buildProductPayload(createForm);
      const newId = await productService.createProduct(payload);
      toast.success(`Tạo sản phẩm thành công (ID: ${newId}).`);
      setCreateForm(initialProductForm);
      setCreateCategorySearch("");
      setCreateOpen(false);
      await fetchProducts();
      await fetchProductById(newId, { panel: PANEL_DETAIL, syncPanel: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Tạo sản phẩm thất bại."));
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    if (!selectedProduct?.id) {
      toast.error("Hãy chọn sản phẩm trong danh sách trước khi cập nhật.");
      return;
    }

    setSubmittingUpdate(true);
    try {
      const payload = buildProductPayload(updateForm);
      await productService.updateProduct(selectedProduct.id, payload);
      toast.success("Cập nhật sản phẩm thành công.");
      await fetchProducts();
      await fetchProductById(selectedProduct.id, {
        panel: PANEL_EDIT,
        syncPanel: true,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Cập nhật sản phẩm thất bại."));
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleDeleteProduct = async (
    productId = selectedProduct?.id,
    productName = selectedProduct?.name,
  ) => {
    if (!productId) {
      return;
    }

    const productLabel = productName ? ` - ${productName}` : "";
    const confirmed = globalThis.confirm(
      `Bạn có chắc muốn xóa sản phẩm #${productId}${productLabel}?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      toast.success("Đã xóa sản phẩm.");
      await fetchProducts();
      setSelectedProduct(null);
      setSelectedProductId(null);
      setProductVariants([]);
      setUpdateForm(initialProductForm);
      setImageForm(initialImageForm);
      setActivePanel(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa sản phẩm thất bại."));
    }
  };

  const buildVariantPayload = (form) => ({
    sku: form.sku.trim(),
    price: toNullableFloat(form.price),
    compareAtPrice: toNullableFloat(form.compareAtPrice),
    stockQuantity: toInteger(form.stockQuantity, 0),
    weight: toNullableFloat(form.weight),
    attributes: normalizeAttributesForPayload(form.attributes),
    isDefault: Boolean(form.isDefault),
  });

  const handleAddCreateVariantAttribute = () => {
    setCreateVariantAttributes((prev) => [
      ...prev,
      createEmptyVariantAttribute(),
    ]);
  };

  const handleRemoveCreateVariantAttribute = (attributeId) => {
    setCreateVariantAttributes((prev) => {
      if (prev.length <= 1) {
        return [createEmptyVariantAttribute()];
      }

      return prev.filter((item) => item.id !== attributeId);
    });
  };

  const handleChangeCreateVariantAttribute = (attributeId, field, value) => {
    setCreateVariantAttributes((prev) =>
      prev.map((item) =>
        item.id === attributeId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleCreateVariant = async (event) => {
    event.preventDefault();
    if (!selectedProduct?.id) {
      toast.error("Hãy chọn sản phẩm trước khi tạo biến thể.");
      return;
    }

    setSubmittingVariant(true);
    try {
      const attributesJson = buildAttributesFromEntries(
        createVariantAttributes,
      );
      const payload = buildVariantPayload({
        ...createVariantForm,
        attributes: attributesJson,
      });
      await productService.addProductVariant(selectedProduct.id, payload);
      toast.success("Tạo biến thể thành công.");
      resetCreateVariantDraft();
      await fetchProductById(selectedProduct.id, {
        panel: activePanel,
        syncPanel: false,
      });
    } catch (err) {
      if (err instanceof Error && err.message) {
        toast.error(err.message);
      } else {
        toast.error(getErrorMessage(err, "Tạo biến thể thất bại."));
      }
    } finally {
      setSubmittingVariant(false);
    }
  };

  const startEditVariant = (variant) => {
    setEditVariantTarget(variant);
    setEditVariantForm({
      sku: variant?.sku || "",
      price:
        variant?.price === null || variant?.price === undefined
          ? ""
          : String(variant.price),
      compareAtPrice:
        variant?.compareAtPrice === null ||
        variant?.compareAtPrice === undefined
          ? ""
          : String(variant.compareAtPrice),
      stockQuantity:
        variant?.stockQuantity === null || variant?.stockQuantity === undefined
          ? "0"
          : String(variant.stockQuantity),
      weight:
        variant?.weight === null || variant?.weight === undefined
          ? ""
          : String(variant.weight),
      attributes: formatAttributesForForm(variant?.attributes),
      isDefault: Boolean(variant?.default || variant?.isDefault),
    });
  };

  const openVariantDetail = (variant) => {
    setDetailVariantTarget(variant);
  };

  const handleUpdateVariant = async (event) => {
    event.preventDefault();
    if (!editVariantTarget?.id || !selectedProduct?.id) {
      return;
    }

    setSubmittingVariant(true);
    try {
      const payload = {
        id: editVariantTarget.id,
        ...buildVariantPayload(editVariantForm),
      };
      await productService.updateProductVariant(editVariantTarget.id, payload);
      toast.success("Cập nhật biến thể thành công.");
      setEditVariantTarget(null);
      await fetchProductById(selectedProduct.id, {
        panel: activePanel,
        syncPanel: false,
      });
    } catch (err) {
      if (err instanceof Error && err.message) {
        toast.error(err.message);
      } else {
        toast.error(getErrorMessage(err, "Cập nhật biến thể thất bại."));
      }
    } finally {
      setSubmittingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!selectedProduct?.id) {
      return;
    }

    const confirmed = globalThis.confirm(
      `Bạn có chắc muốn xóa biến thể #${variantId}?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await productService.deleteProductVariant(variantId);
      toast.success("Đã xóa biến thể.");
      await fetchProductById(selectedProduct.id, {
        panel: activePanel,
        syncPanel: false,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa biến thể thất bại."));
    }
  };

  const handleUploadImage = async (event) => {
    event.preventDefault();

    if (!selectedProduct?.id) {
      toast.error("Hãy chọn sản phẩm trước khi upload ảnh.");
      return;
    }

    if (!imageForm.file) {
      toast.error("Vui lòng chọn file ảnh.");
      return;
    }

    const variantId = Number.parseInt(imageForm.variantId, 10);
    if (!Number.isInteger(variantId) || variantId <= 0) {
      toast.error("Vui lòng chọn biến thể cho ảnh.");
      return;
    }

    setSubmittingImage(true);
    try {
      await productService.uploadProductImage(selectedProduct.id, {
        file: imageForm.file,
        variantId,
        isMain: imageForm.isMain,
      });
      toast.success("Upload ảnh thành công.");
      setImageForm(initialImageForm);
      await fetchProductById(selectedProduct.id, {
        panel: activePanel,
        syncPanel: false,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Upload ảnh thất bại."));
    } finally {
      setSubmittingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!selectedProduct?.id) {
      return;
    }

    const confirmed = globalThis.confirm(
      `Bạn có chắc muốn xóa ảnh #${imageId}?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await productService.deleteProductImage(imageId);
      toast.success("Đã xóa ảnh sản phẩm.");
      await fetchProductById(selectedProduct.id, {
        panel: activePanel,
        syncPanel: false,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa ảnh thất bại."));
    }
  };

  const selectedPrimaryOptions = categoryOptions.filter((option) =>
    updateForm.categoryIds.includes(String(option.id)),
  );

  const createPrimaryOptions = categoryOptions.filter((option) =>
    createForm.categoryIds.includes(String(option.id)),
  );

  const normalizedCreateCategorySearch = createCategorySearch
    .trim()
    .toLowerCase();
  const filteredCreateCategoryOptions = categoryOptions.filter((option) => {
    if (!normalizedCreateCategorySearch) {
      return true;
    }

    return option.name?.toLowerCase().includes(normalizedCreateCategorySearch);
  });

  const detailAttributesEntries = parseAttributesToEntries(
    detailVariantTarget?.attributes,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý sản phẩm
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FunnelIcon className="h-4 w-4" />
            Bộ lọc
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateCategorySearch("");
              setCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4" />
            Tạo mới
          </button>

          <button
            type="button"
            onClick={() => fetchProducts()}
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

          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bộ lọc sản phẩm
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

            <form
              onSubmit={applyFilter}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5"
            >
              <div>
                <label
                  htmlFor="filter-name"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Tên sản phẩm
                </label>
                <input
                  id="filter-name"
                  name="name"
                  value={query.name}
                  onChange={handleFilterChange}
                  placeholder="Nhập tên sản phẩm"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-brand"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Thương hiệu
                </label>
                <input
                  id="filter-brand"
                  name="brand"
                  value={query.brand}
                  onChange={handleFilterChange}
                  placeholder="Nhập brand"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-status"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Trạng thái
                </label>
                <input
                  id="filter-status"
                  name="status"
                  value={query.status}
                  onChange={handleFilterChange}
                  placeholder="VD: ACTIVE"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="filter-categories"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Danh mục (chọn nhiều)
                </label>
                <div
                  id="filter-categories"
                  className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categoryOptions.map((category) => {
                      const categoryIdString = String(category.id);
                      return (
                        <label
                          key={category.id}
                          className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={query.categoryIds.includes(
                              categoryIdString,
                            )}
                            onChange={() =>
                              handleFilterCategoryToggle(category.id)
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="truncate">{category.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="filter-min-price"
                    className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                  >
                    Giá từ
                  </label>
                  <input
                    id="filter-min-price"
                    name="minPrice"
                    type="number"
                    min="0"
                    value={query.minPrice}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="filter-max-price"
                    className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                  >
                    Giá đến
                  </label>
                  <input
                    id="filter-max-price"
                    name="maxPrice"
                    type="number"
                    min="0"
                    value={query.maxPrice}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 md:col-span-2">
                <label
                  htmlFor="lookup-product-id"
                  className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
                >
                  Xem nhanh theo Product ID
                </label>
                <div className="flex gap-2">
                  <input
                    id="lookup-product-id"
                    type="number"
                    min="1"
                    value={lookupIdInput}
                    onChange={(event) => setLookupIdInput(event.target.value)}
                    placeholder="Nhập ID"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleLookupProduct}
                    disabled={loadingProduct}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    Xem
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1 md:col-span-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  disabled={loadingList}
                >
                  {loadingList ? "Đang tải..." : "Áp dụng lọc"}
                </button>

                <button
                  type="button"
                  onClick={resetFilter}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Xóa lọc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Danh sách product
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-left">
              <tr>
                {[
                  { key: "id", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "slug", label: "Slug" },
                  { key: "brand", label: "Brand" },
                ].map((option) => {
                  const isActive = query.sortBy === option.key;
                  let SortIcon = ArrowsUpDownIcon;
                  if (isActive) {
                    SortIcon =
                      query.sortDir === "asc" ? ChevronUpIcon : ChevronDownIcon;
                  }

                  return (
                    <th key={option.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSortBy(option.key)}
                        className={`inline-flex items-center gap-1 text-sm font-semibold ${
                          isActive
                            ? "text-blue-700"
                            : "text-gray-900 dark:text-white"
                        }`}
                        title={`Sắp xếp theo ${option.label}`}
                      >
                        <span>{option.label}</span>
                        <SortIcon className="h-4 w-4" />
                      </button>
                    </th>
                  );
                })}
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingList && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Đang tải...
                  </td>
                </tr>
              )}

              {!loadingList && productsPage.content.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Không có sản phẩm nào.
                  </td>
                </tr>
              )}

              {!loadingList &&
                productsPage.content.map((product) => {
                  const isActive = selectedProductId === product.id;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className={`cursor-pointer border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isActive ? "bg-blue-50 dark:bg-blue-900/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">{product.id}</td>
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3">{product.slug}</td>
                      <td className="px-4 py-3">{product.brand}</td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDetailFromTable(product.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                          title="Xem chi tiết"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEditFromTable(product.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900"
                          title="Cập nhật"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDeleteFromTable(product.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                          title="Xóa"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenVariantsFromTable(product.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                          title="Quản lý biến thể"
                        >
                          <RectangleStackIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenImagesFromTable(product.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900"
                          title="Quản lý hình ảnh"
                        >
                          <PhotoIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Trang {(productsPage.pageNumber || 0) + 1} /{" "}
            {productsPage.totalPages || 1} ({productsPage.totalElements || 0}{" "}
            sản phẩm)
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="product-jump-page"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Tới trang
              </label>
              <input
                id="product-jump-page"
                type="number"
                min="1"
                max={Math.max(1, productsPage.totalPages || 1)}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onKeyDown={handleJumpToPage}
                className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              disabled={productsPage.pageNumber <= 0 || loadingList}
              onClick={() =>
                handleChangePage(Math.max(0, productsPage.pageNumber - 1))
              }
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={
                loadingList ||
                (productsPage.pageNumber || 0) + 1 >=
                  (productsPage.totalPages || 1)
              }
              onClick={() =>
                handleChangePage(
                  Math.min(
                    Math.max(0, (productsPage.totalPages || 1) - 1),
                    productsPage.pageNumber + 1,
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

      {selectedProduct && activePanel === PANEL_DETAIL && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chi tiết sản phẩm
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="inline-flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Đóng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">ID</p>
                  <p className="font-medium">{selectedProduct.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tên</p>
                  <p className="font-medium">{selectedProduct.name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Slug</p>
                  <p className="font-medium">{selectedProduct.slug || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Brand</p>
                  <p className="font-medium">{selectedProduct.brand || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cân nặng</p>
                  <p className="font-medium">{selectedProduct.weight ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trạng thái</p>
                  <p className="font-medium">
                    {selectedProduct.active ? "Kích hoạt" : "Vô hiệu"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tạo lúc</p>
                  <p className="font-medium">
                    {formatDateTime(selectedProduct.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cập nhật lúc</p>
                  <p className="font-medium">
                    {formatDateTime(selectedProduct.updatedAt)}
                  </p>
                </div>
                <div className="md:col-span-2 xl:col-span-1">
                  <p className="text-gray-500">Danh mục chính</p>
                  <p className="font-medium">
                    {selectedProduct.primaryCategory?.name || "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Mô tả</p>
                <p className="text-sm">{selectedProduct.description || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Danh mục</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedProduct.categories || []).map((category) => (
                    <span
                      key={category.id}
                      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                    >
                      {category.name}
                    </span>
                  ))}
                  {(selectedProduct.categories || []).length === 0 && (
                    <span className="text-sm text-gray-500">
                      Chưa có danh mục
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && activePanel === PANEL_VARIANTS && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quản lý biến thể - Product #{selectedProduct.id}
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="inline-flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Đóng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVariant} className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <input
                  required
                  placeholder="SKU"
                  value={createVariantForm.sku}
                  onChange={(event) =>
                    setCreateVariantForm((prev) => ({
                      ...prev,
                      sku: event.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <input
                  required
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Giá bán"
                  value={createVariantForm.price}
                  onChange={(event) =>
                    setCreateVariantForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Giá so sánh"
                  value={createVariantForm.compareAtPrice}
                  onChange={(event) =>
                    setCreateVariantForm((prev) => ({
                      ...prev,
                      compareAtPrice: event.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Tồn kho"
                  value={createVariantForm.stockQuantity}
                  onChange={(event) =>
                    setCreateVariantForm((prev) => ({
                      ...prev,
                      stockQuantity: event.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Cân nặng"
                  value={createVariantForm.weight}
                  onChange={(event) =>
                    setCreateVariantForm((prev) => ({
                      ...prev,
                      weight: event.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                  <input
                    type="checkbox"
                    checked={createVariantForm.isDefault}
                    onChange={(event) =>
                      setCreateVariantForm((prev) => ({
                        ...prev,
                        isDefault: event.target.checked,
                      }))
                    }
                  />
                  <span>Biến thể mặc định</span>
                </label>
                <button
                  type="submit"
                  disabled={submittingVariant}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4" />
                  Thêm biến thể
                </button>
              </div>

              <div className="rounded-lg border border-gray-300 dark:border-gray-600 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Thuộc tính biến thể</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Nhập theo cặp tên thuộc tính và giá trị để tạo JsonNode dễ
                      hơn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCreateVariantAttribute}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Thêm thuộc tính
                  </button>
                </div>

                <div className="space-y-2">
                  {createVariantAttributes.map((attribute) => (
                    <div
                      key={attribute.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Tên thuộc tính (VD: Size)"
                        value={attribute.key}
                        onChange={(event) =>
                          handleChangeCreateVariantAttribute(
                            attribute.id,
                            "key",
                            event.target.value,
                          )
                        }
                        className="md:col-span-5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                      <input
                        type="text"
                        placeholder="Giá trị (VD: M)"
                        value={attribute.value}
                        onChange={(event) =>
                          handleChangeCreateVariantAttribute(
                            attribute.id,
                            "value",
                            event.target.value,
                          )
                        }
                        className="md:col-span-6 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveCreateVariantAttribute(attribute.id)
                        }
                        className="md:col-span-1 px-2 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    JSON sẽ gửi lên:
                  </p>
                  <pre className="text-xs whitespace-pre-wrap break-all text-gray-700 dark:text-gray-200">
                    {buildAttributesPreview(createVariantAttributes)}
                  </pre>
                </div>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Giá</th>
                    <th className="py-2 pr-4">Tồn kho</th>
                    <th className="py-2 pr-4">Mặc định</th>
                    <th className="py-2 pr-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {productVariants.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-5 text-center text-gray-500"
                      >
                        Chưa có biến thể
                      </td>
                    </tr>
                  )}
                  {productVariants.map((variant) => (
                    <tr
                      key={variant.id}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-2 pr-4">{variant.id}</td>
                      <td className="py-2 pr-4">{variant.sku}</td>
                      <td className="py-2 pr-4">
                        {formatCurrency(variant.price)}
                      </td>
                      <td className="py-2 pr-4">
                        {variant.stockQuantity ?? 0}
                      </td>
                      <td className="py-2 pr-4">
                        {variant.default || variant.isDefault ? "Có" : "Không"}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openVariantDetail(variant)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <EyeIcon className="h-4 w-4" /> Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditVariant(variant)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
                          >
                            <PencilSquareIcon className="h-4 w-4" /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(variant.id)}
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
            </div>
          </div>
        </div>
      )}

      {selectedProduct && activePanel === PANEL_IMAGES && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quản lý hình ảnh - Product #{selectedProduct.id}
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="inline-flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Đóng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUploadImage}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label htmlFor="image-file" className="block text-sm mb-1">
                  File ảnh
                </label>
                <input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setImageForm((prev) => ({
                      ...prev,
                      file: event.target.files?.[0] || null,
                    }))
                  }
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label htmlFor="image-variant" className="block text-sm mb-1">
                  Gắn với biến thể
                </label>
                <select
                  id="image-variant"
                  value={imageForm.variantId}
                  onChange={(event) =>
                    setImageForm((prev) => ({
                      ...prev,
                      variantId: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="">-- Chọn biến thể --</option>
                  {productVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      #{variant.id} - {variant.sku}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                <input
                  type="checkbox"
                  checked={imageForm.isMain}
                  onChange={(event) =>
                    setImageForm((prev) => ({
                      ...prev,
                      isMain: event.target.checked,
                    }))
                  }
                />
                <span>Đặt làm ảnh chính</span>
              </label>

              <button
                type="submit"
                disabled={submittingImage}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <PhotoIcon className="h-4 w-4" />
                {submittingImage ? "Đang upload..." : "Upload ảnh"}
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(selectedProduct.images || []).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chưa có ảnh nào.
                </p>
              )}

              {(selectedProduct.images || []).map((image) => (
                <div
                  key={image.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText || "product-image"}
                    className="w-full h-44 object-cover bg-gray-100"
                  />
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-gray-500">Ảnh #{image.id}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      Variant: {image.variantId || "-"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      {image.main || image.isMain ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                          Ảnh chính
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                          Ảnh phụ
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreateProduct}
            className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl p-5 space-y-4 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Thêm sản phẩm mới
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label htmlFor="create-name" className="block text-sm mb-1">
                    Tên sản phẩm
                  </label>
                  <input
                    id="create-name"
                    required
                    value={createForm.name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label htmlFor="create-slug" className="block text-sm mb-1">
                    Slug
                  </label>
                  <input
                    id="create-slug"
                    required
                    value={createForm.slug}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        slug: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label htmlFor="create-brand" className="block text-sm mb-1">
                    Thương hiệu
                  </label>
                  <input
                    id="create-brand"
                    value={createForm.brand}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        brand: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label htmlFor="create-weight" className="block text-sm mb-1">
                    Cân nặng (kg)
                  </label>
                  <input
                    id="create-weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.weight}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        weight: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-description"
                    className="block text-sm mb-1"
                  >
                    Mô tả
                  </label>
                  <textarea
                    id="create-description"
                    rows="5"
                    value={createForm.description}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="create-category-ids"
                    className="block text-sm mb-1"
                  >
                    Danh mục
                  </label>
                  <input
                    id="create-category-ids"
                    type="text"
                    value={createCategorySearch}
                    onChange={(event) =>
                      setCreateCategorySearch(event.target.value)
                    }
                    placeholder="Tìm nhanh category..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />

                  <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {filteredCreateCategoryOptions.map((category) => {
                        const categoryIdString = String(category.id);
                        const isChecked =
                          createForm.categoryIds.includes(categoryIdString);

                        return (
                          <label
                            key={category.id}
                            className="inline-flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                handleCreateCategoryToggle(category.id)
                              }
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span>{category.name}</span>
                          </label>
                        );
                      })}

                      {filteredCreateCategoryOptions.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Không có category phù hợp
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="create-primary-category"
                    className="block text-sm mb-1"
                  >
                    Danh mục chính
                  </label>
                  <select
                    id="create-primary-category"
                    value={createForm.primaryCategoryId}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        primaryCategoryId: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    <option value="">-- Không chọn --</option>
                    {createPrimaryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="create-active"
                    type="checkbox"
                    checked={createForm.active}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="create-active" className="text-sm">
                    Kích hoạt sản phẩm
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setCreateCategorySearch("");
                  setCreateForm(initialProductForm);
                }}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                {submittingCreate ? "Đang tạo..." : "Tạo sản phẩm"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedProduct && activePanel === PANEL_EDIT && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateProduct}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sửa sản phẩm
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="inline-flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Đóng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="update-name" className="block text-sm mb-1">
                  Tên sản phẩm
                </label>
                <input
                  id="update-name"
                  required
                  value={updateForm.name}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label htmlFor="update-slug" className="block text-sm mb-1">
                  Slug
                </label>
                <input
                  id="update-slug"
                  required
                  value={updateForm.slug}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      slug: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label htmlFor="update-brand" className="block text-sm mb-1">
                  Thương hiệu
                </label>
                <input
                  id="update-brand"
                  value={updateForm.brand}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      brand: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label htmlFor="update-weight" className="block text-sm mb-1">
                  Cân nặng (kg)
                </label>
                <input
                  id="update-weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={updateForm.weight}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      weight: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="update-description"
                className="block text-sm mb-1"
              >
                Mô tả
              </label>
              <textarea
                id="update-description"
                rows="3"
                value={updateForm.description}
                onChange={(event) =>
                  setUpdateForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="update-category-ids"
                  className="block text-sm mb-1"
                >
                  Danh mục
                </label>
                <select
                  id="update-category-ids"
                  multiple
                  value={updateForm.categoryIds}
                  onChange={(event) =>
                    handleCategoryMultiSelect(event, setUpdateForm)
                  }
                  className="w-full min-h-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="update-primary-category"
                  className="block text-sm mb-1"
                >
                  Danh mục chính
                </label>
                <select
                  id="update-primary-category"
                  value={updateForm.primaryCategoryId}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      primaryCategoryId: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="">-- Không chọn --</option>
                  {selectedPrimaryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    id="update-active"
                    type="checkbox"
                    checked={updateForm.active}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="update-active" className="text-sm">
                    Kích hoạt sản phẩm
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingUpdate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PencilSquareIcon className="h-4 w-4" />
                {submittingUpdate ? "Đang lưu..." : "Lưu cập nhật"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editVariantTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleUpdateVariant}
            className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl p-5 space-y-3"
          >
            <h3 className="text-lg font-semibold">
              Cập nhật biến thể #{editVariantTarget.id}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-variant-sku"
                  className="block text-sm mb-1"
                >
                  SKU
                </label>
                <input
                  id="edit-variant-sku"
                  required
                  value={editVariantForm.sku}
                  onChange={(event) =>
                    setEditVariantForm((prev) => ({
                      ...prev,
                      sku: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-variant-price"
                  className="block text-sm mb-1"
                >
                  Giá bán
                </label>
                <input
                  id="edit-variant-price"
                  required
                  type="number"
                  min="0"
                  step="1000"
                  value={editVariantForm.price}
                  onChange={(event) =>
                    setEditVariantForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-variant-compare"
                  className="block text-sm mb-1"
                >
                  Giá so sánh
                </label>
                <input
                  id="edit-variant-compare"
                  type="number"
                  min="0"
                  step="1000"
                  value={editVariantForm.compareAtPrice}
                  onChange={(event) =>
                    setEditVariantForm((prev) => ({
                      ...prev,
                      compareAtPrice: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-variant-stock"
                  className="block text-sm mb-1"
                >
                  Tồn kho
                </label>
                <input
                  id="edit-variant-stock"
                  type="number"
                  min="0"
                  value={editVariantForm.stockQuantity}
                  onChange={(event) =>
                    setEditVariantForm((prev) => ({
                      ...prev,
                      stockQuantity: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-variant-weight"
                  className="block text-sm mb-1"
                >
                  Cân nặng
                </label>
                <input
                  id="edit-variant-weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editVariantForm.weight}
                  onChange={(event) =>
                    setEditVariantForm((prev) => ({
                      ...prev,
                      weight: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                <input
                  type="checkbox"
                  checked={editVariantForm.isDefault}
                  onChange={(event) =>
                    setEditVariantForm((prev) => ({
                      ...prev,
                      isDefault: event.target.checked,
                    }))
                  }
                />
                <span>Biến thể mặc định</span>
              </label>
            </div>

            <div>
              <label htmlFor="edit-variant-attr" className="block text-sm mb-1">
                Thuộc tính
              </label>
              <textarea
                id="edit-variant-attr"
                value={editVariantForm.attributes}
                onChange={(event) =>
                  setEditVariantForm((prev) => ({
                    ...prev,
                    attributes: event.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditVariantTarget(null)}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingVariant}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Lưu biến thể
              </button>
            </div>
          </form>
        </div>
      )}

      {detailVariantTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 className="text-lg font-semibold">
                Chi tiết biến thể #{detailVariantTarget.id}
              </h3>
              <button
                type="button"
                onClick={() => setDetailVariantTarget(null)}
                className="inline-flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Đóng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">ID</p>
                <p className="font-medium">{detailVariantTarget.id}</p>
              </div>
              <div>
                <p className="text-gray-500">SKU</p>
                <p className="font-medium">{detailVariantTarget.sku || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Giá bán</p>
                <p className="font-medium">
                  {formatCurrency(detailVariantTarget.price)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Giá so sánh</p>
                <p className="font-medium">
                  {formatCurrency(detailVariantTarget.compareAtPrice)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Tồn kho</p>
                <p className="font-medium">
                  {detailVariantTarget.stockQuantity ?? 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Cân nặng</p>
                <p className="font-medium">
                  {detailVariantTarget.weight ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Mặc định</p>
                <p className="font-medium">
                  {detailVariantTarget.default || detailVariantTarget.isDefault
                    ? "Có"
                    : "Không"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Tạo lúc</p>
                <p className="font-medium">
                  {formatDateTime(detailVariantTarget.createdAt)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Cập nhật lúc</p>
                <p className="font-medium">
                  {formatDateTime(detailVariantTarget.updatedAt)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Thuộc tính</p>
              {detailAttributesEntries.length > 0 ? (
                <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-2">
                  {detailAttributesEntries.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {item.key}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {item.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  {detailVariantTarget.attributes || "-"}
                </pre>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailVariantTarget(null)}
                className="px-4 py-2 rounded border border-gray-300"
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
