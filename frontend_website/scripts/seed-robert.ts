import path from "node:path";
import fs from "node:fs/promises";
import { createUser, findUserByUsername } from "../lib/auth/users";
import { getIndex, indexUploadedPdf } from "../lib/rag/indexer";

const SEED_ROOT = path.resolve(__dirname, "../../rag_knowledge_base/car_dealership_knowledge_base");
const USERNAME = "robert";
const PASSWORD = "robert-demo-pw";

async function main() {
  let user = await findUserByUsername(USERNAME);
  if (!user) {
    console.log(`creating user "${USERNAME}" with password "${PASSWORD}"`);
    user = await createUser(USERNAME, PASSWORD);
  } else {
    console.log(`user "${USERNAME}" exists, adding any missing documents`);
  }

  const existing = new Set(
    Object.values(await getIndex(user.id)).map((d) => d.relativePath)
  );

  const entries = await fs.readdir(SEED_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folder = entry.name;
    const folderPath = path.join(SEED_ROOT, folder);
    const files = await fs.readdir(folderPath);
    for (const f of files) {
      if (!f.toLowerCase().endsWith(".pdf")) continue;
      const rel = path.posix.join(folder, f);
      if (existing.has(rel)) {
        console.log(`  skip ${rel} (already indexed)`);
        continue;
      }
      const full = path.join(folderPath, f);
      const buf = await fs.readFile(full);
      try {
        const doc = await indexUploadedPdf({
          userId: user.id,
          folder,
          docName: f,
          buffer: buf,
        });
        console.log(`  indexed ${folder}/${f} → ${doc.docId} (${doc.pages} pages)`);
      } catch (err: any) {
        console.warn(`  skipped ${folder}/${f}: ${err.message}`);
      }
    }
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
