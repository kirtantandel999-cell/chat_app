export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[source] || {};
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] || "general";
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (!req.validated) {
      req.validated = {};
    }
    req.validated[source] = result.data;
    next();
  };
};

export default validate;
