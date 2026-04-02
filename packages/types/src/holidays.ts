import type { Region } from "./employee.js";

export interface Holiday {
  readonly id: string;
  readonly date: string;
  readonly name: string;
  readonly nameJa?: string;
  readonly region: Region;
  readonly year: number;
  readonly isSubstitute: boolean;
}
