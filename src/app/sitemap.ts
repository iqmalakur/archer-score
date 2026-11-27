import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site-origin";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: new URL("/", SITE_ORIGIN).href },
    { url: new URL("/landing", SITE_ORIGIN).href },
  ];
}
