/** The request body as JSON, or null when it isn't valid JSON. */
export async function readJson<T>(request: Request): Promise<Partial<T> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Partial<T>) : null;
  } catch {
    return null;
  }
}

export const signInFirst = () => Response.json({ error: "Sign in to use Recoup." }, { status: 401 });
export const badRequest = (error: string) => Response.json({ error }, { status: 400 });
