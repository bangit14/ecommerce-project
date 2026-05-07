const toValidUserId = (value) => {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return null;
};

const decodeJwtPayload = (token) => {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) {
      return null;
    }

    const normalized = base64Payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = globalThis.atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const pickUserIdFromPayload = (payload) => {
  if (!payload) {
    return null;
  }

  return (
    toValidUserId(payload.userId) ||
    toValidUserId(payload.id) ||
    toValidUserId(payload.uid) ||
    toValidUserId(payload.sub)
  );
};

export const extractUserIdFromLoginResponse = (data) => {
  return (
    toValidUserId(data?.userId) ||
    toValidUserId(data?.data?.userId) ||
    toValidUserId(data?.user?.id) ||
    toValidUserId(data?.data?.user?.id)
  );
};

export const syncUserIdFromToken = (token) => {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  const userId = pickUserIdFromPayload(payload);

  if (userId) {
    localStorage.setItem("userId", String(userId));
  }

  return userId;
};

const pickRoleFromPayload = (payload) => {
  if (!payload) return null;

  // role string trực tiếp
  if (typeof payload.role === "string") {
    return payload.role.replace(/^ROLE_/i, "").toUpperCase();
  }

  // roles array
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    const first = payload.roles[0];
    const raw = typeof first === "string" ? first : (first?.authority ?? "");
    return raw.replace(/^ROLE_/i, "").toUpperCase() || null;
  }

  // authorities array (Spring Security)
  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    const first = payload.authorities[0];
    const raw = typeof first === "string" ? first : (first?.authority ?? "");
    return raw.replace(/^ROLE_/i, "").toUpperCase() || null;
  }

  return null;
};

const toNormalizedPermission = (value) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (
    value &&
    typeof value === "object" &&
    typeof value.authority === "string"
  ) {
    return value.authority.trim();
  }

  return "";
};

const pickPermissionsFromPayload = (payload) => {
  if (!payload) {
    return [];
  }

  const rawCandidates = [
    ...(Array.isArray(payload.permissions) ? payload.permissions : []),
    ...(Array.isArray(payload.scopes) ? payload.scopes : []),
  ];

  if (Array.isArray(payload.authorities)) {
    for (const authority of payload.authorities) {
      const normalized = toNormalizedPermission(authority);
      if (normalized && !normalized.startsWith("ROLE_")) {
        rawCandidates.push(normalized);
      }
    }
  }

  return [
    ...new Set(rawCandidates.map(toNormalizedPermission).filter(Boolean)),
  ];
};

export const syncRoleFromToken = (token) => {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const role = pickRoleFromPayload(payload);
  if (role) {
    localStorage.setItem("role", role);
  }
  return role;
};

export const syncPermissionsFromToken = (token) => {
  if (!token) {
    return [];
  }

  const payload = decodeJwtPayload(token);
  const permissions = pickPermissionsFromPayload(payload);

  localStorage.setItem("permissions", JSON.stringify(permissions));
  return permissions;
};

export const getCurrentRole = () => {
  const fromStorage = localStorage.getItem("role");
  if (fromStorage) return fromStorage;

  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return pickRoleFromPayload(payload);
};

export const getCurrentPermissions = () => {
  const fromStorage = localStorage.getItem("permissions");
  if (fromStorage) {
    try {
      const parsed = JSON.parse(fromStorage);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string" && item.trim());
      }
    } catch {
      // Fallback decode from token below.
    }
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return [];
  }

  const payload = decodeJwtPayload(token);
  return pickPermissionsFromPayload(payload);
};

export const hasPermission = (requiredPermission) => {
  if (!requiredPermission) {
    return true;
  }

  return getCurrentPermissions().includes(requiredPermission);
};

export const getCurrentUserId = () => {
  const fromStorage = toValidUserId(localStorage.getItem("userId"));
  if (fromStorage) {
    return fromStorage;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  return pickUserIdFromPayload(payload);
};
