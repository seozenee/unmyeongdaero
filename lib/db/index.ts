import "server-only";

import { modes } from "@/lib/env";
import { createLocalRepository } from "./local";
import { createSupabaseRepository } from "./supabase";
import type { Repository } from "./types";

export * from "./types";

let repository: Repository | undefined;

export function getRepository(): Repository {
  repository ??= modes.data() === "supabase" ? createSupabaseRepository() : createLocalRepository();
  return repository;
}
