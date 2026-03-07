export async function POST() {
  return new Response("Clerk webhook has been disabled.", { status: 410 })
}
