import { streamContractAnswer, type ChatTurn } from "@/lib/ai";
import { toErrorResponse } from "@/lib/api";
import { requireUser } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/validations";
import { getContract, getMessages, saveChatTurn } from "@/server/contracts";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await requireUser();
    rateLimit(`chat:${user.id}`, { limit: 20, windowMs: 60_000 });

    const body = await request.json().catch(() => null);
    const { message } = chatRequestSchema.parse(body);

    // Ownership + text grounding.
    const contract = await getContract(id, user);

    // Recent history (bounded) for conversational context.
    const prior = await getMessages(id, user);
    const history: ChatTurn[] = prior
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    await saveChatTurn(id, user.id, "user", message);

    const result = streamContractAnswer({
      contractText: contract.rawText,
      history,
      question: message,
      // Persist the assistant's full answer once streaming completes.
      onFinish: async (full) => {
        if (full) await saveChatTurn(id, user.id, "assistant", full);
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return toErrorResponse(err);
  }
}
