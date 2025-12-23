module.exports = function normalizeHex(hex) {
  return hex.toLowerCase().padStart(16, '0');
}
