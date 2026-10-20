// Usage in a route file:
//   router.post("/signup", validate(signupSchema), signup);
//   router.get("/x", validate(querySchema, "query"), handler);
//
// source: "body" (default) | "query" | "params"
export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    // parse() throws a ZodError on failure; Express 5 forwards it to
    // errorHandler, and for Express 4 the try/catch below does the same.
    try {
      const cleaned = schema.parse(req[source] ?? {});

      // In Express 5, req.query is read-only, so we redefine it instead of assigning
      if (source === "query") {
        Object.defineProperty(req, "query", {
          value: cleaned,
          writable: true,
          configurable: true,
        });
      } else {
        req[source] = cleaned;
      }

      next();
    } catch (err) {
      next(err);
    }
  };

export default validate;
