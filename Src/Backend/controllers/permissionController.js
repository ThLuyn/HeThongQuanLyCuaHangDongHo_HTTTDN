const Permission = require("../models/Permission");
const { success, fail } = require("../utils/response");

const MANAGED_ACTIONS = ["view", "create", "update", "delete"];
const ACTION_COLUMNS = [
  { key: "view", label: "Xem" },
  { key: "create", label: "Tạo mới" },
  { key: "update", label: "Cập nhật" },
  { key: "delete", label: "Xóa" },
];

function normalizeFeatureCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeAction(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePermissionRows(rawPermissions) {
  const rows = Array.isArray(rawPermissions) ? rawPermissions : [];
  const normalized = [];
  const dedupe = new Set();

  for (const item of rows) {
    const mcn = normalizeFeatureCode(item?.mcn);
    if (!mcn) {
      continue;
    }

    const actions = Array.isArray(item?.actions) ? item.actions : [];
    for (const actionValue of actions) {
      const hanhDong = normalizeAction(actionValue);
      if (!MANAGED_ACTIONS.includes(hanhDong)) {
        continue;
      }

      const key = `${mcn}::${hanhDong}`;
      if (dedupe.has(key)) {
        continue;
      }
      dedupe.add(key);
      normalized.push({ mcn, hanhDong });
    }
  }

  return normalized;
}

function validateRoleName(value) {
  const roleName = String(value || "").trim();
  if (!roleName) {
    return null;
  }
  return roleName;
}

async function getPermissionGroups(req, res, next) {
  try {
    const rows = await Permission.listPermissionGroups();
    return success(
      res,
      rows.map((row) => ({
        mnq: Number(row.MNQ),
        roleName: row.TEN,
        status: Number(row.TT) === 1 ? 1 : 0,
      })),
      "Permission groups loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function getPermissionMeta(req, res, next) {
  try {
    const [roles, features] = await Promise.all([
      Permission.listRoleGroups(),
      Permission.listFeatureCatalog(),
    ]);

    return success(
      res,
      {
        roles: roles.map((row) => ({
          mnq: Number(row.MNQ),
          name: row.TEN,
        })),
        features: features.map((row) => ({
          mcn: row.MCN,
          name: row.TEN,
        })),
        actions: ACTION_COLUMNS,
      },
      "Permission meta loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function getPermissionGroupDetail(req, res, next) {
  try {
    const mnq = Number(req.params.id);
    if (!Number.isInteger(mnq) || mnq <= 0) {
      return fail(res, "Invalid group id", 400);
    }

    const [groups, assignedRows] = await Promise.all([
      Permission.listPermissionGroups(),
      Permission.listGroupPermissions(mnq),
    ]);

    const group = groups.find((item) => Number(item.MNQ) === mnq);
    if (!group) {
      return fail(res, "Permission group not found", 404);
    }

    const matrixMap = new Map();
    for (const row of assignedRows) {
      const mcn = normalizeFeatureCode(row.MCN);
      const hanhDong = normalizeAction(row.HANHDONG);
      if (!MANAGED_ACTIONS.includes(hanhDong)) {
        continue;
      }
      if (!matrixMap.has(mcn)) {
        matrixMap.set(mcn, []);
      }
      matrixMap.get(mcn).push(hanhDong);
    }

    const permissions = Array.from(matrixMap.entries()).map(
      ([mcn, actions]) => ({
        mcn,
        actions,
      }),
    );

    return success(
      res,
      {
        mnq,
        roleName: group.TEN,
        permissions,
      },
      "Permission group detail loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function createPermissionGroup(req, res, next) {
  try {
    const roleName = validateRoleName(req.body?.roleName);
    if (!roleName) {
      return fail(res, "roleName is required", 400);
    }

    const normalizedRows = normalizePermissionRows(req.body?.permissions);
    const mnq = await Permission.createPermissionGroup({
      roleName,
      permissions: normalizedRows,
    });

    return success(res, { mnq }, "Permission group created", 201);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Permission already exists", 400);
    }
    return next(error);
  }
}

async function updatePermissionGroup(req, res, next) {
  try {
    const mnq = Number(req.params.id);
    if (!Number.isInteger(mnq) || mnq <= 0) {
      return fail(res, "Invalid group id", 400);
    }

    const roleName = validateRoleName(req.body?.roleName);
    if (!roleName) {
      return fail(res, "roleName is required", 400);
    }

    const groups = await Permission.listPermissionGroups();
    const existed = groups.some((row) => Number(row.MNQ) === mnq);
    if (!existed) {
      return fail(res, "Permission group not found", 404);
    }

    const normalizedRows = normalizePermissionRows(req.body?.permissions);
    await Permission.updatePermissionGroup(mnq, {
      roleName,
      permissions: normalizedRows,
      managedActions: MANAGED_ACTIONS,
    });

    return success(res, null, "Permission group updated");
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Permission already exists", 400);
    }
    return next(error);
  }
}

async function deletePermissionGroup(req, res, next) {
  try {
    const mnq = Number(req.params.id);
    if (!Number.isInteger(mnq) || mnq <= 0) {
      return fail(res, "Invalid group id", 400);
    }

    await Permission.deletePermissionGroup(mnq);
    return success(res, null, "Permission group deactivated");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPermissionGroups,
  getPermissionMeta,
  getPermissionGroupDetail,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
};
