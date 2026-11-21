const { Resend } = require("resend");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

const STAGE_LABELS = {
  concept: "Just a concept",
  prototype: "Has a prototype / designs",
  existing: "Has an existing app",
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = req.body || {};
  const { name, email, ideaTitle, description, stage, link, openToSplit } = body;

  if (!name || !email || !ideaTitle || !description) {
    res.status(400).json({ error: "Please fill in every required field." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set.");
    res.status(500).json({ error: "Idea submissions are temporarily unavailable. Please try again shortly." });
    return;
  }

  const resend = new Resend(apiKey);
  const toEmail = process.env.RESEND_TO_EMAIL || "sinjurfilip@gmail.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Arxiono <onboarding@resend.dev>";
  const stageLabel = STAGE_LABELS[stage] || "Not specified";

  const html =
    '<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a2819;">' +
    "<h2 style=\"color:#0f4a30;\">New idea pitch — " + escapeHtml(ideaTitle) + "</h2>" +
    "<p><strong>From:</strong> " + escapeHtml(name) + " (" + escapeHtml(email) + ")</p>" +
    "<p><strong>Stage:</strong> " + escapeHtml(stageLabel) + "</p>" +
    "<p><strong>Open to ownership split:</strong> " + (openToSplit ? "Yes" : "No") + "</p>" +
    (link ? "<p><strong>Link:</strong> <a href=\"" + escapeHtml(link) + "\">" + escapeHtml(link) + "</a></p>" : "") +
    '<hr style="border:none;border-top:1px solid #ccc;margin:20px 0;" />' +
    '<p style="white-space:pre-wrap; line-height:1.6;">' + escapeHtml(description) + "</p>" +
    "</div>";

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: "New idea pitch: " + ideaTitle,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      res.status(502).json({ error: "Couldn't send your idea right now. Please try again." });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Unexpected error sending idea email:", err);
    res.status(500).json({ error: "Couldn't send your idea right now. Please try again." });
  }
};
