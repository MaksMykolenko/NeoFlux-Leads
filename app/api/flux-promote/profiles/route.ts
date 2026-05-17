import { NextResponse } from "next/server";
import { FLUX_PROMOTE_COMPANIES } from "@/src/lib/promotion/fluxPromoteProfiles";
import { checkFluxPromoteActionAccess } from "@/src/lib/promotion/serverAccess";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await checkFluxPromoteActionAccess();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  return NextResponse.json({ companies: FLUX_PROMOTE_COMPANIES });
}
