import { validateSnapshot, type ValidationResult } from "./validate";

export async function importSnapshotFromFile(file: File): Promise<ValidationResult> {
  if (!file.name.endsWith(".tnos.json")) {
    return { success: false, errors: ["File must have .tnos.json extension"] };
  }

  let raw: unknown;
  try {
    const text = await file.text();
    raw = JSON.parse(text);
  } catch {
    return { success: false, errors: ["Invalid JSON — file could not be parsed"] };
  }

  return validateSnapshot(raw);
}

export function importSnapshotFromJSON(json: string): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { success: false, errors: ["Invalid JSON string"] };
  }
  return validateSnapshot(raw);
}
