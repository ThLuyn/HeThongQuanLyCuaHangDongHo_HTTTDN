function success(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function fail(res, message = "Bad request", statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

module.exports = {
  success,
  fail,
};
