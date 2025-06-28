--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: SystemAnnouncement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemAnnouncement" (id, title, content, type, priority, "targetUsers", "displayType", "startTime", "endTime", "isActive", "requireRead", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AnnouncementRead; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AnnouncementRead" (id, "announcementId", "userId", "readAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "userId", action, "entityType", "entityId", "oldValues", "newValues", "ipAddress", "userAgent", "timestamp", details) FROM stdin;
\.


--
-- Data for Name: Channel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Channel" (id, name, code, description, "contactName", "contactPhone", "contactEmail", address, "isActive", "createdAt", "updatedAt", "bankAccount", "bankName", "cooperationStart", "settlementCycle", status) FROM stdin;
\.


--
-- Data for Name: ChannelDeposit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelDeposit" (id, "channelId", amount, type, date, "paymentMethod", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, name, code, description, "imageUrl", "isActive", "sortOrder", "parentId", level, path, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, price, "commissionRate", type, "createdAt", "updatedAt", description, "imageUrl", barcode, category, cost, sku, "categoryId", details, dimensions, "imageUrls", inventory, material, unit) FROM stdin;
2	定制掐丝珐琅花瓶	1200	0	product	2025-05-27 08:50:03.995	2025-05-27 08:50:03.995	手工制作的掐丝珐琅花瓶，可定制图案和颜色	\N	\N	\N	600	CUSTOM-VASE-001	\N	\N	\N	{}	\N	\N	\N
13	件 单位	0	0	unit_placeholder	2025-05-27 22:49:17.464	2025-05-27 22:49:17.464	件 单位的占位产品	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	件
14	铜胎 材料	0	0	material_placeholder	2025-05-27 22:49:28.56	2025-05-27 22:49:28.56	铜胎 材料的占位产品	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	铜胎	\N
\.


--
-- Data for Name: ChannelInventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelInventory" (id, "channelId", "productId", quantity, "minQuantity", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChannelDistribution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelDistribution" (id, "channelId", "channelInventoryId", quantity, "distributionDate", notes, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChannelSettlement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelSettlement" (id, "channelId", "settlementNo", "startDate", "endDate", "totalAmount", "paidAmount", status, "paymentDate", "paymentMethod", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChannelInvoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelInvoice" (id, "settlementId", "invoiceNo", "invoiceDate", amount, "imageUrl", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChannelPrice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelPrice" (id, "channelId", "productId", price, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChannelSale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelSale" (id, "channelId", "saleDate", "totalAmount", notes, status, "importSource", "settlementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChannelSaleItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelSaleItem" (id, "channelSaleId", "productId", "channelInventoryId", quantity, price, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Employee" (id, name, "position", phone, email, "dailySalary", status, "createdAt", "updatedAt") FROM stdin;
1	测试员工	咖啡师	13800138000	test@example.com	200	active	2025-05-27 07:32:59.969	2025-05-27 07:32:59.969
2	伍尚明	店长	\N	simon@linghuaart.com	100	active	2025-05-27 10:25:35.888	2025-05-27 10:25:35.888
\.


--
-- Data for Name: CoffeeShopSale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CoffeeShopSale" (id, date, "totalSales", notes, "createdAt", "updatedAt", "alipayAmount", "cardAmount", "cashAmount", "customerCount", "otherAmount", "wechatAmount", "employeeId", "paymentMethods") FROM stdin;
2	2024-01-15 00:00:00	150.5	测试销售记录	2025-05-27 07:33:11.08	2025-05-27 07:33:11.08	0	0	0	8	0	0	1	{"cash":50,"wechat":60.5,"alipay":40,"card":0}
3	2025-05-27 12:38:58.395	1000		2025-05-27 12:39:07.637	2025-05-27 12:39:07.637	0	0	1000	0	0	0	\N	\N
\.


--
-- Data for Name: CoffeeShopItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CoffeeShopItem" (id, "coffeeShopSaleId", name, category, quantity, "unitPrice", "totalPrice", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CoffeeShopPurchase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CoffeeShopPurchase" (id, date, supplier, "employeeId", items, "totalAmount", "paymentMethod", notes, "createdAt", "updatedAt") FROM stdin;
1	2024-01-15 00:00:00	咖啡豆供应商	1	[{"name":"蓝山咖啡豆","quantity":5,"unit":"公斤","unitPrice":120,"total":600},{"name":"一次性杯子","quantity":100,"unit":"个","unitPrice":0.5,"total":50}]	650	transfer	测试采购记录	2025-05-27 07:33:20.61	2025-05-27 07:33:20.61
2	2025-05-27 00:00:00	咖啡	1	[{"name":"牛奶","quantity":1,"unit":"支","unitPrice":222,"total":222},{"name":"咖啡","quantity":1,"unit":"盒","unitPrice":220,"total":220}]	442	cash	\N	2025-05-27 09:51:11.66	2025-05-27 09:51:11.66
\.


--
-- Data for Name: CoffeeShopShift; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CoffeeShopShift" (id, "coffeeShopSaleId", "employeeId", "createdAt", "updatedAt") FROM stdin;
1	3	1	2025-05-27 12:39:07.649	2025-05-27 12:39:07.649
\.


--
-- Data for Name: CompanyProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CompanyProfile" (id, "companyName", "companyNameEn", "logoUrl", address, city, province, "postalCode", country, phone, fax, email, website, "taxNumber", "businessLicense", "legalRepresentative", "registeredCapital", "businessScope", description, "foundedDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customer" (id, name, phone, email, address, type, notes, "isActive", "createdAt", "updatedAt") FROM stdin;
1	测试客户	13800138001	customer@example.com	测试地址	individual	测试客户	t	2025-05-27 08:49:13.78	2025-05-27 08:49:13.78
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, "createdAt", "updatedAt", bio, "employeeId", "lastLogin", phone, "resetToken", "resetTokenExpiry", roles, "passwordLastChanged", "failedLoginAttempts", "lockedUntil") FROM stdin;
cmb6der6000016w3ills0rhxb	伍尚明	simon@linghuaart.com	\N	\N	$2b$12$QBUROGfuakCGI45UDPnij.g8/GvyRViJhhYg.wtTxdpvmYxAIKD5y	manager	2025-05-27 10:25:36.264	2025-05-27 11:03:42.739	\N	2	\N	\N	\N	\N	{}	\N	0	\N
\.


--
-- Data for Name: DashboardLayout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DashboardLayout" (id, "userId", name, "isDefault", layout, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DataBackup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DataBackup" (id, name, description, type, status, "filePath", "fileSize", modules, "startTime", "endTime", duration, "errorMessage", "createdBy", "isEncrypted", checksum, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DataDictionary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DataDictionary" (id, code, name, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DataDictionaryItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DataDictionaryItem" (id, "dictionaryId", code, value, label, "sortOrder", "isDefault", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DataTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DataTemplate" (id, name, type, module, description, fields, mapping, validation, example, version, "isActive", "isSystem", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FinancialAccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FinancialAccount" (id, name, "accountNumber", "accountType", "bankName", "initialBalance", "currentBalance", "isActive", notes, "createdAt", "updatedAt") FROM stdin;
1	测试账户_1748343822754	\N	cash	\N	10000	10000	t	\N	2025-05-27 11:03:42.754	2025-05-27 11:03:42.754
\.


--
-- Data for Name: FinancialCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FinancialCategory" (id, name, type, code, "parentId", description, "isSystem", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FinancialTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FinancialTransaction" (id, "transactionDate", amount, type, "accountId", "categoryId", "paymentMethod", "relatedId", "relatedType", counterparty, notes, "attachmentUrl", status, "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GallerySale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GallerySale" (id, "employeeId", date, "totalAmount", notes, "imageUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Warehouse" (id, name, type, location, description, "isActive", "createdAt", "updatedAt", code, "isDefault", "productionBaseId") FROM stdin;
1	测试仓库_1748343727080	physical	测试位置	\N	t	2025-05-27 11:02:07.081	2025-05-27 11:02:07.081	\N	f	\N
\.


--
-- Data for Name: InventoryItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InventoryItem" (id, "warehouseId", "productId", quantity, "minQuantity", "createdAt", "updatedAt", notes) FROM stdin;
\.


--
-- Data for Name: InventoryTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InventoryTransaction" (id, type, "sourceWarehouseId", "targetWarehouseId", "productId", quantity, notes, "referenceId", "referenceType", "createdAt", "updatedAt", "attachmentUrl", "relatedTransactionId", "productionOrderId", "qualityStatus") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "senderId", "recipientId", subject, content, type, priority, read, "readAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MessageRecipient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MessageRecipient" (id, "messageId", "userId", read, "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", title, message, type, priority, read, link, "createdAt", "updatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "customerId", "employeeId", "orderDate", status, "totalAmount", "paidAmount", "paymentStatus", "paymentMethod", notes, "createdAt", "updatedAt", "customDesign", "customRequirements", "designApproved", "designImageUrl", "designerNotes", "expectedDeliveryDate", "isCustom") FROM stdin;
2	LH2505278374	1	1	2024-01-15 10:00:00	design	1200	500	partial	wechat	测试定制订单	2025-05-27 08:50:23.493	2025-05-27 08:50:23.493	\N	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, discount, notes, "createdAt", "updatedAt") FROM stdin;
2	2	2	1	1200	0	定制作品: 掐丝珐琅花瓶	2025-05-27 08:50:23.505	2025-05-27 08:50:23.505
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Permission" (id, name, code, module, description, "createdAt", "updatedAt") FROM stdin;
1	查看仪表盘	dashboard.view	dashboard	允许查看系统仪表盘	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
2	查看产品	products.view	products	允许查看产品列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
3	创建产品	products.create	products	允许创建新产品	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
4	编辑产品	products.edit	products	允许编辑现有产品	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
5	删除产品	products.delete	products	允许删除产品	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
6	查看库存	inventory.view	inventory	允许查看库存列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
7	创建库存记录	inventory.create	inventory	允许创建库存记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
8	编辑库存	inventory.edit	inventory	允许编辑库存记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
9	删除库存记录	inventory.delete	inventory	允许删除库存记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
10	查看采购	purchase.view	purchase	允许查看采购订单列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
11	创建采购订单	purchase.create	purchase	允许创建采购订单	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
12	编辑采购订单	purchase.edit	purchase	允许编辑采购订单	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
13	删除采购订单	purchase.delete	purchase	允许删除采购订单	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
14	采购入库	purchase.receive	purchase	允许处理采购入库	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
15	管理供应商	purchase.supplier	purchase	允许管理供应商	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
16	查看销售	sales.view	sales	允许查看销售记录列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
17	创建销售	sales.create	sales	允许创建销售记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
18	编辑销售	sales.edit	sales	允许编辑销售记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
19	删除销售	sales.delete	sales	允许删除销售记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
20	查看生产	production.view	production	允许查看生产记录列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
21	创建生产记录	production.create	production	允许创建生产记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
22	编辑生产	production.edit	production	允许编辑生产记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
23	删除生产记录	production.delete	production	允许删除生产记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
24	查看员工	employees.view	employees	允许查看员工列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
25	创建员工	employees.create	employees	允许创建新员工	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
26	编辑员工	employees.edit	employees	允许编辑员工信息	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
27	删除员工	employees.delete	employees	允许删除员工	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
28	查看排班	schedule.view	schedule	允许查看排班表	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
29	创建排班	schedule.create	schedule	允许创建排班	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
30	编辑排班	schedule.edit	schedule	允许编辑排班	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
31	删除排班	schedule.delete	schedule	允许删除排班	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
32	查看薪资	salary.view	salary	允许查看薪资记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
33	创建薪资记录	salary.create	salary	允许创建薪资记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
34	编辑薪资	salary.edit	salary	允许编辑薪资记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
35	审批薪资	salary.approve	salary	允许审批薪资	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
36	发放薪资	salary.pay	salary	允许发放薪资	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
37	查看报表	reports.view	reports	允许查看系统报表	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
38	导出报表	reports.export	reports	允许导出报表数据	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
39	查看客户	customers.view	customers	允许查看客户列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
40	创建客户	customers.create	customers	允许创建新客户	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
41	编辑客户	customers.edit	customers	允许编辑客户信息	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
42	删除客户	customers.delete	customers	允许删除客户	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
43	查看渠道	channels.view	channels	允许查看渠道列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
44	创建渠道	channels.create	channels	允许创建新渠道	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
45	编辑渠道	channels.edit	channels	允许编辑渠道信息	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
46	删除渠道	channels.delete	channels	允许删除渠道	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
47	查看财务	finance.view	finance	允许查看财务记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
48	创建财务记录	finance.create	finance	允许创建财务记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
49	编辑财务	finance.edit	finance	允许编辑财务记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
50	审批财务	finance.approve	finance	允许审批财务记录	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
51	查看设置	system.view	system	允许查看系统设置	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
52	编辑设置	system.edit	system	允许编辑系统设置	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
53	查看用户	users.view	users	允许查看用户列表和详情	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
54	创建用户	users.create	users	允许创建新用户	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
55	编辑用户	users.edit	users	允许编辑用户信息	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
56	删除用户	users.delete	users	允许删除用户	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
57	查看权限	permissions.view	permissions	允许查看角色和权限	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
58	创建角色	permissions.create	permissions	允许创建新角色	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
59	编辑角色	permissions.edit	permissions	允许编辑角色	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
60	删除角色	permissions.delete	permissions	允许删除角色	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
61	分配权限	permissions.assign	permissions	允许为角色分配权限	2025-05-27 07:30:17.488	2025-05-27 07:30:17.488
\.


--
-- Data for Name: PieceWork; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PieceWork" (id, "employeeId", date, "workType", "totalAmount", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PieceWorkItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PieceWorkItem" (id, name, price, type, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PieceWorkDetail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PieceWorkDetail" (id, "pieceWorkId", "pieceWorkItemId", quantity, price, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PosSale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PosSale" (id, "employeeId", "customerId", "customerInfo", "totalAmount", "paymentMethod", date, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PosSaleItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PosSaleItem" (id, "posSaleId", "productId", quantity, price, discount, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PrintTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PrintTemplate" (id, name, type, description, template, "paperSize", orientation, "isDefault", "isActive", version, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductTag" (id, name, color, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductTagsOnProducts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductTagsOnProducts" ("productId", "tagId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ProductionBase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductionBase" (id, name, code, location, "contactName", "contactPhone", "contactEmail", address, specialties, capacity, "leadTime", "qualityRating", "isActive", notes, "createdAt", "updatedAt") FROM stdin;
1	广西生产基地	001	广西崇左					{掐丝珐琅}	\N	\N	\N	t		2025-05-27 10:23:42.354	2025-05-27 10:23:42.354
\.


--
-- Data for Name: ProductionOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductionOrder" (id, "orderNumber", "productionBaseId", "employeeId", "sourceOrderId", "orderDate", "expectedStartDate", "expectedEndDate", "actualStartDate", "actualEndDate", status, priority, "totalAmount", "paidAmount", "paymentStatus", "paymentMethod", "shippingMethod", "trackingNumber", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductionOrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductionOrderItem" (id, "productionOrderId", "productId", quantity, specifications, "completedQuantity", "qualityStatus", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Supplier" (id, name, "contactPerson", phone, email, address, description, "isActive", "supplierType", "createdAt", "updatedAt") FROM stdin;
1	人22	\N	\N	\N	\N	\N	t	material	2025-05-27 10:32:39.114	2025-05-27 10:32:39.114
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrder" (id, "orderNumber", "supplierId", "employeeId", "orderDate", "expectedDate", status, "totalAmount", "paidAmount", "paymentStatus", "paymentMethod", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PurchaseOrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrderItem" (id, "purchaseOrderId", "productId", quantity, price, "receivedQuantity", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: QualityRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QualityRecord" (id, "productionOrderId", "productionBaseId", "productId", "inspectorId", "inspectionDate", "qualityGrade", "qualityScore", "defectDescription", "actionRequired", status, images, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReportConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ReportConfig" (id, "userId", "reportType", name, description, config, "isDefault", "isShared", "sharedWith", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" (id, name, code, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
1	超级管理员	super_admin	系统超级管理员，拥有所有权限	t	2025-05-27 07:30:17.448	2025-05-27 07:30:17.448
4	管理员	admin	系统管理员，拥有大部分管理权限	t	2025-05-27 07:30:17.459	2025-05-27 07:30:17.459
5	经理	manager	部门经理，拥有部门管理权限	t	2025-05-27 07:30:17.463	2025-05-27 07:30:17.463
6	员工	employee	普通员工，拥有基本操作权限	t	2025-05-27 07:30:17.466	2025-05-27 07:30:17.466
7	财务	finance	财务人员，拥有财务相关权限	t	2025-05-27 07:30:17.471	2025-05-27 07:30:17.471
8	销售	sales	销售人员，拥有销售相关权限	t	2025-05-27 07:30:17.477	2025-05-27 07:30:17.477
9	库存管理员	inventory	库存管理员，拥有库存相关权限	t	2025-05-27 07:30:17.481	2025-05-27 07:30:17.481
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RolePermission" (id, "roleId", "permissionId", "createdAt") FROM stdin;
1	1	1	2025-05-27 07:30:17.52
2	1	2	2025-05-27 07:30:17.52
3	1	3	2025-05-27 07:30:17.52
4	1	4	2025-05-27 07:30:17.52
5	1	5	2025-05-27 07:30:17.52
6	1	6	2025-05-27 07:30:17.52
7	1	7	2025-05-27 07:30:17.52
8	1	8	2025-05-27 07:30:17.52
9	1	9	2025-05-27 07:30:17.52
10	1	10	2025-05-27 07:30:17.52
11	1	11	2025-05-27 07:30:17.52
12	1	12	2025-05-27 07:30:17.52
13	1	13	2025-05-27 07:30:17.52
14	1	14	2025-05-27 07:30:17.52
15	1	15	2025-05-27 07:30:17.52
16	1	16	2025-05-27 07:30:17.52
17	1	17	2025-05-27 07:30:17.52
18	1	18	2025-05-27 07:30:17.52
19	1	19	2025-05-27 07:30:17.52
20	1	20	2025-05-27 07:30:17.52
21	1	21	2025-05-27 07:30:17.52
22	1	22	2025-05-27 07:30:17.52
23	1	23	2025-05-27 07:30:17.52
24	1	24	2025-05-27 07:30:17.52
25	1	25	2025-05-27 07:30:17.52
26	1	26	2025-05-27 07:30:17.52
27	1	27	2025-05-27 07:30:17.52
28	1	28	2025-05-27 07:30:17.52
29	1	29	2025-05-27 07:30:17.52
30	1	30	2025-05-27 07:30:17.52
31	1	31	2025-05-27 07:30:17.52
32	1	32	2025-05-27 07:30:17.52
33	1	33	2025-05-27 07:30:17.52
34	1	34	2025-05-27 07:30:17.52
35	1	35	2025-05-27 07:30:17.52
36	1	36	2025-05-27 07:30:17.52
37	1	37	2025-05-27 07:30:17.52
38	1	38	2025-05-27 07:30:17.52
39	1	39	2025-05-27 07:30:17.52
40	1	40	2025-05-27 07:30:17.52
41	1	41	2025-05-27 07:30:17.52
42	1	42	2025-05-27 07:30:17.52
43	1	43	2025-05-27 07:30:17.52
44	1	44	2025-05-27 07:30:17.52
45	1	45	2025-05-27 07:30:17.52
46	1	46	2025-05-27 07:30:17.52
47	1	47	2025-05-27 07:30:17.52
48	1	48	2025-05-27 07:30:17.52
49	1	49	2025-05-27 07:30:17.52
50	1	50	2025-05-27 07:30:17.52
51	1	51	2025-05-27 07:30:17.52
52	1	52	2025-05-27 07:30:17.52
53	1	53	2025-05-27 07:30:17.52
54	1	54	2025-05-27 07:30:17.52
55	1	55	2025-05-27 07:30:17.52
56	1	56	2025-05-27 07:30:17.52
57	1	57	2025-05-27 07:30:17.52
58	1	58	2025-05-27 07:30:17.52
59	1	59	2025-05-27 07:30:17.52
60	1	60	2025-05-27 07:30:17.52
61	1	61	2025-05-27 07:30:17.52
62	4	1	2025-05-27 07:30:17.55
63	4	2	2025-05-27 07:30:17.55
64	4	3	2025-05-27 07:30:17.55
65	4	4	2025-05-27 07:30:17.55
66	4	5	2025-05-27 07:30:17.55
67	4	6	2025-05-27 07:30:17.55
68	4	7	2025-05-27 07:30:17.55
69	4	8	2025-05-27 07:30:17.55
70	4	9	2025-05-27 07:30:17.55
71	4	10	2025-05-27 07:30:17.55
72	4	11	2025-05-27 07:30:17.55
73	4	12	2025-05-27 07:30:17.55
74	4	13	2025-05-27 07:30:17.55
75	4	14	2025-05-27 07:30:17.55
76	4	15	2025-05-27 07:30:17.55
77	4	16	2025-05-27 07:30:17.55
78	4	17	2025-05-27 07:30:17.55
79	4	18	2025-05-27 07:30:17.55
80	4	19	2025-05-27 07:30:17.55
81	4	20	2025-05-27 07:30:17.55
82	4	21	2025-05-27 07:30:17.55
83	4	22	2025-05-27 07:30:17.55
84	4	23	2025-05-27 07:30:17.55
85	4	24	2025-05-27 07:30:17.55
86	4	25	2025-05-27 07:30:17.55
87	4	26	2025-05-27 07:30:17.55
88	4	27	2025-05-27 07:30:17.55
89	4	28	2025-05-27 07:30:17.55
90	4	29	2025-05-27 07:30:17.55
91	4	30	2025-05-27 07:30:17.55
92	4	31	2025-05-27 07:30:17.55
93	4	32	2025-05-27 07:30:17.55
94	4	33	2025-05-27 07:30:17.55
95	4	34	2025-05-27 07:30:17.55
96	4	35	2025-05-27 07:30:17.55
97	4	36	2025-05-27 07:30:17.55
98	4	37	2025-05-27 07:30:17.55
99	4	38	2025-05-27 07:30:17.55
100	4	39	2025-05-27 07:30:17.55
101	4	40	2025-05-27 07:30:17.55
102	4	41	2025-05-27 07:30:17.55
103	4	42	2025-05-27 07:30:17.55
104	4	43	2025-05-27 07:30:17.55
105	4	44	2025-05-27 07:30:17.55
106	4	45	2025-05-27 07:30:17.55
107	4	46	2025-05-27 07:30:17.55
108	4	47	2025-05-27 07:30:17.55
109	4	48	2025-05-27 07:30:17.55
110	4	49	2025-05-27 07:30:17.55
111	4	50	2025-05-27 07:30:17.55
112	4	53	2025-05-27 07:30:17.55
113	4	54	2025-05-27 07:30:17.55
114	4	55	2025-05-27 07:30:17.55
115	4	56	2025-05-27 07:30:17.55
116	5	24	2025-05-27 07:30:17.567
117	5	25	2025-05-27 07:30:17.567
118	5	26	2025-05-27 07:30:17.567
119	5	27	2025-05-27 07:30:17.567
120	5	28	2025-05-27 07:30:17.567
121	5	29	2025-05-27 07:30:17.567
122	5	30	2025-05-27 07:30:17.567
123	5	31	2025-05-27 07:30:17.567
124	5	37	2025-05-27 07:30:17.567
125	7	32	2025-05-27 07:30:17.594
126	7	33	2025-05-27 07:30:17.594
127	7	34	2025-05-27 07:30:17.594
128	7	35	2025-05-27 07:30:17.594
129	7	36	2025-05-27 07:30:17.594
130	7	37	2025-05-27 07:30:17.594
131	7	47	2025-05-27 07:30:17.594
132	7	48	2025-05-27 07:30:17.594
133	7	49	2025-05-27 07:30:17.594
134	7	50	2025-05-27 07:30:17.594
135	8	16	2025-05-27 07:30:17.621
136	8	17	2025-05-27 07:30:17.621
137	8	18	2025-05-27 07:30:17.621
138	8	19	2025-05-27 07:30:17.621
139	8	39	2025-05-27 07:30:17.621
140	8	40	2025-05-27 07:30:17.621
141	8	41	2025-05-27 07:30:17.621
142	8	42	2025-05-27 07:30:17.621
143	8	43	2025-05-27 07:30:17.621
144	8	44	2025-05-27 07:30:17.621
145	8	45	2025-05-27 07:30:17.621
146	8	46	2025-05-27 07:30:17.621
147	9	2	2025-05-27 07:30:17.64
148	9	6	2025-05-27 07:30:17.64
149	9	7	2025-05-27 07:30:17.64
150	9	8	2025-05-27 07:30:17.64
151	9	9	2025-05-27 07:30:17.64
152	9	10	2025-05-27 07:30:17.64
153	9	11	2025-05-27 07:30:17.64
154	9	12	2025-05-27 07:30:17.64
155	9	13	2025-05-27 07:30:17.64
156	9	14	2025-05-27 07:30:17.64
157	9	15	2025-05-27 07:30:17.64
\.


--
-- Data for Name: SalaryRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalaryRecord" (id, "employeeId", year, month, "baseSalary", "scheduleSalary", "salesCommission", "pieceWorkIncome", "workshopIncome", "coffeeShiftCommission", "overtimePay", bonus, deductions, "socialInsurance", tax, "totalIncome", "netIncome", status, "paymentDate", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SalaryAdjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalaryAdjustment" (id, "employeeId", "adjustmentDate", "oldSalary", "newSalary", reason, "approvedBy", notes, "createdAt", "updatedAt", "salaryRecordId") FROM stdin;
\.


--
-- Data for Name: SalesItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalesItem" (id, "gallerySaleId", "productId", quantity, price, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Schedule" (id, "employeeId", date, "startTime", "endTime", "createdAt", "updatedAt", note) FROM stdin;
3	2	2025-05-27 16:00:00	09:00	17:00	2025-05-27 22:54:23.67	2025-05-27 22:54:23.67	\N
\.


--
-- Data for Name: ScheduleTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ScheduleTemplate" (id, name, "startTime", "endTime", weekdays, "employeeIds", "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ShippingRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ShippingRecord" (id, "productionOrderId", "shippingType", "shippingDate", "expectedDate", "actualDate", carrier, "trackingNumber", "shippingCost", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemLog" (id, module, level, message, details, "userId", action, "ipAddress", "userAgent", "sessionId", "requestId", "timestamp", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemMetrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemMetrics" (id, "metricType", "metricName", value, unit, threshold, status, details, "timestamp", "createdAt") FROM stdin;
\.


--
-- Data for Name: SystemParameter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemParameter" (id, key, value, description, "group", type, options, "isSystem", "isReadonly", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemSetting" (id, "companyName", "coffeeSalesCommissionRate", "gallerySalesCommissionRate", "teacherWorkshopFee", "assistantWorkshopFee", "enableImageUpload", "enableNotifications", "createdAt", "updatedAt", "basicWorkingDays", "basicWorkingHours", "holidayOvertimeRate", "overtimeRate", "socialInsuranceRate", "taxRate", "weekendOvertimeRate", "assistantWorkshopFeeInside", "assistantWorkshopFeeOutside", "teacherWorkshopFeeInside", "teacherWorkshopFeeOutside") FROM stdin;
\.


--
-- Data for Name: Todo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Todo" (id, "userId", title, description, type, priority, status, completed, "dueDate", link, "createdAt", "updatedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: UploadedFile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UploadedFile" (id, filename, "originalName", path, mimetype, size, "gallerySaleId", "createdAt", "updatedAt") FROM stdin;
1	1456f47d-eb2b-4804-9c9d-97391455b198.png	102.png	/uploads/1456f47d-eb2b-4804-9c9d-97391455b198.png	image/png	345638	\N	2025-05-27 10:31:19.446	2025-05-27 10:31:19.446
2	2098c29c-ed89-4d9a-a968-868eed0cf5c8.png	064.png	/uploads/2098c29c-ed89-4d9a-a968-868eed0cf5c8.png	image/png	2004288	\N	2025-05-27 10:31:21.808	2025-05-27 10:31:21.808
3	8f520ee1-f8d6-4b7c-afab-20c9f693913c.png	064.png	/uploads/8f520ee1-f8d6-4b7c-afab-20c9f693913c.png	image/png	2004288	\N	2025-05-27 22:46:54.147	2025-05-27 22:46:54.147
4	80635650-5e8b-46f3-be0b-dce3437da5eb.png	064.png	/uploads/80635650-5e8b-46f3-be0b-dce3437da5eb.png	image/png	2004288	\N	2025-05-27 22:48:37.947	2025-05-27 22:48:37.947
5	ac8e31f7-581c-46d6-baac-57f6f3a877c1.png	064.png	/uploads/ac8e31f7-581c-46d6-baac-57f6f3a877c1.png	image/png	2004288	\N	2025-05-27 23:23:38.39	2025-05-27 23:23:38.39
6	26b5fcc8-8e35-4d6e-bc58-edb3d8895ec1.png	064.png	/uploads/26b5fcc8-8e35-4d6e-bc58-edb3d8895ec1.png	image/png	2004288	\N	2025-05-27 23:25:18.898	2025-05-27 23:25:18.898
\.


--
-- Data for Name: UserFavorite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserFavorite" (id, "userId", type, title, url, icon, category, description, config, "sortOrder", "isShared", "sharedWith", "accessCount", "lastAccess", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserLoginHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserLoginHistory" (id, "userId", "ipAddress", "userAgent", "loginTime", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: UserPreference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserPreference" (id, "userId", category, key, value, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRole" (id, "userId", "roleId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserSettings" (id, "userId", theme, language, "enableNotifications", "enableTwoFactorAuth", "twoFactorAuthSecret", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Workflow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Workflow" (id, code, name, description, "entityType", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowInstance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkflowInstance" (id, "workflowId", "entityId", status, "initiatedBy", "initiatedAt", "completedAt", "currentStepNumber", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowStep; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkflowStep" (id, "workflowId", name, description, "stepNumber", "approverType", "approverId", "isRequired", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowApproval; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkflowApproval" (id, "workflowInstanceId", "workflowStepId", "approverId", status, comments, "actionDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkshopActivity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkshopActivity" (id, name, description, "productId", duration, "minParticipants", "maxParticipants", price, "materialFee", "teacherFee", "assistantFee", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Workshop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Workshop" (id, date, "productId", "teacherId", "assistantId", role, "locationType", location, participants, duration, notes, "createdAt", "updatedAt", "activityId", "activityType", "baseType", "channelId", "customerId", "depositAmount", "managerId", "paymentMethod", "paymentStatus", status, "totalAmount") FROM stdin;
\.


--
-- Data for Name: WorkshopPrice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkshopPrice" (id, "activityId", "channelId", "basePrice", "pricePerPerson", "minParticipants", "maxParticipants", "materialFee", "teacherFee", "assistantFee", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkshopServiceItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkshopServiceItem" (id, "workshopId", "productId", quantity, price, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkshopTeamMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkshopTeamMember" (id, "employeeId", role, specialties, rating, "maxWorkshopsPerDay", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a725178a-f576-4932-9fad-5593433c0f99	0b2e72ab45dfe24eb8f5ca981282851c3615f0ffc1fd5e8b19af525d43864846	\N	20240520_add_workshop_fields	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20240520_add_workshop_fields\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "Workshop" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"Workshop\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(636), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20240520_add_workshop_fields"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20240520_add_workshop_fields"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:225	\N	2025-05-27 07:29:20.61008+00	0
\.


--
-- Name: AnnouncementRead_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."AnnouncementRead_id_seq"', 1, false);


--
-- Name: AuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."AuditLog_id_seq"', 1, false);


--
-- Name: ChannelDeposit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelDeposit_id_seq"', 1, false);


--
-- Name: ChannelDistribution_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelDistribution_id_seq"', 1, false);


--
-- Name: ChannelInventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelInventory_id_seq"', 1, false);


--
-- Name: ChannelInvoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelInvoice_id_seq"', 1, false);


--
-- Name: ChannelPrice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelPrice_id_seq"', 1, false);


--
-- Name: ChannelSaleItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelSaleItem_id_seq"', 1, false);


--
-- Name: ChannelSale_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelSale_id_seq"', 1, false);


--
-- Name: ChannelSettlement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ChannelSettlement_id_seq"', 1, false);


--
-- Name: Channel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Channel_id_seq"', 15, true);


--
-- Name: CoffeeShopItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CoffeeShopItem_id_seq"', 1, false);


--
-- Name: CoffeeShopPurchase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CoffeeShopPurchase_id_seq"', 2, true);


--
-- Name: CoffeeShopSale_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CoffeeShopSale_id_seq"', 3, true);


--
-- Name: CoffeeShopShift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CoffeeShopShift_id_seq"', 1, true);


--
-- Name: CompanyProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CompanyProfile_id_seq"', 1, false);


--
-- Name: Customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Customer_id_seq"', 2, true);


--
-- Name: DataBackup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DataBackup_id_seq"', 1, false);


--
-- Name: DataDictionaryItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DataDictionaryItem_id_seq"', 1, false);


--
-- Name: DataDictionary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DataDictionary_id_seq"', 1, false);


--
-- Name: DataTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DataTemplate_id_seq"', 1, false);


--
-- Name: Employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Employee_id_seq"', 24, true);


--
-- Name: FinancialAccount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."FinancialAccount_id_seq"', 1, true);


--
-- Name: FinancialCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."FinancialCategory_id_seq"', 1, false);


--
-- Name: FinancialTransaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."FinancialTransaction_id_seq"', 19, true);


--
-- Name: GallerySale_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."GallerySale_id_seq"', 1, false);


--
-- Name: InventoryItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InventoryItem_id_seq"', 21, true);


--
-- Name: InventoryTransaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InventoryTransaction_id_seq"', 1, false);


--
-- Name: OrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OrderItem_id_seq"', 2, true);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Order_id_seq"', 19, true);


--
-- Name: Permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Permission_id_seq"', 61, true);


--
-- Name: PieceWorkDetail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PieceWorkDetail_id_seq"', 1, false);


--
-- Name: PieceWorkItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PieceWorkItem_id_seq"', 1, false);


--
-- Name: PieceWork_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PieceWork_id_seq"', 1, false);


--
-- Name: PosSaleItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PosSaleItem_id_seq"', 1, false);


--
-- Name: PosSale_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PosSale_id_seq"', 1, false);


--
-- Name: PrintTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PrintTemplate_id_seq"', 1, false);


--
-- Name: ProductCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProductCategory_id_seq"', 1, false);


--
-- Name: ProductTag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProductTag_id_seq"', 1, false);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Product_id_seq"', 25, true);


--
-- Name: ProductionBase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProductionBase_id_seq"', 11, true);


--
-- Name: ProductionOrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProductionOrderItem_id_seq"', 1, false);


--
-- Name: ProductionOrder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProductionOrder_id_seq"', 1, false);


--
-- Name: PurchaseOrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseOrderItem_id_seq"', 1, false);


--
-- Name: PurchaseOrder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseOrder_id_seq"', 17, true);


--
-- Name: QualityRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."QualityRecord_id_seq"', 1, false);


--
-- Name: RolePermission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RolePermission_id_seq"', 157, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Role_id_seq"', 9, true);


--
-- Name: SalaryAdjustment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SalaryAdjustment_id_seq"', 1, false);


--
-- Name: SalaryRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SalaryRecord_id_seq"', 15, true);


--
-- Name: SalesItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SalesItem_id_seq"', 1, false);


--
-- Name: ScheduleTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ScheduleTemplate_id_seq"', 1, false);


--
-- Name: Schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Schedule_id_seq"', 3, true);


--
-- Name: ShippingRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ShippingRecord_id_seq"', 1, false);


--
-- Name: Supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Supplier_id_seq"', 1, true);


--
-- Name: SystemAnnouncement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SystemAnnouncement_id_seq"', 1, false);


--
-- Name: SystemLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SystemLog_id_seq"', 1, false);


--
-- Name: SystemMetrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SystemMetrics_id_seq"', 1, false);


--
-- Name: SystemParameter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SystemParameter_id_seq"', 10, true);


--
-- Name: SystemSetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SystemSetting_id_seq"', 1, false);


--
-- Name: UploadedFile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."UploadedFile_id_seq"', 6, true);


--
-- Name: UserLoginHistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."UserLoginHistory_id_seq"', 1, false);


--
-- Name: UserRole_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."UserRole_id_seq"', 1, false);


--
-- Name: UserSettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."UserSettings_id_seq"', 1, false);


--
-- Name: Warehouse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Warehouse_id_seq"', 1, true);


--
-- Name: WorkflowStep_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WorkflowStep_id_seq"', 1, false);


--
-- Name: Workflow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Workflow_id_seq"', 1, false);


--
-- Name: WorkshopActivity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WorkshopActivity_id_seq"', 1, false);


--
-- Name: WorkshopPrice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WorkshopPrice_id_seq"', 1, false);


--
-- Name: WorkshopServiceItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WorkshopServiceItem_id_seq"', 1, false);


--
-- Name: WorkshopTeamMember_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WorkshopTeamMember_id_seq"', 1, false);


--
-- Name: Workshop_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Workshop_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

