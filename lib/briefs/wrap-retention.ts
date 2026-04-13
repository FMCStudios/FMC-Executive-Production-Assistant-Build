import type { BriefType } from './index';

export const wrapRetention: BriefType = {
  id: 'wrap-retention',
  name: 'Wrap & Retention',
  emoji: '\uD83E\uDD1D',
  description: 'Build a follow-up plan from delivery confirmation',
  placeholder: 'Paste post-delivery notes, client responses, or your wrap-up summary. Include client feedback, any rebooking signals, referral opportunities, and lessons learned.',
  systemPrompt: `You are parsing project delivery confirmation and client feedback into a wrap and retention brief. The input is post-delivery notes, client responses, or a producer's wrap-up summary.

Extract and structure:
- PROJECT: Name, client, delivery date, deliverables sent
- CLIENT FEEDBACK: What did they say? Satisfaction level? Direct quotes if available.
- FOLLOW-UP CADENCE: When to check in next. 1 week, 1 month, quarterly?
- REBOOKING OPPORTUNITY: Is there a natural next project? Seasonal content? Upcoming events? Did they mention future needs?
- REFERRAL ASK: Who else in their network might need production services? Has a referral already happened organically?
- TESTIMONIAL REQUEST: Is this a good candidate for a testimonial or case study?
- LESSONS LEARNED: What went well? What would we do differently?
- PORTFOLIO POTENTIAL: Is this work portfolio-ready? What makes it stand out?
- RELATIONSHIP STATUS: Where does this client sit \u2014 one-off, warm, or retainer-track?
- NEXT STEPS: Specific follow-up actions with dates and ownership.

Tone should reflect that the hard work is done \u2014 this is about protecting the relationship and planting seeds.

The brand context below shapes the tone and service framing of your output.`,
};
