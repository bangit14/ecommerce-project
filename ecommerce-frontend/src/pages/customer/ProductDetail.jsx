import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  StarIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { cartService } from "../../services/cartService";
import { productService } from "../../services/productService";
import { getErrorMessage } from "../../utils/errorHandler";

const FOOTER_SECTIONS = [
  {
    id: "about",
    title: "Về chúng tôi",
    links: [
      { label: "Giới thiệu", href: "/" },
      { label: "Tuyển dụng", href: "/" },
      { label: "Blog", href: "/" },
    ],
  },
  {
    id: "support",
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", href: "/" },
      { label: "Liên hệ", href: "/" },
      { label: "Khiếu nại", href: "/" },
    ],
  },
  {
    id: "policy",
    title: "Chính sách",
    links: [
      { label: "Điều khoản", href: "/" },
      { label: "Bảo mật", href: "/" },
      { label: "Vận chuyển", href: "/" },
    ],
  },
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

const getSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const collectProductImages = (productDetail) => {
  const directImages = Array.isArray(productDetail?.images)
    ? productDetail.images
    : [];

  if (directImages.length > 0) {
    return directImages;
  }

  const variants = Array.isArray(productDetail?.variants)
    ? productDetail.variants
    : [];

  return variants.flatMap((variant) =>
    Array.isArray(variant?.images) ? variant.images : [],
  );
};

const getProductImage = (product) => {
  if (product?.mainImage?.imageUrl) {
    return product.mainImage.imageUrl;
  }

  const images = Array.isArray(product?.images) ? product.images : [];
  const mainImage = images.find((image) => image?.isMain || image?.main);
  return mainImage?.imageUrl || images[0]?.imageUrl || "";
};

const getProductDisplayPrice = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const prices = variants
    .map((variant) => getSafeNumber(variant?.price))
    .filter((value) => value !== null);

  if (prices.length === 0) {
    return null;
  }

  return prices.reduce((min, value) => Math.min(min, value));
};

const parseVariantAttributes = (attributes) => {
  if (!attributes) {
    return {};
  }

  if (typeof attributes === "string") {
    try {
      const parsed = JSON.parse(attributes);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([key, value]) => [
            key,
            value === null || value === undefined ? "" : String(value),
          ]),
        );
      }
    } catch {
      return {};
    }

    return {};
  }

  if (typeof attributes === "object" && !Array.isArray(attributes)) {
    return Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [
        key,
        value === null || value === undefined ? "" : String(value),
      ]),
    );
  }

  return {};
};

const getVariantPreviewImage = (variant) => {
  const variantImages = Array.isArray(variant?.images) ? variant.images : [];
  const mainImage =
    variantImages.find((image) => image?.isMain || image?.main) ||
    variantImages[0];

  return mainImage?.imageUrl || "";
};

const buildPriceRangeLabel = (minPrice, maxPrice) => {
  if (minPrice !== null && maxPrice !== null && minPrice !== maxPrice) {
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  }

  return formatCurrency(minPrice);
};

const getVariantOptionButtonClass = (isSelected, isSelectable) => {
  if (isSelected) {
    return "border-red-500 bg-red-50 text-red-600 shadow-sm";
  }

  if (isSelectable) {
    return "border-gray-300 text-gray-800 hover:border-red-400 dark:border-gray-600 dark:text-gray-100";
  }

  return "border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800";
};

const isVariantOptionSelectable = ({
  variants,
  groups,
  selectedOptions,
  attributeName,
  optionValue,
}) => {
  if (variants.length === 0) {
    return false;
  }

  return variants.some((variant) => {
    const stockQuantity = Number(variant?.stockQuantity);
    if (!Number.isFinite(stockQuantity) || stockQuantity <= 0) {
      return false;
    }

    if (variant.optionMap?.[attributeName] !== optionValue) {
      return false;
    }

    return groups.every((group) => {
      if (group.name === attributeName) {
        return true;
      }

      const selectedValue = selectedOptions[group.name];
      if (!selectedValue) {
        return true;
      }

      return variant.optionMap?.[group.name] === selectedValue;
    });
  });
};

