const fetch = require("node-fetch");
const crypto = require("crypto");

const { AbortController } = globalThis;

/**
 * Get SHA256 Hash from data
 * @param {buffer} dataToHash
 * @returns {buffer}
 */
function sha256(dataToHash) {
  const hash = crypto.createHash("sha256");
  hash.update(dataToHash);
  return hash.digest();
}

/**
 * Extract Hash URL from requestMessage
 * URL must be in NDID compatible format
 * @param {string} requestMessage
 * @returns {Array<string>} list of url message
 */
function extractURLFromRequestMessage(requestMessage) {
  if (typeof requestMessage !== "string") {
    return [];
  }
  // 1. Strip text
  // 2. extract with newline
  const token = requestMessage.trim().split(/\n+/);
  // 3. get last message start with http* scheme
  return token.filter((line) => line.match(/^http(s?):\/\//)).map((line) => line.trim());
}

/**
 * Validate Contract Hash from requestMessage
 * return true if url inside request message has valid signature
 * @param {string} requestMessage NDID request message
 * @returns {boolean} validation result <true/false>
 */
async function checkContractHash(requestMessage, opt = {}) {
  const { logger } = opt;
  const timeoutTime = opt.timeout || 15000;
  /**
   * Validate individual url and hash data
   * @param {} url
   * @returns
   */
  async function validateUrl(url) {
    const uri = new URL(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutTime);

    try {
      const response = await fetch(uri, { signal: controller.signal });

      if (response?.status !== 200) {
        throw new Error(`request to ${uri.href} failed: ${response?.statusText}`);
      }
      const urlSplit = url.split("/");
      const urlHash = urlSplit[urlSplit.length - 1];
      const content = await response.buffer();

      const contentHash = sha256(content).toString("hex");

      return contentHash === urlHash;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`request to ${url} failed: Timeout after ${timeoutTime}ms`);
      } else {
        throw err;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    // 1. Extract requestMessage to list of URL
    const urls = extractURLFromRequestMessage(requestMessage);

    // Fail if no url to be validated
    if (urls.length < 1) {
      return false;
    }

    // 2. Do url validation concurrently
    const validators = urls.map((url) => validateUrl(url));
    const results = await Promise.all(validators);

    // 3. pass if all data is pass
    return results.every((result) => result === true);
  } catch (err) {
    logger?.error(err.message);
    return false;
  }
}

module.exports = { extractURLFromRequestMessage, checkContractHash };
