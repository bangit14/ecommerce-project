import PropTypes from "prop-types";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentRole, hasPermission } from "../utils/authSession";

export default function ProtectedRoute({
  requiredRole,
  requiredPermission,
  redirectTo = "/login",
}) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (requiredRole) {
    const role = getCurrentRole();
    if (!role || role !== requiredRole.toUpperCase()) {
      return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

ProtectedRoute.propTypes = {
  requiredRole: PropTypes.string,
  requiredPermission: PropTypes.string,
  redirectTo: PropTypes.string,
};
