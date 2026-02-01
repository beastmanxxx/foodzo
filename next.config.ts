const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    turbo: {
      rules: {
        "*.jfif": [
          {
            type: "asset",
          },
        ],
      },
    },
  },
  webpack: (config: any) => {
    config.module.rules.push({
      test: /\.jfif$/i,
      type: "asset/resource",
    });
    return config;
  },
} satisfies Record<string, unknown>;

export default nextConfig;
