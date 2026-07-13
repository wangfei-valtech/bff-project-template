import { execSync } from "node:child_process";
import type { NextConfig } from "next";

const cdnOrigin = process.env.NEXT_PUBLIC_CDN_ORIGIN?.replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";
const gitCommitSha = resolveGitCommitSha();

function resolveGitCommitSha() {
  const envSha =
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? process.env.COMMIT_SHA;

  if (envSha) {
    return envSha;
  }

  try {
    return execSync("git rev-parse HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  // 允许本地 dev 环境直接访问（hmr 所必须开启）
  allowedDevOrigins: ["127.0.0.1", "0.0.0.0", "localhost"],
  // 构建产物标识，用于 RootLayout 生成版本检测所需的 etag meta。
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: gitCommitSha,
  },
  // 生产环境 CDN 配置
  assetPrefix: isProduction && cdnOrigin ? cdnOrigin : undefined,
  // 本地开发接口代理
  async rewrites() {
    if (!isProduction) {
      return [
        {
          destination: "http://127.0.0.1:9999/api/:path*",
          source: "/api/:path*",
        },
      ];
    }
    return [];
  },
  // 拆包策略优化
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          framework: {
            chunks: "all",
            name: "framework",
            priority: 40,
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
          },
          vendor: {
            chunks: "all",
            name: "vendor",
            priority: 30,
            reuseExistingChunk: true,
            // 从全局 vendor 中排除 html-to-image，使其仅在截图交互时按需加载为异步 chunk。
            test: /^(?!.*[\\/]html-to-image[\\/]).*[\\/]node_modules[\\/]/,
          },
          shared: {
            chunks: "all",
            minChunks: 2,
            name: "shared",
            priority: 20,
            reuseExistingChunk: true,
            test: /[\\/]src[\\/](components|core|hooks|lib|utils)[\\/]/,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
