export function apiError(res, status = 400, message = "Bad request") {
    return res.status(status).json({ error: message });
  }
  