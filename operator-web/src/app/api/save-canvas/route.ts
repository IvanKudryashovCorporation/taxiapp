// Dev-only endpoint для сохранения PNG-скриншота карты на диск.
// Используется Claude через preview MCP eval для проверки WebGL canvas.
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const name = new URL(req.url).searchParams.get("name") || "canvas";
  const buf = Buffer.from(await req.arrayBuffer());
  const dir = path.resolve(process.cwd(), "..", ".preview");
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, `${name}.png`);
  await writeFile(filepath, buf);
  return NextResponse.json({ ok: true, path: filepath, size: buf.length });
}
