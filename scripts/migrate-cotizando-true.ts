// Script to update all existing FamilyMember records to isCurrentlyContributing = true
// Run with: npx tsx scripts/migrate-cotizando-true.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating all existing FamilyMember records to isCurrentlyContributing = true...')
  
  const result = await prisma.familyMember.updateMany({
    where: {
      isCurrentlyContributing: false
    },
    data: {
      isCurrentlyContributing: true
    }
  })

  console.log(`✅ Updated ${result.count} records to isCurrentlyContributing = true`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
