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
// Meili removed

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

  // Locations (dev/local)
  app.get(
    "/api/locations",
    require("./routes/locations.local").handleLocationsLocal,
  );

  // Listings API
  app.use("/api/listings", require("./api/listings").listings);
  // Geocode proxy
  app.get("/api/geocode", require("./routes/geocode").handleGeocode);
  // Leads + Chat API
  app.use("/api", require("./api/leads_and_chat").comms);
  // Public stubs (visit/auth/agency)
  app.use("/api", require("./api/public").publicApi);
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

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

  // Meili cleanup: no startup probes

  return app;
}
