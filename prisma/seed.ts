import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. CRIAR TENANT DEMO PRIMEIRO
  console.log('1️⃣  Criando Distribuidora Demo...');
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      companyname: 'Distribuidora Demo Ltda',
      appname: 'Demo Gás',
      subdomain: 'demo',
      email: 'contato@demogas.com',
      phone: '(11) 98765-4321',
      primarycolor: '#FF5722',
      secondarycolor: '#2196F3',
      isactive: true,
    },
  });
  console.log(`   ✅ Tenant: ${demoTenant.appname} (subdomain: "${demoTenant.subdomain}")\n`);

  // 2. CRIAR SUPER ADMIN (com email único)
  console.log('2️⃣  Criando Super Admin...');
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  
  // Primeiro verifica se já existe
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: 'superadmin@saas.com', tenantid: null }
  });
  
  let superAdmin;
  if (!existingSuperAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@saas.com',
        password: superAdminPassword,
        role: 'superadmin',
        phone: '(11) 99999-9999',
        tenantid: null,
      },
    });
    console.log(`   ✅ Super Admin: ${superAdmin.email} / superadmin123\n`);
  } else {
    console.log(`   ℹ️  Super Admin já existe\n`);
    superAdmin = existingSuperAdmin;
  }

  // 3. CRIAR ADMIN DA DISTRIBUIDORA DEMO
  console.log('3️⃣  Criando Admin da Distribuidora Demo...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email_tenantid: { email: 'admin@distribuidora.com', tenantid: demoTenant.id } },
    update: {},
    create: {
      tenantid: demoTenant.id,
      name: 'Administrador',
      email: 'admin@distribuidora.com',
      password: adminPassword,
      role: 'admin',
      phone: '(11) 98888-8888',
    },
  });
  console.log(`   ✅ Admin: ${adminUser.email} / admin123\n`);

  // 4. CRIAR CLIENTE DE TESTE
  console.log('4️⃣  Criando Cliente de Teste...');
  const clientPassword = await bcrypt.hash('cliente123', 10);
  const clientUser = await prisma.user.upsert({
    where: { email_tenantid: { email: 'cliente@teste.com', tenantid: demoTenant.id } },
    update: {},
    create: {
      tenantid: demoTenant.id,
      name: 'João Silva',
      email: 'cliente@teste.com',
      password: clientPassword,
      role: 'client',
      phone: '(11) 97777-7777',
    },
  });
  console.log(`   ✅ Cliente: ${clientUser.email} / cliente123\n`);

  // 5. CRIAR PRODUTOS
  console.log('5️⃣  Criando Produtos...');
  const products = [
    {
      name: 'Botijão P13 (13kg)',
      category: 'Botijões',
      description: 'Botijão de gás GLP 13kg padrão',
      price: 95.00,
      imageurl: 'https://via.placeholder.com/300x300/FF5722/FFFFFF?text=P13',
      stock: 50,
    },
    {
      name: 'Botijão P45 (45kg)',
      category: 'Botijões',
      description: 'Botijão de gás GLP 45kg industrial',
      price: 350.00,
      imageurl: 'https://via.placeholder.com/300x300/FF5722/FFFFFF?text=P45',
      stock: 15,
    },
    {
      name: 'Água Mineral 20L',
      category: 'Água',
      description: 'Galão de água mineral 20 litros',
      price: 12.00,
      imageurl: 'https://via.placeholder.com/300x300/2196F3/FFFFFF?text=Agua',
      stock: 100,
    },
    {
      name: 'Regulador de Gás',
      category: 'Acessórios',
      description: 'Regulador de pressão para botijão P13',
      price: 25.00,
      imageurl: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=Regulador',
      stock: 30,
    },
    {
      name: 'Mangueira 80cm',
      category: 'Acessórios',
      description: 'Mangueira para gás 80cm NBR',
      price: 15.00,
      imageurl: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=Mangueira',
      stock: 40,
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { id: 'dummy-' + productData.name },
      update: {},
      create: {
        ...productData,
        tenantid: demoTenant.id,
      },
    });
  }
  console.log(`   ✅ ${products.length} produtos criados\n`);

  // 6. CRIAR ENDEREÇO DO CLIENTE
  console.log('6️⃣  Criando Endereço...');
  const existingAddress = await prisma.address.findFirst({
    where: { userid: clientUser.id }
  });
  
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userid: clientUser.id,
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-567',
        isdefault: true,
      },
    });
    console.log(`   ✅ Endereço criado\n`);
  } else {
    console.log(`   ℹ️  Endereço já existe\n`);
  }

  console.log('✨ Seed concluído com sucesso!\n');
  console.log('📋 CREDENCIAIS DE ACESSO:');
  console.log('─'.repeat(50));
  console.log('Super Admin (gerencia todas distribuidoras):');
  console.log('  Email: superadmin@saas.com');
  console.log('  Senha: superadmin123');
  console.log('  Role: superadmin');
  console.log('');
  console.log('Admin Distribuidora Demo:');
  console.log('  Email: admin@distribuidora.com');
  console.log('  Senha: admin123');
  console.log('  Tenant: demo');
  console.log('  Role: admin');
  console.log('');
  console.log('Cliente Teste:');
  console.log('  Email: cliente@teste.com');
  console.log('  Senha: cliente123');
  console.log('  Tenant: demo');
  console.log('  Role: client');
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