const matchesSelectedOptions = (variant, selectedOptions) =>
  Object.entries(selectedOptions).every(([key, value]) => {
    if (!value) {
      return true;
    }

    return variant.optionMap?.[key] === value;
  });

const pickPreferredVariant = ({ variants, selectedOptions }) => {
  if (variants.length === 0) {
    return null;
  }

  const matched = variants.filter((variant) =>
    matchesSelectedOptions(variant, selectedOptions),
  );

  if (matched.length === 0) {
    return null;
  }

  const inStock = matched.filter((variant) => {
    const stockQuantity = Number(variant?.stockQuantity);
    return Number.isFinite(stockQuantity) && stockQuantity > 0;
  });

  const preferredPool = inStock.length > 0 ? inStock : matched;
  return preferredPool.find((variant) => variant.isDefault) || preferredPool[0];
};

const extractReviews = (detail) => {
  const candidates = [
    detail?.reviews,
    detail?.reviewList,
    detail?.ratings,
    detail?.feedbacks,
    detail?.comments,
  ];

  const source = candidates.find((value) => Array.isArray(value)) || [];

  return source
    .map((item, index) => {
      const rating = getSafeNumber(
        item?.rating ?? item?.stars ?? item?.score ?? item?.point,
      );
      const content =
        item?.content ||
        item?.comment ||
        item?.reviewText ||
        item?.message ||
        "";
      const author =
        item?.userName ||
        item?.customerName ||
        item?.author ||
        item?.fullName ||
        "Khách hàng";
      const createdAt = item?.createdAt || item?.createdDate || item?.date;

      return {
        id: item?.id || `${author}-${index}`,
        author: String(author),
        content: String(content || "").trim(),
        rating: rating !== null ? Math.max(0, Math.min(5, rating)) : 0,
        createdAt: createdAt ? String(createdAt) : "",
      };
    })
    .filter((review) => review.content || review.rating > 0);
};

