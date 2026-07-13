const cdnOrigin = process.env.NEXT_PUBLIC_CDN_ORIGIN?.replace(/\/$/, "");

export function assetUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (process.env.NODE_ENV === "production" && cdnOrigin) {
    return `${cdnOrigin}${normalizedPath}`;
  }

  return normalizedPath;
}
