import type { BriefTypeConfig } from '@/types/brief-schema';

export const wrapRetention: BriefTypeConfig = {
  id: 'wrap-retention',
  name: 'Wrap & Retention',
  emoji: '\uD83E\uDD1D',
  description: 'Build a follow-up plan from delivery confirmation',
  placeholder: 'Paste post-delivery notes, client responses, or your wrap-up summary. Include client feedback, any rebooking signals, referral opportunities, and lessons learned.',
  sctMode: 'dual',
  systemPrompt: `You are parsing project delivery confirmation and client feedback into a wrap and retention brief. The input is post-delivery notes, client responses, or a producer's wrap-up summary.

CONTEXT KEY-VALUES TO EXTRACT:
- Project name
- Client
- Delivery date
- Deliverables sent (list what was delivered)
- Client satisfaction (rating or signal — thrilled/satisfied/neutral/dissatisfied)
- Relationship status (one-off / warm / retainer-track)
- Follow-up cadence (when to check in next — 1 week, 1 month, quarterly)

SECTIONS TO GENERATE:
- "Client Feedback" — what did they say? Direct quotes if captured. Use "body" format.
- "Rebooking Opportunity" — is there a natural next project? Seasonal content? Upcoming events? Use "body" format.
- "Referral Potential" — who else in their network might need production services? Has a referral already happened? Use "body" format.
- "Testimonial Request" — is this a good candidate for a testimonial or case study? Use "body" format.
- "Lessons Learned" — what went well, what we'd do differently. Use "items" format.
- "Portfolio Potential" — is this work portfolio-ready? What makes it stand out? Use "body" format.

SCT PRIMARY (groupLabel: "Delivery Reflection"):
- Strategy: Did the strategic objective land? Did the content achieve what it was designed to achieve?
- Creative: Did the creative approach resonate? Client reactions, viewer response, standout moments.
- Tactic: Were the execution tactics effective? What worked operationally? What would we change?

SCT SECONDARY (groupLabel: "Rebooking Framing"):
- Situation: Where is the client NOW, post-delivery? What has changed for them?
- Challenge: What is their NEXT content gap or opportunity?
- Transformation: What does the next engagement unlock for them? Position as ongoing partner, not one-off vendor.

GAPS: Everything missing, ambiguous, or assumed. Assign severity.

NEXT STEPS: Specific follow-up actions with dates and ownership. Use first names.

Tone should reflect that the hard work is done — this is about protecting the relationship and planting seeds.`,
};
