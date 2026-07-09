import { PrismaClient, Sentiment, FeedbackStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create a Demo Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
    },
  });
  console.log(`Created Workspace: ${workspace.name} (${workspace.id})`);

  // 2. Create Users
  const passwordHash = await bcrypt.hash('loop123', 10);
  
  const users = [
    { email: 'admin@acme.com', name: 'Alice Admin', role: Role.ADMIN },
    { email: 'analyst@acme.com', name: 'Bob Analyst', role: Role.ANALYST },
    { email: 'viewer@acme.com', name: 'Charlie Viewer', role: Role.VIEWER },
  ];

  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        workspaceId: workspace.id,
      },
    });
    console.log(`Created User: ${user.email} [${user.role}]`);
  }

  // 3. Create Themes
  const themeNames = [
    'Pricing', 'UI/UX', 'Performance', 'Customer Support', 
    'Mobile App', 'New Feature Request', 'Billing', 'Onboarding'
  ];
  
  const createdThemes = [];
  for (const name of themeNames) {
    const theme = await prisma.theme.create({
      data: {
        name,
        workspaceId: workspace.id,
      },
    });
    createdThemes.push(theme);
  }
  console.log(`Created ${createdThemes.length} Themes`);

  // 4. Generate 120+ Feedback Items
  const channels = ['Email', 'In-App', 'Support Ticket', 'Social Media', 'App Store'];
  const featureAreas = ['Dashboard', 'Checkout', 'Mobile App', 'Settings', 'Reporting'];
  const sentiments = [Sentiment.POSITIVE, Sentiment.NEUTRAL, Sentiment.NEGATIVE];
  const statuses = [FeedbackStatus.NEW, FeedbackStatus.REVIEWED, FeedbackStatus.ACTIONED];
  
  const feedbackTemplates = [
    { text: "The new dashboard is incredibly fast and intuitive.", sentiment: Sentiment.POSITIVE, score: 0.9, themeIdx: 1 },
    { text: "I can't figure out how to update my billing details. The UI is confusing.", sentiment: Sentiment.NEGATIVE, score: -0.8, themeIdx: 6 },
    { text: "App crashes every time I try to upload a profile picture on Android.", sentiment: Sentiment.NEGATIVE, score: -0.9, themeIdx: 4 },
    { text: "Support team was helpful but it took 2 days to get a response.", sentiment: Sentiment.NEUTRAL, score: 0.1, themeIdx: 3 },
    { text: "Would love to see an integration with Slack.", sentiment: Sentiment.NEUTRAL, score: 0.3, themeIdx: 5 },
    { text: "Pricing seems a bit steep for small teams, but the product is good.", sentiment: Sentiment.NEUTRAL, score: 0.2, themeIdx: 0 },
    { text: "Everything loads instantly now, amazing performance improvements!", sentiment: Sentiment.POSITIVE, score: 0.95, themeIdx: 2 },
    { text: "Onboarding was super smooth, got set up in 5 minutes.", sentiment: Sentiment.POSITIVE, score: 0.85, themeIdx: 7 },
  ];

  console.log('Generating 120 feedback items...');
  let feedbackCount = 0;
  
  // Create 15 batches of the 8 templates (120 total), varying the channel, date, status, etc.
  for (let i = 0; i < 15; i++) {
    for (const template of feedbackTemplates) {
      // Add some random variance
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const featureArea = featureAreas[Math.floor(Math.random() * featureAreas.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Simulate historical data (past 60 days)
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const feedback = await prisma.feedback.create({
        data: {
          content: template.text + (i > 0 ? ` (ID: ${i})` : ''), // Slight variance to avoid duplicates
          channel,
          sentiment: template.sentiment,
          sentimentScore: template.score,
          status,
          featureArea,
          rationale: `Customer mentioned ${template.text.substring(0, 20)}...`,
          workspaceId: workspace.id,
          createdAt,
          updatedAt: createdAt,
        }
      });

      // Link to a theme
      const theme = createdThemes[template.themeIdx];
      if (theme) {
        await prisma.feedbackTheme.create({
          data: {
            confidence: 0.85 + (Math.random() * 0.1), // 0.85 - 0.95
            feedbackId: feedback.id,
            themeId: theme.id,
            workspaceId: workspace.id
          }
        });
      }
      
      feedbackCount++;
    }
  }

  console.log(`Created ${feedbackCount} Feedback items with Theme links.`);
  console.log('Seed completed successfully.');
  console.log('\n--- Demo Credentials ---');
  console.log('Admin:   admin@acme.com   | pw: loop123');
  console.log('Analyst: analyst@acme.com | pw: loop123');
  console.log('Viewer:  viewer@acme.com  | pw: loop123');
  console.log('------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
