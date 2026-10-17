import { listApplications } from "@/lib/db/applications";
import { demoToday } from "@/lib/db/demo-clock";
import { draftFollowUp } from "@/lib/ai/followup";
import { greetingName } from "@/lib/format";
import { decisionDays } from "@/lib/tracker/timeline";

export async function POST(request: Request) {
  const { applicationId } = (await request.json()) as { applicationId?: string };
  const app = (await listApplications()).find((a) => a.id === applicationId);
  if (!app) return Response.json({ error: "application not found" }, { status: 404 });
  const today = await demoToday();
  const daysWaiting = app.submittedAt ? Math.floor((today.getTime() - new Date(app.submittedAt).getTime()) / 86400000) : 0;
  try {
    const draft = await draftFollowUp({
      program: app.program,
      stage: app.stage,
      submittedAt: app.submittedAt?.slice(0, 10),
      daysWaiting,
      expectedDays: decisionDays(app.program),
      clientFirstName: greetingName(app.clientName),
    });
    return Response.json(draft);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "could not draft" }, { status: 502 });
  }
}
