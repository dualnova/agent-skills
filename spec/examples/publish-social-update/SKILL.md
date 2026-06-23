---
name: publish-social-update
description: Prepare and publish a social update only after the user approves the exact final text.
version: 1.0
provider: Acme Social Team
url: https://example.com/
contact: social@example.com
languages: [en]
requires_auth: true
---

# Publish a Social Update

## When to invoke this skill
Use this skill when a user wants to publish a prepared update to a connected
social account and expects the assistant to guide the approval flow. Trigger
phrases:

- "Post this launch update to X."
- "Schedule this announcement for our company account."
- "Publish this exact reply after I approve it."

Do not use this skill for passive monitoring, analytics, follower exports,
draft-only review, direct messages, follows, likes, or bulk engagement.

## What this skill does
This skill helps the assistant collect the channel, account, message, media,
timing, and compliance notes needed to publish one social update. The assistant
must show a final preview and wait for explicit approval before submitting.

## Step-by-step flow for the assistant
1. Confirm the target channel, account, and whether the update is a post, reply,
   or scheduled post.
2. Collect the exact text, media URLs or uploaded assets, link URL, and desired
   timing.
3. Check for missing required details, ambiguous account names, or content that
   needs legal or brand review.
4. Show a final preview with channel, account, text, media, timing, and whether
   the action will publish immediately.
5. Ask the user to approve the exact final preview. Do not treat earlier draft
   feedback as approval.
6. Submit through the configured server-side publishing flow only after the user
   approves.
7. Report the result with the external post URL, scheduled time, or clear error
   recovery steps.

If the implementation uses an approval-gated external plugin such as TweetClaw,
keep credentials and connected-account identifiers server-side. The assistant
may name the tool used for the action, but must not expose API keys, session
material, private messages, or raw account credentials.

## Information the assistant should provide to the user
- The exact text that will be published.
- The target channel and account label.
- Whether the action posts now or schedules for later.
- Any media or link attachments.
- Any platform-specific limits that might change the result.

## Common follow-up questions

**Can I change the text after approval?**  
Yes, but any text change requires a new final preview and a new approval.

**Can this skill publish multiple posts at once?**  
No. Use one approval per post so each published item has a clear audit trail.

**Can this skill read analytics first?**  
No. Use a separate analytics or source-evidence skill before invoking this
publishing flow.

## Fallback
If the publishing tool is unavailable, give the user the final approved text and
media checklist so they can publish manually. Do not retry with a different
account or channel unless the user explicitly chooses that path.
