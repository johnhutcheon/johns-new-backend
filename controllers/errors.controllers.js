exports.handleInvalidPath = (req, res) => {
  res.status(404).send({ message: "404 - Path not found" });
};

exports.handlePsqlErrors = (err, req, res, next) => {
  if (err.code === "22P02" || err.code === "23502") {
    res.status(400).send({ message: "400 - Bad request" });
  } else if (err.code === "23503") {
    res.status(404).send({ message: "404 - Not Found" });
  } else {
    next(err);
  }
};

exports.handleCustomErrors = (err, req, res, next) => {
  if (err.status && err.message) {
    res.status(err.status).send({ message: `${err.message}` });
  } else if (err.status === 404) {
    res.status(404).send({ message: "Page not found" });
  } else {
    next(err);
  }
};

exports.handleServerErrors = (err, req, res, next) => {
  res.status(500).send({ message: "500 - Internal server error" });
};
