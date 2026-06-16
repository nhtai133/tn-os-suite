import { TNOSSnapshotSchema, type TNOSSnapshot, type OSType } from "@tn-os/schemas";
import { ZodError } from "zod";

export type ValidationResult =
  | { success: true; snapshot: TNOSSnapshot }
  | { success: false; errors: string[] };

export function validateSnapshot(raw: unknown): ValidationResult {
  const result = TNOSSnapshotSchema.safeParse(raw);
  if (result.success) {
    return { success: true, snapshot: result.data };
  }
  const errors = (result.error as ZodError).errors.map(
    (e) => `${e.path.join(".")}: ${e.message}`
  );
  return { success: false, errors };
}

export function isStale(snapshot: TNOSSnapshot, thresholdDays = 7): boolean {
  const generated = new Date(snapshot.generated_at);
  const now = new Date();
  const diffMs = now.getTime() - generated.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

export function assertOSType(snapshot: TNOSSnapshot, expected: OSType): void {
  if (snapshot.os_type !== expected) {
    throw new Error(`Expected os_type "${expected}", got "${snapshot.os_type}"`);
  }
}
