import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, email, ideaTitle, description, stage, link, openToSplit } =
    body as Record<string, string>;

  if (!name || !email || !ideaTitle || !description) {
    return NextResponse.json(
      { error: "Please fill in every required field." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set.");
    return NextResponse.json(
      { error: "Idea submissions are temporarily unavailable. Please try again shortly." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const toEmail = process.env.RESEND_TO_EMAIL || "sinjurfilip@gmail.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Arxiono <onboarding@resend.dev>";

  const escape = (value: string) =>
    value.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
    );

  const stageLabel =
    { concept: "Just a concept", prototype: "Has a prototype / designs", existing: "Has an existing app" }[
      stage
    ] || "Not specified";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a2819;">
      <h2 style="color:#0f4a30;">New idea pitch — ${escape(ideaTitle)}</h2>
      <p><strong>From:</strong> ${escape(name)} (${escape(email)})</p>
      <p><strong>Stage:</strong> ${escape(stageLabel)}</p>
      <p><strong>Open to ownership split:</strong> ${openToSplit ? "Yes" : "No"}</p>
      ${link ? `<p><strong>Link:</strong> <a href="${escape(link)}">${escape(link)}</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #ccc;margin:20px 0;" />
      <p style="white-space:pre-wrap; line-height:1.6;">${escape(description)}</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `New idea pitch: ${ideaTitle}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Couldn't send your idea right now. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error sending idea email:", err);
    return NextResponse.json(
      { error: "Couldn't send your idea right now. Please try again." },
      { status: 500 },
    );
  }
}
