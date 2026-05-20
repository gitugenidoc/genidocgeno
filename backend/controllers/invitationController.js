const AccountSecurity = require("../models/AccountSecurity");

exports.create = async (req, res) => {
  try {
    const { email, role_code, first_name, last_name, school_id } = req.body;
    if (!email || !role_code || !first_name || !last_name) {
      return res.status(400).json({ error: "Email, role, prenom et nom requis" });
    }

    const roles = req.currentUser.roles || [];
    const allowedPlatformRole = roles.includes("GENIDOC_ADMIN") || roles.includes("PLATFORM_OWNER");
    const allowedSchoolRole = roles.includes("SCHOOL_ADMIN") && req.currentUser.school_id;
    if (!allowedPlatformRole && !allowedSchoolRole) {
      return res.status(403).json({ error: "Invitation interdite" });
    }

    const targetSchoolId = allowedPlatformRole ? school_id || null : req.currentUser.school_id;
    const allowedRoles = allowedPlatformRole
      ? ["GENIDOC_ADMIN", "SCHOOL_ADMIN", "SCHOOL_NURSE", "PARENT", "PEDIATRICIAN"]
      : ["SCHOOL_NURSE", "PARENT", "PEDIATRICIAN"];
    if (!allowedRoles.includes(role_code)) {
      return res.status(403).json({ error: "Role non autorise" });
    }

    await AccountSecurity.createInvitation({
      schoolId: targetSchoolId,
      email,
      roleCode: role_code,
      firstName: first_name,
      lastName: last_name,
      createdBy: req.currentUser.id,
    });
    res.status(201).json({ message: "Invitation creee" });
  } catch (error) {
    console.error("Erreur invitation:", error);
    res.status(500).json({ error: "Erreur invitation" });
  }
};
