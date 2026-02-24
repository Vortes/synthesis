import "server-only";
import { createCaller } from "@curate/api";
import { db } from "@curate/db";
import { auth } from "@clerk/nextjs/server";

export async function serverTrpc() {
  const { userId } = await auth();
  return createCaller({ db, userId });
}
