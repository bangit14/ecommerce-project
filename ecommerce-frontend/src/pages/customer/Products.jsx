import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import CustomerAccountHeader from "../../components/customer/CustomerAccountHeader";
import CustomerAccountFooter from "../../components/customer/CustomerAccountFooter";
import { categoryService } from "../../services/categoryService";
import { productService } from "../../services/productService";
import { getErrorMessage } from "../../utils/errorHandler";

const PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { value: "popular", label: "Bán chạy" },
  { value: "priceAsc", label: "Giá thấp đến cao" },
  { value: "priceDesc", label: "Giá cao đến thấp" },
];

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Liên hệ";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "Liên hệ";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const flattenCategoryTree = (tree) => {
  const categoryMap = new Map();

  const walk = (node, parentId = null) => {
    if (!node?.id) {
      return;
    }

    const normalizedNode = {
      ...node,
      parentId: node.parentId ?? parentId,
      children: Array.isArray(node.children) ? node.children : [],
    };

    categoryMap.set(String(node.id), normalizedNode);

    normalizedNode.children.forEach((child) => {
      walk(child, node.id);
    });
  };

  (Array.isArray(tree) ? tree : []).forEach((rootNode) => walk(rootNode, null));
  return categoryMap;
};

const getProductImage = (product, detail) => {
  const detailImages = Array.isArray(detail?.images) ? detail.images : [];
  const mainDetailImage =
    detailImages.find((image) => image?.isMain || image?.main) ||
    detailImages[0];

  if (mainDetailImage?.imageUrl) {
    return mainDetailImage.imageUrl;
  }

  if (product?.mainImage?.imageUrl) {
    return product.mainImage.imageUrl;
  }

  return "";
};

const getProductVariants = (product, detail) => {
  if (Array.isArray(detail?.variants)) {
    return detail.variants;
  }

  if (Array.isArray(product?.variants)) {
    return product.variants;
  }

  return [];
};

const getProductPriceData = (product, detail) => {
  const variants = getProductVariants(product, detail);

  const prices = variants
    .map((variant) => toSafeNumber(variant?.price))
    .filter((value) => value !== null);

  const comparePrices = variants
    .map((variant) => toSafeNumber(variant?.compareAtPrice))
    .filter((value) => value !== null);

  const minPrice =
    prices.length > 0
      ? prices.reduce((min, value) => Math.min(min, value))
      : null;
  const maxCompareAt =
    comparePrices.length > 0
      ? comparePrices.reduce((max, value) => Math.max(max, value))
      : null;

  return {
    displayPrice: minPrice,
    comparePrice:
      maxCompareAt !== null && minPrice !== null && maxCompareAt > minPrice
        ? maxCompareAt
        : null,
    sortPrice: minPrice,
  };
};

