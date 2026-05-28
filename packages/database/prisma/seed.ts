import { ApprovalStatus } from '../generated/prisma'
import { prisma } from '../index';

async function main() {
  const ACADEMY_ID = '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e'

  // 1. Create Academy
  await prisma.academy.upsert({
    where: { id: ACADEMY_ID },
    update: {},
    create: {
      id: ACADEMY_ID,
      name: 'Test Academy',
      is_active: true,
    },
  })

  // 2. Create Users (Public App Tables)
  const appUsers = [
    { id: '4470461b-df03-47f5-9c04-29663f13ba7a', email: 'admin@test.com', first: 'Admin', last: 'User', roles: ['admin'] },
    { id: '4d9fe3e1-e9da-4552-b778-26f0b4f98445', email: 'coach@test.com', first: 'Coach', last: 'User', roles: ['coach'] },
    { id: '34488e91-c051-4d6c-ac28-10a7a774d04a', email: 'player@test.com', first: 'Player', last: 'User', roles: ['player'] },
    { id: '8b155308-9057-4c0e-b891-8398850866ad', email: 'parent@test.com', first: 'Parent', last: 'User', roles: ['parent'] },
    { id: '4f4a7dd4-8c12-4bb7-9a54-553da21b0965', email: 'super@test.com', first: 'Super', last: 'Admin', roles: ['superadmin'] },
    { id: 'a818b952-7bd6-4755-a53d-0dc6b62aa18c', email: 'dual@test.com', first: 'Dual', last: 'User', roles: ['admin', 'coach'] },
  ]

  for (const user of appUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        first_name: user.first,
        last_name: user.last,
        status: ApprovalStatus.ACTIVE,
      },
    })

    // 3. Assign Roles and Permissions
    const existingRole = await prisma.userAcademyRole.findFirst({
      where: { user_id: user.id, academy_id: ACADEMY_ID },
    })

    if (!existingRole) {
      await prisma.userAcademyRole.create({
        data: {
          user_id: user.id,
          academy_id: ACADEMY_ID,
          permissions: user.roles,
        },
      })
    }

    // 4. Inject into Supabase Auth Users Table (Raw SQL bypasses RLS)
    await prisma.$executeRawUnsafe(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, recovery_sent_at, last_sign_in_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        confirmation_token, email_change, email_change_token_new, recovery_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000', 
        '${user.id}', 
        'authenticated', 
        'authenticated', 
        '${user.email}', 
        extensions.crypt('password123', extensions.gen_salt('bf')), 
        now(), now(), now(), 
        '{"provider":"email","providers":["email"]}', 
        '{}', 
        now(), now(), '', '', '', ''
      )
      ON CONFLICT (id) DO NOTHING;
    `)
  }

  // 5. Add Identities for Supabase Auth Linking
  await prisma.$executeRawUnsafe(`
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    SELECT 
        gen_random_uuid(), 
        id, 
        format('{"sub":"%s","email":"%s"}', id, email)::jsonb, 
        'email', 
        id, 
        now(), 
        now(), 
        now()
    FROM auth.users
    WHERE email LIKE '%@test.com'
    ON CONFLICT (provider, provider_id) DO NOTHING;
  `)

  // 6. Create Player Record
  const PLAYER_ID = '7edcd21b-05f9-4d16-b251-82aeda6ade4f'
  const PARENT_ID = '8b155308-9057-4c0e-b891-8398850866ad'

  await prisma.player.upsert({
    where: { id: PLAYER_ID },
    update: {},
    create: {
      id: PLAYER_ID,
      academy_id: ACADEMY_ID,
      user_id: PARENT_ID,
      first_name: 'Junior',
      last_name: 'Player',
      dob: new Date('2015-01-01'),
      is_active: true,
    },
  })

  // 7. Link Parent to Player
  const existingLink = await prisma.parentPlayer.findUnique({
    where: {
      parent_user_id_player_id: {
        parent_user_id: PARENT_ID,
        player_id: PLAYER_ID,
      },
    },
  })

  if (!existingLink) {
    await prisma.parentPlayer.create({
      data: {
        parent_user_id: PARENT_ID,
        player_id: PLAYER_ID,
      },
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
