const bcrypt = require('bcryptjs');
const dbService = require('./dbService');

const DEMO_USERS = [
  {
    username: 'scan.supervisor',
    password: 'Scan@123',
    name: 'Scanning Supervisor',
    role: 'scanning_supervisor',
    status: 'active'
  },
  {
    username: 'batch.supervisor',
    password: 'Batch@123',
    name: 'Batch Supervisor',
    role: 'batch_supervisor',
    status: 'active'
  },
  {
    username: 'dispatch.supervisor',
    password: 'Dispatch@123',
    name: 'Dispatch Supervisor',
    role: 'dispatch_supervisor',
    status: 'active'
  },
  {
    username: 'hod',
    password: 'HOD@123',
    name: 'Department HOD',
    role: 'hod',
    status: 'active'
  },
  {
    username: 'admin',
    password: 'Admin@123',
    name: 'System Admin',
    role: 'admin',
    status: 'active'
  }
];

async function seedDatabase() {
  console.log('[Seed] Checking database seeding...');

  // 1. Seed Users
  for (const user of DEMO_USERS) {
    const existing = await dbService.getDocument('users', user.username);
    if (!existing) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await dbService.setDocument('users', user.username, {
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
        passwordHash: passwordHash
      });
      console.log(`[Seed] Created user: ${user.username}`);
    }
  }

  // Seed initial users and employees roster only. Keep production and attendance clean at 0 for fresh user entries.
  console.log('[Seed] Database seeding completed cleanly (0 production data).');
}

module.exports = {
  seedDatabase
};
