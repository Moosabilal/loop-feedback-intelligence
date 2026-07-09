import { PrismaClient, Sentiment, FeedbackStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing demo data (useful if re-running)
  await prisma.workspace.deleteMany({ where: { name: 'Acme Corp' } });

  // 1. Demo Workspace
  const workspace = await prisma.workspace.create({
    data: { name: 'Acme Corp' },
  });
  console.log(`Created workspace: ${workspace.name}`);

  // 2. Demo Users
  const passwordHash = await bcrypt.hash('demo123', 10);
  
  await prisma.user.createMany({
    data: [
      { email: 'admin@acme.com', name: 'Alice Admin', passwordHash, role: Role.ADMIN, workspaceId: workspace.id },
      { email: 'analyst@acme.com', name: 'Bob Analyst', passwordHash, role: Role.ANALYST, workspaceId: workspace.id },
      { email: 'viewer@acme.com', name: 'Charlie Viewer', passwordHash, role: Role.VIEWER, workspaceId: workspace.id },
    ],
  });
  console.log('Created 3 demo users (password for all: demo123)');

  // 3. Demo Themes
  const themeNames = ['Performance', 'UX/UI', 'Pricing', 'Feature Request', 'Customer Support', 'Reliability'];
  const themes = [];
  for (const name of themeNames) {
    const theme = await prisma.theme.create({
      data: { name, workspaceId: workspace.id }
    });
    themes.push(theme);
  }
  console.log(`Created ${themes.length} themes.`);

  // 4. Generate 120+ Feedback Items
  const channels = ['Zendesk', 'Intercom', 'App Store', 'Twitter', 'Email'];
  const baseFeedback = [
    { text: "The app crashes constantly when I try to open the dashboard.", sentiment: Sentiment.NEGATIVE, featureArea: 'Dashboard', themeIndex: 0 },
    { text: "I absolutely love the new dark mode. It's so much easier on the eyes.", sentiment: Sentiment.POSITIVE, featureArea: 'UI', themeIndex: 1 },
    { text: "Your pricing tiers are very confusing. I don't know what I'm paying for.", sentiment: Sentiment.NEGATIVE, featureArea: 'Billing', themeIndex: 2 },
    { text: "Could you please add an export to PDF feature? It would save me hours.", sentiment: Sentiment.NEUTRAL, featureArea: 'Reports', themeIndex: 3 },
    { text: "Customer support was amazing. Sarah resolved my issue in 5 minutes!", sentiment: Sentiment.POSITIVE, featureArea: 'Support', themeIndex: 4 },
    { text: "Sometimes the app takes forever to load on mobile.", sentiment: Sentiment.NEGATIVE, featureArea: 'Mobile App', themeIndex: 0 },
    { text: "I wish there was a way to customize the dashboard widgets.", sentiment: Sentiment.NEUTRAL, featureArea: 'Dashboard', themeIndex: 3 },
    { text: "The latest update completely broke my integration with Slack.", sentiment: Sentiment.NEGATIVE, featureArea: 'Integrations', themeIndex: 5 },
    { text: "Super intuitive and easy to use. Great job on the redesign.", sentiment: Sentiment.POSITIVE, featureArea: 'UI', themeIndex: 1 },
    { text: "How do I upgrade my account? The button seems to be missing.", sentiment: Sentiment.NEGATIVE, featureArea: 'Billing', themeIndex: 2 },
    { text: "Please add more chart types for the reports.", sentiment: Sentiment.NEUTRAL, featureArea: 'Reports', themeIndex: 3 },
    { text: "The support team hasn't replied to my ticket in 3 days. Unacceptable.", sentiment: Sentiment.NEGATIVE, featureArea: 'Support', themeIndex: 4 },
    { text: "Fast and reliable. I use this every single day.", sentiment: Sentiment.POSITIVE, featureArea: 'General', themeIndex: 5 },
    { text: "The fonts are too small to read on the settings page.", sentiment: Sentiment.NEGATIVE, featureArea: 'UI', themeIndex: 1 },
    { text: "Is there a student discount available?", sentiment: Sentiment.NEUTRAL, featureArea: 'Billing', themeIndex: 2 }
  ];

  let feedbackCount = 0;
  for (let i = 0; i < 125; i++) {
    const base = baseFeedback[i % baseFeedback.length];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    // Random score bounded by sentiment
    const score = base.sentiment === Sentiment.POSITIVE ? 0.7 + Math.random() * 0.3 : 
                  base.sentiment === Sentiment.NEGATIVE ? Math.random() * 0.4 : 
                  0.4 + Math.random() * 0.3;
    
    // Add unique variation
    const variation = ` [ID-${i}-${Math.random().toString(36).substring(7, 11)}]`;
    
    const feedback = await prisma.feedback.create({
      data: {
        content: base.text + variation,
        channel,
        sentiment: base.sentiment,
        sentimentScore: parseFloat(score.toFixed(2)),
        status: i % 3 === 0 ? FeedbackStatus.REVIEWED : FeedbackStatus.NEW,
        featureArea: base.featureArea,
        workspaceId: workspace.id,
      }
    });

    if (base.themeIndex !== undefined) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: themes[base.themeIndex].id,
          confidence: parseFloat((0.7 + Math.random() * 0.29).toFixed(2)),
          workspaceId: workspace.id
        }
      });
    }
    feedbackCount++;
  }
  
  console.log(`Created ${feedbackCount} realistic feedback items with linked themes.`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
