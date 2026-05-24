import { createHarness, aphNext } from "@aph/harness/server";
import { defaultProviders } from "@aph/harness";
import { cookies } from "next/headers";
import { storage } from "../../../../lib/storage";

const harness = createHarness({
  storage,
  providers: defaultProviders,
  identify: async (_req) => {
    const c = await cookies();
    let id = c.get("aph_demo_user")?.value;
    if (!id) {
      id = `u_${Math.random().toString(36).slice(2, 10)}`;
    }
    return id;
  },
});

const handler = aphNext(harness);
export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
