// src/utils/errorHandler.js
/**
 * Xử lý error response từ backend (ApiErrorResponse format)
 * Backend trả về: { message, status, error, timestamp }
 *
 * @param {Error} err - Error object từ axios
 * @param {string} defaultMessage - Message mặc định nếu không có error từ backend
 * @returns {string} - Error message để hiển thị
 */
export const getErrorMessage = (
  err,
  defaultMessage = "Có lỗi xảy ra. Vui lòng thử lại.",
) => {
  // Log chi tiết để debug
  if (err.response?.data) {
    console.error("API Error Response:", {
      message: err.response.data.message,
      error: err.response.data.error,
      status: err.response.data.status,
      timestamp: err.response.data.timestamp,
    });
  } else if (err.message) {
    console.error("Error (Network/Timeout):", err.message);
  }

  // Ưu tiên message từ backend
  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  // Fallback: error code
  if (err.response?.data?.error) {
    return err.response.data.error;
  }

  // Fallback: error message (network error, timeout, ...)
  if (err.message) {
    return err.message;
  }

  // Fallback: default message
  return defaultMessage;
};
