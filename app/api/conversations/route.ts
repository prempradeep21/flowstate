import { conversationStore } from "@/lib/conversationStore";

export async function POST(req: Request) {
  const { conversationId, parentConversationId } = await req.json();
  if (!conversationId) {
    return Response.json({ error: "conversationId required" }, { status: 400 });
  }
  conversationStore.register(conversationId, parentConversationId ?? null);
  return Response.json({ registered: true });
}
