const successWithData = (res, statusCode, data) => {
  return res.status(statusCode).json({success: true, data});
};

const success = (res, statusCode) => {
  return res.status(statusCode).json({success: true});
}

module.exports = {
  successWithData,
  success,
};