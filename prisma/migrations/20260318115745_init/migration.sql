-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "companyname" TEXT NOT NULL,
    "appname" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customdomain" TEXT,
    "logourl" TEXT,
    "splashscreenurl" TEXT,
    "primarycolor" TEXT NOT NULL DEFAULT '#FF5722',
    "secondarycolor" TEXT NOT NULL DEFAULT '#2196F3',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isactive" BOOLEAN NOT NULL DEFAULT true,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "tenantid" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "phoneverified" BOOLEAN NOT NULL DEFAULT true,
    "phoneverificationcode" TEXT,
    "phoneverificationexpiresat" TIMESTAMP(3),
    "role" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipcode" TEXT NOT NULL,
    "isdefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "tenantid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageurl" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "tenantid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "addressid" TEXT NOT NULL,
    "totalamount" DOUBLE PRECISION NOT NULL,
    "paymentmethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "observations" TEXT,
    "cancelreason" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderitem" (
    "id" TEXT NOT NULL,
    "orderid" TEXT NOT NULL,
    "productid" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitprice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "orderitem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subdomain_key" ON "tenant"("subdomain");

-- CreateIndex
CREATE INDEX "tenant_subdomain_idx" ON "tenant"("subdomain");

-- CreateIndex
CREATE INDEX "user_tenantid_idx" ON "user"("tenantid");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_tenantid_key" ON "user"("email", "tenantid");

-- CreateIndex
CREATE INDEX "address_userid_idx" ON "address"("userid");

-- CreateIndex
CREATE INDEX "product_tenantid_idx" ON "product"("tenantid");

-- CreateIndex
CREATE INDEX "product_category_idx" ON "product"("category");

-- CreateIndex
CREATE INDEX "order_tenantid_idx" ON "order"("tenantid");

-- CreateIndex
CREATE INDEX "order_userid_idx" ON "order"("userid");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "order"("status");

-- CreateIndex
CREATE INDEX "orderitem_orderid_idx" ON "orderitem"("orderid");

-- CreateIndex
CREATE INDEX "orderitem_productid_idx" ON "orderitem"("productid");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_tenantid_fkey" FOREIGN KEY ("tenantid") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_tenantid_fkey" FOREIGN KEY ("tenantid") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_tenantid_fkey" FOREIGN KEY ("tenantid") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_addressid_fkey" FOREIGN KEY ("addressid") REFERENCES "address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderitem" ADD CONSTRAINT "orderitem_orderid_fkey" FOREIGN KEY ("orderid") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderitem" ADD CONSTRAINT "orderitem_productid_fkey" FOREIGN KEY ("productid") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
