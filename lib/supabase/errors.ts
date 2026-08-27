export const SUPABASE_CONNECTION_ERROR_MESSAGE =
  "We could not reach the private access service. Please check your connection and try again.";

export function getSupabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    console.error(error.message);
  }

  return SUPABASE_CONNECTION_ERROR_MESSAGE;
}
