import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ConsultChat } from "@/components/consult/ConsultChat";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { modes } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI 상담", robots: { index: false } };

export default async function ConsultSessionPage({ params }: { params: { sessionId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(`/consult/${params.sessionId}`));

  const repo = getRepository();
  const session = await repo.getConsultSession(params.sessionId);
  if (!session || session.userId !== user.id) notFound();
  const messages = await repo.listConsultMessages(session.id);

  return (
    <ConsultChat
      sessionId={session.id}
      subjectName={session.subject.name}
      turnLimit={session.turnLimit}
      turnsUsed={session.turnsUsed}
      templateMode={modes.ai() === "template"}
      initialMessages={messages.map((message) => ({
        id: message.id,
        role: message.role,
        parts: [{ type: "text" as const, text: message.content }],
      }))}
    />
  );
}
