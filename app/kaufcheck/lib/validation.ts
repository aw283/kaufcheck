import type { KaufcheckInput, StepIndex } from "@/app/kaufcheck/types";
import {
  finanzenSchema,
  haushaltSchema,
  vorstellungSchema,
} from "@/app/kaufcheck/lib/schemas";

export function isStepValid(step: StepIndex, data: KaufcheckInput): boolean {
  switch (step) {
    case 0:
      return haushaltSchema.safeParse(data.haushalt).success;
    case 1:
      return finanzenSchema.safeParse(data.finanzen).success;
    case 2:
      return vorstellungSchema.safeParse(data.vorstellung).success;
    case 3:
      return true;
    default:
      return false;
  }
}
