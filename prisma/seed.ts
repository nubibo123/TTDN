import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const FORUM_CATEGORIES = [
  { name: 'Kinh nghiệm xét tuyển', slug: 'kinh-nghiem-xet-tuyen', displayOrder: 1 },
  { name: 'Tư vấn ngành & trường', slug: 'tu-van-nganh-truong', displayOrder: 2 },
  { name: 'Chia sẻ điểm thi', slug: 'chia-se-diem-thi', displayOrder: 3 },
  { name: 'Hỏi đáp thắc mắc', slug: 'hoi-dap', displayOrder: 4 },
  { name: 'Hướng nghiệp & định hướng', slug: 'huong-nghiep', displayOrder: 5 },
]

const ACADEMIC_YEARS = [2023, 2024, 2025, 2026]

async function main() {
  console.log('🌱 Seeding database…')

  // ── Forum Categories ─────────────────────────────────────────
  for (const cat of FORUM_CATEGORIES) {
    await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, displayOrder: cat.displayOrder },
      create: cat,
    })
  }
  console.log('✅ Forum categories created')

  // ── Academic Years ───────────────────────────────────────────
  for (const year of ACADEMIC_YEARS) {
    await prisma.academicYear.upsert({
      where: { year },
      update: { isActive: year === 2026 },
      create: { year, isActive: year === 2026 },
    })
  }
  console.log('✅ Academic years created')

  // ── Admin User ──────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'Admin@2026', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@huongnghiepvn.com' },
    update: {},
    create: {
      email: 'admin@huongnghiepvn.com',
      passwordHash: adminPasswordHash,
      name: 'Quản trị viên',
      isActive: true,
    },
  })

  await prisma.userRoleRecord.upsert({
    where: { userId_role: { userId: admin.id, role: 'ADMIN' } },
    update: {},
    create: { userId: admin.id, role: 'ADMIN', isVerified: true },
  })
  console.log('✅ Admin user created: admin@huongnghiepvn.com')

  // ── Sample Advisor ──────────────────────────────────────────
  const advisorPasswordHash = await bcrypt.hash('Advisor@2026', 12)
  const advisor = await prisma.user.upsert({
    where: { email: 'advisor@huongnghiepvn.com' },
    update: {},
    create: {
      email: 'advisor@huongnghiepvn.com',
      passwordHash: advisorPasswordHash,
      name: 'TS. Nguyễn Văn Minh',
      isActive: true,
    },
  })

  const hust = await prisma.university.findUnique({ where: { code: 'HUST' } })
  if (hust) {
    await prisma.advisor.upsert({
      where: { userId: advisor.id },
      update: {},
      create: {
        userId: advisor.id,
        universityId: hust.id,
        title: 'Chuyên viên tư vấn tuyển sinh',
        bio: 'Giáo viên tư vấn với hơn 10 năm kinh nghiệm hướng nghiệp cho học sinh THPT.',
      },
    })

    await prisma.userRoleRecord.upsert({
      where: { userId_role: { userId: advisor.id, role: 'ADVISOR' } },
      update: {},
      create: { userId: advisor.id, role: 'ADVISOR', universityId: hust.id, isVerified: true },
    })
    console.log('✅ Sample advisor created (HUST)')
  }

  console.log('\n🎉 Seed complete')
  console.log('   Admin:     admin@huongnghiepvn.com / Admin@2026')
  console.log('   Advisor:   advisor@huongnghiepvn.com / Advisor@2026')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })