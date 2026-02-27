import { NextResponse } from "next/server";
import { listMbFlags } from "../../../../lib/store.js";

export async function GET() {
  return NextResponse.json({
    count: listMbFlags().length,
    flags: listMbFlags()
  });
}