const getSoldScore = (product, detail) => {
  const candidates = [
    detail?.soldCount,
    detail?.totalSold,
    detail?.salesCount,
    product?.soldCount,
    product?.totalSold,
    product?.salesCount,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
};

const getStockQuantity = (detail) => {
  const variants = Array.isArray(detail?.variants) ? detail.variants : [];
  return variants.reduce((sum, variant) => {
    const quantity = Number(variant?.stockQuantity);
    return Number.isFinite(quantity) ? sum + quantity : sum;
  }, 0);
};

const parseCategoryFilterIds = (selectedCategoryId, selectedSubcategoryId) => {
  if (selectedSubcategoryId) {
    const parsedSubcategoryId = Number.parseInt(selectedSubcategoryId, 10);
    return Number.isInteger(parsedSubcategoryId) ? [parsedSubcategoryId] : [];
  }

  if (selectedCategoryId) {
    const parsedCategoryId = Number.parseInt(selectedCategoryId, 10);
    return Number.isInteger(parsedCategoryId) ? [parsedCategoryId] : [];
  }

  return [];
};

const buildProductsFilter = ({
  appliedFilter,
  selectedCategoryId,
  selectedSubcategoryId,
}) => {
  const categoryFilterIds = parseCategoryFilterIds(
    selectedCategoryId,
    selectedSubcategoryId,
  );

  return {
    ...(appliedFilter.keyword ? { name: appliedFilter.keyword.trim() } : {}),
    ...(appliedFilter.brand ? { brand: appliedFilter.brand.trim() } : {}),
    ...(appliedFilter.minPrice ? { minPrice: appliedFilter.minPrice } : {}),
    ...(appliedFilter.maxPrice ? { maxPrice: appliedFilter.maxPrice } : {}),
    ...(categoryFilterIds.length > 0 ? { categoryId: categoryFilterIds } : {}),
  };
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const initialSubcategoryId = searchParams.get("subcategoryId") || "";
  const initialSort = searchParams.get("sort") || "popular";
  const initialKeyword = searchParams.get("keyword") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";

  const selectedCategoryId = searchParams.get("categoryId") || "";
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState(initialSubcategoryId);
  const [sortOption, setSortOption] = useState(
    SORT_OPTIONS.some((option) => option.value === initialSort)
      ? initialSort
      : "popular",
  );

  const [pendingFilter, setPendingFilter] = useState({
    keyword: initialKeyword,
    brand: initialBrand,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
  });

  const [appliedFilter, setAppliedFilter] = useState({
    keyword: initialKeyword,
    brand: initialBrand,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
  });

  const [productsPage, setProductsPage] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    pageNumber: 0,
    pageSize: PAGE_SIZE,
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    if (!Number.isFinite(rawPage) || rawPage < 1) {
      return 0;
    }
    return rawPage - 1;
  });
  const [productDetailsMap, setProductDetailsMap] = useState({});

  const categoryMap = useMemo(
    () => flattenCategoryTree(categories),
    [categories],
  );

  const activeCategory = selectedCategoryId
    ? categoryMap.get(String(selectedCategoryId))
    : null;

  const subcategories = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    if (
      Array.isArray(activeCategory.children) &&
      activeCategory.children.length > 0
    ) {
      return activeCategory.children;
    }

    if (activeCategory.parentId) {
      const parentCategory = categoryMap.get(String(activeCategory.parentId));
      if (
        parentCategory &&
        Array.isArray(parentCategory.children) &&
        parentCategory.children.length > 0
      ) {
        return parentCategory.children;
      }
    }

    return [];
  }, [activeCategory, categoryMap]);

  const availableBrands = useMemo(() => {
    const brands = (productsPage.content || [])
      .map((product) => (product?.brand || "").trim())
      .filter(Boolean);

    return Array.from(new Set(brands)).sort((left, right) =>
      left.localeCompare(right, "vi"),
    );
  }, [productsPage.content]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCategoryId) {
      params.set("categoryId", String(selectedCategoryId));
    }

    if (selectedSubcategoryId) {
      params.set("subcategoryId", String(selectedSubcategoryId));
    }

    if (sortOption && sortOption !== "popular") {
      params.set("sort", sortOption);
    }

    if (appliedFilter.keyword) {
      params.set("keyword", appliedFilter.keyword);
    }

    if (appliedFilter.brand) {
      params.set("brand", appliedFilter.brand);
    }

    if (appliedFilter.minPrice) {
      params.set("minPrice", appliedFilter.minPrice);
    }

    if (appliedFilter.maxPrice) {
      params.set("maxPrice", appliedFilter.maxPrice);
    }

    if (currentPage > 0) {
      params.set("page", String(currentPage + 1));
    }

    setSearchParams(params, { replace: true });
  }, [
    appliedFilter,
    currentPage,
    selectedCategoryId,
    selectedSubcategoryId,
    setSearchParams,
    sortOption,
  ]);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const data = await categoryService.getCategoryTree();
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setCategories([]);
        }
        toast.error(getErrorMessage(error, "Không thể tải danh mục."));
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setProductsLoading(true);

      try {
        const filter = buildProductsFilter({
          appliedFilter,
          selectedCategoryId,
          selectedSubcategoryId,
        });

        const data = await productService.getProducts({
          filter,
          page: currentPage,
          size: PAGE_SIZE,
          sortBy: "createdAt",
          sortDir: "desc",
        });

        if (isMounted) {
          setProductsPage(
            data || {
              content: [],
              totalElements: 0,
              totalPages: 0,
              pageNumber: currentPage,
              pageSize: PAGE_SIZE,
            },
          );
        }
      } catch (error) {
        if (isMounted) {
          setProductsPage({
            content: [],
            totalElements: 0,
            totalPages: 0,
            pageNumber: currentPage,
            pageSize: PAGE_SIZE,
          });
        }

        toast.error(getErrorMessage(error, "Không thể tải sản phẩm."));
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [appliedFilter, currentPage, selectedCategoryId, selectedSubcategoryId]);

  useEffect(() => {
    let isMounted = true;

    const fetchProductDetails = async () => {
      const products = Array.isArray(productsPage.content)
        ? productsPage.content
        : [];

      if (products.length === 0) {
        setProductDetailsMap({});
        return;
      }

      setDetailsLoading(true);

      try {
        const detailResults = await Promise.allSettled(
          products.map((product) => productService.getProductById(product.id)),
        );

        if (!isMounted) {
          return;
        }

        const nextDetailsMap = {};

        detailResults.forEach((result, index) => {
          if (result.status !== "fulfilled") {
            return;
          }

          const productId = products[index]?.id;
          if (!productId) {
            return;
          }

          nextDetailsMap[productId] = result.value;
        });

        setProductDetailsMap(nextDetailsMap);
      } finally {
        if (isMounted) {
          setDetailsLoading(false);
        }
      }
    };

    fetchProductDetails();

    return () => {
      isMounted = false;
    };
  }, [productsPage.content]);

  const productCards = useMemo(() => {
    const products = Array.isArray(productsPage.content)
      ? productsPage.content
      : [];

    const mapped = products.map((product) => {
      const detail = productDetailsMap[product.id];
      const { displayPrice, comparePrice, sortPrice } = getProductPriceData(
        product,
        detail,
      );

      return {
        ...product,
        displayPrice,
        comparePrice,
        sortPrice,
        imageUrl: getProductImage(product, detail),
        soldScore: getSoldScore(product, detail),
        stockQuantity: getStockQuantity(detail),
      };
    });

    if (sortOption === "priceAsc") {
      return [...mapped].sort((left, right) => {
        if (left.sortPrice === null && right.sortPrice === null) {
          return 0;
        }

        if (left.sortPrice === null) {
          return 1;
        }

        if (right.sortPrice === null) {
          return -1;
        }

        return left.sortPrice - right.sortPrice;
      });
    }

    if (sortOption === "priceDesc") {
      return [...mapped].sort((left, right) => {
        if (left.sortPrice === null && right.sortPrice === null) {
          return 0;
        }

        if (left.sortPrice === null) {
          return 1;
        }

        if (right.sortPrice === null) {
          return -1;
        }

        return right.sortPrice - left.sortPrice;
      });
    }

    return [...mapped].sort((left, right) => {
      const soldDiff = right.soldScore - left.soldScore;
      if (soldDiff !== 0) {
        return soldDiff;
      }

      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  }, [productDetailsMap, productsPage.content, sortOption]);

  const handleApplyFilter = () => {
    setAppliedFilter({
      keyword: pendingFilter.keyword.trim(),
      brand: pendingFilter.brand.trim(),
      minPrice: pendingFilter.minPrice.trim(),
      maxPrice: pendingFilter.maxPrice.trim(),
    });
    setCurrentPage(0);
    setIsFilterPanelOpen(false);
  };

  const handleResetFilter = () => {
    const next = {
      keyword: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
    };

    setPendingFilter(next);
    setAppliedFilter(next);
    setCurrentPage(0);
    setIsFilterPanelOpen(false);
  };

  const handleSubcategoryChange = (subcategoryId) => {
    setSelectedSubcategoryId(String(subcategoryId));
    setCurrentPage(0);
  };

  const handleClearSubcategory = () => {
    setSelectedSubcategoryId("");
    setCurrentPage(0);
  };

  const totalPages = Math.max(1, productsPage.totalPages || 1);
  const currentPageLabel = (productsPage.pageNumber || 0) + 1;

  const isSubcategoryUnselected = selectedSubcategoryId === "";
  const hasAppliedFilter = Boolean(
    appliedFilter.keyword ||
    appliedFilter.brand ||
    appliedFilter.minPrice ||
    appliedFilter.maxPrice ||
    selectedSubcategoryId,
  );
  const selectedCategoryLabel = activeCategory?.name || "Danh mục đã chọn";
  const hasSelectedCategory = selectedCategoryId !== "";
  const productListSearch = searchParams.toString();

  let subcategoryFilterContent;
  if (hasSelectedCategory === false) {
    subcategoryFilterContent = (
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Vui lòng chọn category từ trang chủ để xem danh mục con.
      </p>
    );
  } else if (categoriesLoading) {
    subcategoryFilterContent = (
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Đang tải danh mục...
      </p>
    );
  } else if (subcategories.length === 0) {
    subcategoryFilterContent = (
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Category này chưa có danh mục con.
      </p>
    );
  } else {
    subcategoryFilterContent = (
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleClearSubcategory}
          className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
            isSubcategoryUnselected
              ? "bg-emerald-50 text-emerald-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          }`}
        >
          Tất cả danh mục con
        </button>

        {subcategories.map((subcategory) => {
          const isActiveSub =
            String(subcategory.id) === String(selectedSubcategoryId);

          return (
            <button
              key={subcategory.id}
              type="button"
              onClick={() => handleSubcategoryChange(subcategory.id)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                isActiveSub
                  ? "bg-emerald-50 text-emerald-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              }`}
            >
              {subcategory.name}
            </button>
          );
        })}
      </div>
    );
  }

  let productsSectionContent;
  if (productsLoading) {
    productsSectionContent = (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-300">
        Đang tải sản phẩm...
      </div>
    );
  } else if (productCards.length === 0) {
    productsSectionContent = (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-10 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Không tìm thấy sản phẩm phù hợp
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Thử thay đổi bộ lọc hoặc khoảng giá để xem thêm sản phẩm.
        </p>
      </div>
    );
  } else {
    productsSectionContent = (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {productCards.map((product) => (
            <Link
              key={product.id}
              to={
                productListSearch
                  ? `/products/${product.id}?${productListSearch}`
                  : `/products/${product.id}`
              }
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name || "product-image"}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                    Chưa có ảnh
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {product.brand || "No Brand"}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 min-h-[40px]">
                  {product.name}
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-red-600">
                    {formatCurrency(product.displayPrice)}
                  </span>
                  {product.comparePrice !== null && (
                    <span className="text-xs line-through text-gray-500">
                      {formatCurrency(product.comparePrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span>Bán chạy: {product.soldScore}</span>
                  <span>Tồn kho: {product.stockQuantity}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Trang {currentPageLabel} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage <= 0 || productsLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Trước
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(Math.max(0, totalPages - 1), prev + 1),
                )
              }
              disabled={productsLoading || currentPage + 1 >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {detailsLoading && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
            Đang cập nhật giá, ảnh và tồn kho...
          </p>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <CustomerAccountHeader />

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Danh sách sản phẩm
              </h1>

              <button
                type="button"
                onClick={() => {
                  setCurrentPage(0);
                  setAppliedFilter((prev) => ({ ...prev }));
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Tải lại
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
            <aside className="xl:sticky xl:top-24 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Danh mục con
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Category hiện tại: {selectedCategoryLabel}
                  </p>
                </div>
                {hasAppliedFilter && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-blue-600 text-white text-xs px-1">
                    1
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                {subcategoryFilterContent}
              </div>
            </aside>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  Bộ lọc
                  {hasAppliedFilter && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-blue-600 text-white text-xs px-1">
                      1
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {productsPage.totalElements || 0} sản phẩm
                  </span>
                  <label
                    htmlFor="products-sort"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Sắp xếp
                  </label>
                  <select
                    id="products-sort"
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {productsSectionContent}
            </div>
          </section>
        </div>
      </main>
      <CustomerAccountFooter />
      {isFilterPanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 sm:p-6">
          <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bộ lọc sản phẩm
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="inline-flex items-center justify-center rounded-lg p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Đóng bộ lọc"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="filter-keyword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Tìm kiếm sản phẩm
                    </label>
                    <input
                      id="filter-keyword"
                      value={pendingFilter.keyword}
                      onChange={(event) =>
                        setPendingFilter((prev) => ({
                          ...prev,
                          keyword: event.target.value,
                        }))
                      }
                      placeholder="Nhập tên sản phẩm"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="filter-brand"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Brand
                    </label>
                    <input
                      id="filter-brand"
                      value={pendingFilter.brand}
                      onChange={(event) =>
                        setPendingFilter((prev) => ({
                          ...prev,
                          brand: event.target.value,
                        }))
                      }
                      placeholder="Ví dụ: Nike, Adidas"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />

                    {availableBrands.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableBrands.map((brand) => {
                          const active =
                            pendingFilter.brand.trim().toLowerCase() ===
                            brand.trim().toLowerCase();
                          return (
                            <button
                              key={brand}
                              type="button"
                              onClick={() =>
                                setPendingFilter((prev) => ({
                                  ...prev,
                                  brand: brand,
                                }))
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                active
                                  ? "border-blue-600 bg-blue-50 text-blue-700"
                                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500"
                              }`}
                            >
                              {brand}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="filter-min-price"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Giá từ
                      </label>
                      <input
                        id="filter-min-price"
                        type="number"
                        min="0"
                        value={pendingFilter.minPrice}
                        onChange={(event) =>
                          setPendingFilter((prev) => ({
                            ...prev,
                            minPrice: event.target.value,
                          }))
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="filter-max-price"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Giá đến
                      </label>
                      <input
                        id="filter-max-price"
                        type="number"
                        min="0"
                        value={pendingFilter.maxPrice}
                        onChange={(event) =>
                          setPendingFilter((prev) => ({
                            ...prev,
                            maxPrice: event.target.value,
                          }))
                        }
                        placeholder="999999"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Danh mục con đang hiển thị bên ngoài bộ lọc.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Áp dụng
                </button>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Xóa lọc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
