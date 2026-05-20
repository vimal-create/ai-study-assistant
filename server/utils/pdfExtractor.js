import pdf from "pdf-parse";

export async function extractText(file) {
  if (file.mimetype === "application/pdf") {
    const parsed = await pdf(file.buffer);
    return parsed.text;
  }

  return file.buffer.toString("utf8");
}
