"use server"

import { revalidatePath } from "next/cache"

export async function revalidateVillas() {
  revalidatePath("/")
  revalidatePath("/villas")
  revalidatePath("/villas/[id]")
  revalidatePath("/book")
  revalidatePath("/dashboard/proprio")
}
