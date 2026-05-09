import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://minimax-studio.vercel.app";

  const routes = [
    "",
    "/scripts",
    "/thumbnails",
    "/music",
    "/video",
    "/pipeline",
    "/assets",
    "/exports",
    "/settings",
    "/templates",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}