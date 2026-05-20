const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/security");

const COOKIE_NAME = "genidoc_session";

function signSessionToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readCookie(req, name = COOKIE_NAME) {
  const header = req.headers.cookie || "";
  const cookies = header.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = process.env.MOBILE_APP_ENABLED === "true" ? "None" : "Lax";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    `SameSite=${sameSite}`,
    "Max-Age=604800",
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  );
}

module.exports = {
  COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  hashToken,
  readCookie,
  setSessionCookie,
  clearSessionCookie,
};
