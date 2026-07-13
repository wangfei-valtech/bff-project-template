export const dynamic = "force-dynamic";

/** 返回请求示例所需的语言、主题与请求时间。 */
export function GET(request: Request) {
  return Response.json({
    headers: {
      "accept-language": request.headers.get("accept-language")?.split(",")[0]?.trim() || "zh-CN",
      theme: request.headers.get("theme") || "system",
    },
    requestedAt: new Date().toISOString(),
  });
}
