import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const outDir = path.resolve(__dirname, "../tests/e2e/fixtures");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "tiny.pdf");

const doc = new PDFDocument({ size: "LETTER", margin: 50 });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);
doc.fontSize(14).text("RAG Test Fixture", { align: "left" });
doc.moveDown();
doc.fontSize(12).text(
  "Unapplied labor is the amount of time you are paying for but not collecting from a customer. " +
  "This happens when flat-rate technicians finish their work early. In a healthy service shop " +
  "you want hours billed to exceed hours paid, not the other way around.",
  { align: "left" }
);
doc.end();
stream.on("finish", () => console.log(`wrote ${outPath}`));
