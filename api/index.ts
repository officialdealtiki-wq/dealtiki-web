import app from "../server";

export default function handler(req: any, res: any) {
  const parsed = new URL(
    req.url || "/api/index",
    "http://localhost"
  );

  const apiPath =
    parsed.searchParams.get("__path") || "";

  parsed.searchParams.delete("__path");

  const remainingQuery =
    parsed.searchParams.toString();

  req.url =
    `/api/${apiPath}` +
    (remainingQuery
      ? `?${remainingQuery}`
      : "");

  return app(req, res);
}