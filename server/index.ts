import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createProperty, publishProperty } from "./routes/cms";
import {
  unpublishProperty,
  deleteProperty,
  updateProperty,
} from "./routes/cms.extra";
import { handleSitemapXml, handleRobotsTxt } from "./routes/sitemap.xml";
import {
  ensureIndex,
  getIndexStats,
  isMeiliConfigured,
  probeQueries,
} from "./search/meili";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Locations search
  app.get(
    "/api/locations",
    require("./routes/locations").handleLocationsSearch,
  );

  // CMS routes
  app.get(
    "/api/cms/property",
    require("./routes/cms.extra").listSeededProperties,
  );
  app.post("/api/cms/property", createProperty);
  app.post("/api/cms/property/publish", publishProperty);
  app.post("/api/cms/property/unpublish", unpublishProperty);
  app.put("/api/cms/property/:slug", updateProperty);
  app.delete("/api/cms/property", deleteProperty);

  // SEO routes
  app.get("/sitemap.xml", handleSitemapXml);
  app.get("/robots.txt", handleRobotsTxt);

  // Meili stats on startup (non-blocking)
  (async () => {
    try {
      if (isMeiliConfigured()) {
        await ensureIndex();
        const s = await getIndexStats();
        console.log(
          `【Meili】total: states=${s.states} municipalities=${(s as any).municipalities ?? 0} cities=${s.cities} neighborhoods=${s.neighborhoods}`,
        );
        console.log(
          `【Meili】settings: searchable=${JSON.stringify(s.settings.searchable)} filterable=${JSON.stringify(s.settings.filterable)} sortable=${JSON.stringify(s.settings.sortable)}`,
        );
        await probeQueries([
          "san luis",
          "san luis potosi",
          "culiacan",
          "sonora",
          "mexicali",
          "queretaro",
        ]);
      } else {
        console.log("【Meili】No configurado (usar fallback local)");
      }
    } catch (e) {
      console.warn("【Meili】Error obteniendo stats:", e);
    }
  })();

  return app;
}