const renderStars = (rating, keyPrefix, sizeClass = "h-4 w-4") =>
  new Array(5)
    .fill(null)
    .map((_, index) => (
      <StarIcon
        key={`${keyPrefix}-${index}`}
        className={`${sizeClass} ${
          index < Math.round(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));

const renderVariantSelectorSection = ({
  attributeGroups,
  selectedVariantOptions,
  normalizedVariants,
  matchedVariant,
  quantity,
  currentStock,
  onSelectOption,
  onDecreaseQuantity,
  onIncreaseQuantity,
}) => {
  if (attributeGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {attributeGroups.map((group) => (
        <div
          key={group.name}
          className="grid grid-cols-1 sm:grid-cols-[90px_minmax(0,1fr)] gap-3"
        >
          <p className="text-base text-gray-500 dark:text-gray-400">
            {group.name}
          </p>
          <div
            className={`flex flex-wrap gap-2 ${
              group.options.length > 12 ? "max-h-48 overflow-y-auto pr-1" : ""
            }`}
          >
            {group.options.map((option) => {
              const isSelected =
                selectedVariantOptions[group.name] === option.value;
              const isSelectable = isVariantOptionSelectable({
                variants: normalizedVariants,
                groups: attributeGroups,
                selectedOptions: selectedVariantOptions,
                attributeName: group.name,
                optionValue: option.value,
              });

              const optionClassName = getVariantOptionButtonClass(
                isSelected,
                isSelectable,
              );

              return (
                <button
                  key={`${group.name}-${option.value}`}
                  type="button"
                  onClick={() => onSelectOption(group.name, option.value)}
                  disabled={!isSelectable}
                  className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm transition ${optionClassName}`}
                >
                  {option.imageUrl && (
                    <img
                      src={option.imageUrl}
                      alt={option.value}
                      className="h-7 w-7 object-cover rounded"
                      loading="lazy"
                    />
                  )}
                  <span>{option.value}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
      >
        Bảng quy đổi kích cỡ
        <ChevronRightIcon className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-[90px_minmax(0,1fr)] gap-3 items-center">
        <p className="text-base text-gray-500 dark:text-gray-400">Số lượng</p>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={onDecreaseQuantity}
              className="h-9 w-9 inline-flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
            <div className="h-9 min-w-12 px-2 inline-flex items-center justify-center border-x border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              {quantity}
            </div>
            <button
              type="button"
              onClick={onIncreaseQuantity}
              className="h-9 w-9 inline-flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentStock} sản phẩm có sẵn
          </span>
        </div>
      </div>

      {matchedVariant ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Đã chọn:{" "}
          {attributeGroups
            .map((group) => selectedVariantOptions[group.name] || group.name)
            .join(" / ")}
        </p>
      ) : (
        <p className="text-sm text-amber-600">
          Vui lòng chọn đủ biến thể để xác định đúng giá và tồn kho.
        </p>
      )}
    </div>
  );
};

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const location = useLocation();

  const [productDetail, setProductDetail] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [selectedVariantOptions, setSelectedVariantOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const backToProductsUrl = location.search
    ? `/products${location.search}`
    : "/products";

  useEffect(() => {
    let isMounted = true;

    const fetchProductDetail = async () => {
      setLoading(true);
      try {
        const detail = await productService.getProductById(productId);

        if (!isMounted) {
          return;
        }

        setProductDetail(detail || null);

        const images = collectProductImages(detail);
        const mainImage =
          images.find((image) => image?.isMain || image?.main) || images[0];

        setSelectedImageUrl(mainImage?.imageUrl || "");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProductDetail(null);
        toast.error(getErrorMessage(error, "Không thể tải chi tiết sản phẩm."));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProductDetail();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const images = useMemo(
    () => collectProductImages(productDetail),
    [productDetail],
  );

  const variants = useMemo(
    () =>
      Array.isArray(productDetail?.variants) ? productDetail.variants : [],
    [productDetail],
  );

  const normalizedVariants = useMemo(
    () =>
      variants.map((variant) => ({
        ...variant,
        optionMap: parseVariantAttributes(variant?.attributes),
        previewImageUrl: getVariantPreviewImage(variant),
      })),
    [variants],
  );

  const attributeNames = useMemo(() => {
    const collected = [];
    const seen = new Set();

    normalizedVariants.forEach((variant) => {
      Object.keys(variant.optionMap || {}).forEach((key) => {
        if (!key || seen.has(key)) {
          return;
        }

        seen.add(key);
        collected.push(key);
      });
    });

    return collected;
  }, [normalizedVariants]);

  const attributeGroups = useMemo(() => {
    const groups = new Map();

    attributeNames.forEach((name) => {
      groups.set(name, new Map());
    });

    normalizedVariants.forEach((variant) => {
      attributeNames.forEach((name) => {
        const value = variant.optionMap?.[name];
        if (!value) {
          return;
        }

        const optionsByName = groups.get(name);
        if (!optionsByName.has(value)) {
          optionsByName.set(value, {
            value,
            imageUrl: variant.previewImageUrl || "",
          });
          return;
        }

        const existing = optionsByName.get(value);
        if (!existing.imageUrl && variant.previewImageUrl) {
          optionsByName.set(value, {
            ...existing,
            imageUrl: variant.previewImageUrl,
          });
        }
      });
    });

    return attributeNames.map((name) => ({
      name,
      options: Array.from(groups.get(name)?.values() || []),
    }));
  }, [attributeNames, normalizedVariants]);

  const matchedVariant = useMemo(() => {
    if (normalizedVariants.length === 0) {
      return null;
    }

    if (attributeGroups.length === 0) {
      return (
        normalizedVariants.find((variant) => variant.isDefault) ||
        normalizedVariants[0]
      );
    }

    const hasSelectedAll = attributeGroups.every((group) =>
      Boolean(selectedVariantOptions[group.name]),
    );

    if (!hasSelectedAll) {
      return null;
    }

    return (
      normalizedVariants.find((variant) =>
        attributeGroups.every(
          (group) =>
            variant.optionMap?.[group.name] ===
            selectedVariantOptions[group.name],
        ),
      ) || null
    );
  }, [attributeGroups, normalizedVariants, selectedVariantOptions]);

  const { minPrice, maxPrice, compareAtPrice, totalStock } = useMemo(() => {
    const allVariants = Array.isArray(productDetail?.variants)
      ? productDetail.variants
      : [];

    const priceValues = allVariants
      .map((variant) => getSafeNumber(variant?.price))
      .filter((value) => value !== null);

    const compareValues = allVariants
      .map((variant) => getSafeNumber(variant?.compareAtPrice))
      .filter((value) => value !== null);

    const stockValues = allVariants
      .map((variant) => getSafeNumber(variant?.stockQuantity) || 0)
      .filter((value) => value >= 0);

    return {
      minPrice:
        priceValues.length > 0
          ? priceValues.reduce((min, value) => Math.min(min, value))
          : null,
      maxPrice:
        priceValues.length > 0
          ? priceValues.reduce((max, value) => Math.max(max, value))
          : null,
      compareAtPrice:
        compareValues.length > 0
          ? compareValues.reduce((max, value) => Math.max(max, value))
          : null,
      totalStock: stockValues.reduce((sum, value) => sum + value, 0),
    };
  }, [productDetail]);

  const displayImageUrl = selectedImageUrl || images[0]?.imageUrl || "";
  const categories = useMemo(
    () =>
      Array.isArray(productDetail?.categories) ? productDetail.categories : [],
    [productDetail],
  );

  const reviews = useMemo(() => extractReviews(productDetail), [productDetail]);

  const reviewCount = useMemo(() => {
    const fromDetail = getSafeNumber(
      productDetail?.totalReviews ?? productDetail?.reviewCount,
    );
    if (fromDetail !== null) {
      return fromDetail;
    }

    return reviews.length;
  }, [productDetail, reviews.length]);

  const averageRating = useMemo(() => {
    const fromDetail = getSafeNumber(
      productDetail?.averageRating ?? productDetail?.ratingAverage,
    );
    if (fromDetail !== null) {
      return Math.max(0, Math.min(5, fromDetail));
    }

    if (reviews.length === 0) {
      return 0;
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.max(0, Math.min(5, sum / reviews.length));
  }, [productDetail, reviews]);

  useEffect(() => {
    if (normalizedVariants.length === 0) {
      setSelectedVariantOptions({});
      setQuantity(1);
      return;
    }

    const defaultVariant =
      normalizedVariants.find((variant) => variant.isDefault) ||
      normalizedVariants[0];

    setSelectedVariantOptions(defaultVariant.optionMap || {});
    setQuantity(1);
  }, [normalizedVariants]);

  useEffect(() => {
    if (!matchedVariant?.previewImageUrl) {
      return;
    }

    setSelectedImageUrl(matchedVariant.previewImageUrl);
  }, [matchedVariant]);

  useEffect(() => {
    const maxAllowed = Math.max(1, Number(matchedVariant?.stockQuantity) || 1);
    setQuantity((prev) => Math.min(Math.max(prev, 1), maxAllowed));
  }, [matchedVariant]);

  useEffect(() => {
    let isMounted = true;
    const primaryCategoryId = categories[0]?.id;

    const fetchRelatedProducts = async () => {
      if (!primaryCategoryId) {
        setRelatedProducts([]);
        return;
      }

      setRelatedLoading(true);

      try {
        const data = await productService.getProducts({
          filter: { categoryId: [primaryCategoryId] },
          page: 0,
          size: 10,
          sortBy: "createdAt",
          sortDir: "desc",
        });

        if (!isMounted) {
          return;
        }

        const list = Array.isArray(data?.content) ? data.content : [];
        const filtered = list
          .filter((item) => String(item?.id) !== String(productId))
          .slice(0, 6);
        setRelatedProducts(filtered);
      } catch {
        if (isMounted) {
          setRelatedProducts([]);
        }
      } finally {
        if (isMounted) {
          setRelatedLoading(false);
        }
      }
    };

    fetchRelatedProducts();

    return () => {
      isMounted = false;
    };
  }, [categories, productId]);

  const handleSelectVariantOption = (attributeName, value) => {
    setSelectedVariantOptions((prev) => {
      const draftSelection = {
        ...prev,
        [attributeName]: value,
      };

      const preferredVariant = pickPreferredVariant({
        variants: normalizedVariants,
        selectedOptions: draftSelection,
      });

      if (!preferredVariant) {
        return draftSelection;
      }

      const nextSelection = { ...draftSelection };

      attributeGroups.forEach((group) => {
        if (group.name === attributeName) {
          return;
        }

        const selectedValue = nextSelection[group.name];
        if (!selectedValue) {
          return;
        }

        const isStillValid = normalizedVariants.some((variant) => {
          const stockQuantity = Number(variant?.stockQuantity);
          if (!Number.isFinite(stockQuantity) || stockQuantity <= 0) {
            return false;
          }

          return matchesSelectedOptions(variant, nextSelection);
        });

        if (!isStillValid) {
          nextSelection[group.name] =
            preferredVariant.optionMap?.[group.name] || "";
        }
      });

      return nextSelection;
    });
    setQuantity(1);
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => {
      const maxAllowed = Math.max(
        1,
        Number(matchedVariant?.stockQuantity) || 1,
      );
      return Math.min(maxAllowed, prev + 1);
    });
  };

  const handleAddToCart = async () => {
    if (addingToCart) {
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    const targetVariant =
      matchedVariant ||
      normalizedVariants.find((variant) => variant.isDefault) ||
      normalizedVariants[0] ||
      null;

    if (!targetVariant?.id) {
      toast.error("Không tìm thấy biến thể hợp lệ.");
      return;
    }

    const stockQuantity = Number(targetVariant?.stockQuantity) || 0;
    if (stockQuantity <= 0) {
      toast.error("Biến thể đã hết hàng.");
      return;
    }

    const finalQuantity = Math.max(1, Math.min(quantity, stockQuantity));

    const variantAttributes = parseVariantAttributes(targetVariant?.attributes);
    const variantAttributesText = Object.keys(variantAttributes).length
      ? JSON.stringify(variantAttributes)
      : null;

    const payload = {
      productId: productDetail?.id,
      productName: productDetail?.name,
      variantId: targetVariant.id,
      sku: targetVariant?.sku || "",
      variantAttributes: variantAttributesText,
      quantity: finalQuantity,
      price: getSafeNumber(targetVariant?.price) ?? minPrice,
      compareAtPrice:
        getSafeNumber(targetVariant?.compareAtPrice) ?? compareAtPrice,
      imageUrl: targetVariant.previewImageUrl || displayImageUrl,
    };

    try {
      setAddingToCart(true);
      await cartService.addToCart(userId, payload);
      toast.success("Đã thêm vào giỏ hàng.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể thêm vào giỏ hàng."));
    } finally {
      setAddingToCart(false);
    }
  };

  const currentPriceLabel = matchedVariant
    ? formatCurrency(matchedVariant.price)
    : buildPriceRangeLabel(minPrice, maxPrice);

  const currentCompareAtPrice = matchedVariant
    ? getSafeNumber(matchedVariant.compareAtPrice)
    : compareAtPrice;

  const currentStock = matchedVariant
    ? Number(matchedVariant.stockQuantity) || 0
    : totalStock;

  let mainContent;

  if (loading) {
    mainContent = (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center text-gray-600 dark:text-gray-300">
        Đang tải chi tiết sản phẩm...
      </div>
    );
  } else if (productDetail) {
    mainContent = (
      <div className="space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden aspect-square">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt={productDetail.name || "product-image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                  Chưa có ảnh sản phẩm
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image) => {
                  const imageUrl = image?.imageUrl || "";
                  const isActive = imageUrl && imageUrl === displayImageUrl;

                  return (
                    <button
                      key={image.id || imageUrl}
                      type="button"
                      onClick={() => setSelectedImageUrl(imageUrl)}
                      className={`aspect-square rounded-xl overflow-hidden border ${
                        isActive
                          ? "border-blue-600"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={image.altText || productDetail.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 dark:bg-gray-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {productDetail.brand || "Không thương hiệu"}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {productDetail.name}
              </h1>
            </div>

            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <p className="text-xl font-bold text-red-600">
                {currentPriceLabel}
              </p>
              {currentCompareAtPrice !== null && (
                <p className="text-sm line-through text-gray-500 mt-1">
                  {formatCurrency(currentCompareAtPrice)}
                </p>
              )}
            </div>

            {renderVariantSelectorSection({
              attributeGroups,
              selectedVariantOptions,
              normalizedVariants,
              matchedVariant,
              quantity,
              currentStock,
              onSelectOption: handleSelectVariantOption,
              onDecreaseQuantity: handleDecreaseQuantity,
              onIncreaseQuantity: handleIncreaseQuantity,
            })}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart || currentStock <= 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-700/20 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>

            {categories.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danh mục
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/products?categoryId=${category.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-600"
                    >
                      <TagIcon className="h-3.5 w-3.5" />
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mô tả sản phẩm
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {productDetail.description || "Chưa có mô tả cho sản phẩm này."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Đánh giá sản phẩm
            </h2>
            <div className="inline-flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {renderStars(averageRating, "rating-summary")}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {averageRating.toFixed(1)} / 5 ({reviewCount} đánh giá)
              </span>
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {review.author}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {renderStars(
                        review.rating,
                        `review-${review.id}`,
                        "h-3.5 w-3.5",
                      )}
                    </div>
                  </div>
                  {review.createdAt && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {review.createdAt}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {review.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chua co đánh giá cho san pham nay.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sản phẩm cùng danh mục
            </h2>
            {categories[0]?.id && (
              <Link
                to={`/products?categoryId=${categories[0].id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Xem thêm
              </Link>
            )}
          </div>

          {relatedLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang tải sản phẩm liên quan...
            </p>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {relatedProducts.map((item) => {
                const itemImage = getProductImage(item);
                const itemPrice = getProductDisplayPrice(item);

                return (
                  <Link
                    key={item.id}
                    to={`/products/${item.id}`}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={item.name || "related-product"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2 min-h-8">
                        {item.name || "Sản phẩm"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        {itemPrice !== null
                          ? formatCurrency(itemPrice)
                          : "Liên hệ"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chưa tìm thấy sản phẩm cùng danh mục.
            </p>
          )}
        </section>
      </div>
    );
  } else {
    mainContent = (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Không tìm thấy sản phẩm
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Sản phẩm có thể đã bị xóa hoặc không còn khả dụng.
        </p>
        <Link
          to={backToProductsUrl}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Về danh sách sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2"
            aria-label="Về trang chủ"
          >
            <ShoppingBagIcon className="h-7 w-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              BEcom
            </span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(backToProductsUrl)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Quay lại sản phẩm
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {mainContent}
      </main>

      <footer className="mt-auto bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <ShoppingBagIcon className="h-6 w-6" />
                BEcom
              </h3>
              <p className="text-sm">
                Nền tảng mua sắm trực tuyến hàng đầu với hàng triệu sản phẩm
                chất lượng cao.
              </p>
            </div>

            {FOOTER_SECTIONS.map((section) => (
              <div key={section.id}>
                <h4 className="text-white font-bold mb-4">{section.title}</h4>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={`${section.id}-${link.label}`}>
                      <a
                        href={link.href}
                        className="hover:text-white transition"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 BEcom. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
