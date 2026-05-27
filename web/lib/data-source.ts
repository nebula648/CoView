import path from "path";
import fs from "fs";

const DATA_DIR = path.resolve(process.cwd(), "..", "data");

export function readContents() {
  const filePath = path.join(DATA_DIR, "contents.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function readEvents() {
  const filePath = path.join(DATA_DIR, "events.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function readProfiles() {
  const filePath = path.join(DATA_DIR, "profiles.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function writeContents(data: unknown) {
  const filePath = path.join(DATA_DIR, "contents.json");
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function writeEvents(data: unknown) {
  const filePath = path.join(DATA_DIR, "events.json");
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function writeProfiles(data: unknown) {
  const filePath = path.join(DATA_DIR, "profiles.json");
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
