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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AnnouncementRead; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AnnouncementRead" (
    id integer NOT NULL,
    "announcementId" integer NOT NULL,
    "userId" text NOT NULL,
    "readAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AnnouncementRead" OWNER TO postgres;

--
-- Name: AnnouncementRead_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."AnnouncementRead_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AnnouncementRead_id_seq" OWNER TO postgres;

--
-- Name: AnnouncementRead_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."AnnouncementRead_id_seq" OWNED BY public."AnnouncementRead".id;


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id integer NOT NULL,
    "userId" text,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "oldValues" text,
    "newValues" text,
    "ipAddress" text,
    "userAgent" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details text
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: AuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."AuditLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AuditLog_id_seq" OWNER TO postgres;

--
-- Name: AuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."AuditLog_id_seq" OWNED BY public."AuditLog".id;


--
-- Name: Channel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Channel" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "contactName" text,
    "contactPhone" text,
    "contactEmail" text,
    address text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bankAccount" text,
    "bankName" text,
    "cooperationStart" timestamp(3) without time zone,
    "settlementCycle" integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL
);


ALTER TABLE public."Channel" OWNER TO postgres;

--
-- Name: ChannelDeposit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelDeposit" (
    id integer NOT NULL,
    "channelId" integer NOT NULL,
    amount double precision NOT NULL,
    type text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "paymentMethod" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelDeposit" OWNER TO postgres;

--
-- Name: ChannelDeposit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelDeposit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelDeposit_id_seq" OWNER TO postgres;

--
-- Name: ChannelDeposit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelDeposit_id_seq" OWNED BY public."ChannelDeposit".id;


--
-- Name: ChannelDistribution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelDistribution" (
    id integer NOT NULL,
    "channelId" integer NOT NULL,
    "channelInventoryId" integer NOT NULL,
    quantity integer NOT NULL,
    "distributionDate" timestamp(3) without time zone NOT NULL,
    notes text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelDistribution" OWNER TO postgres;

--
-- Name: ChannelDistribution_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelDistribution_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelDistribution_id_seq" OWNER TO postgres;

--
-- Name: ChannelDistribution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelDistribution_id_seq" OWNED BY public."ChannelDistribution".id;


--
-- Name: ChannelInventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelInventory" (
    id integer NOT NULL,
    "channelId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    "minQuantity" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelInventory" OWNER TO postgres;

--
-- Name: ChannelInventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelInventory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelInventory_id_seq" OWNER TO postgres;

--
-- Name: ChannelInventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelInventory_id_seq" OWNED BY public."ChannelInventory".id;


--
-- Name: ChannelInvoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelInvoice" (
    id integer NOT NULL,
    "settlementId" integer NOT NULL,
    "invoiceNo" text,
    "invoiceDate" timestamp(3) without time zone,
    amount double precision NOT NULL,
    "imageUrl" text,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelInvoice" OWNER TO postgres;

--
-- Name: ChannelInvoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelInvoice_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelInvoice_id_seq" OWNER TO postgres;

--
-- Name: ChannelInvoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelInvoice_id_seq" OWNED BY public."ChannelInvoice".id;


--
-- Name: ChannelPrice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelPrice" (
    id integer NOT NULL,
    "channelId" integer NOT NULL,
    "productId" integer NOT NULL,
    price double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelPrice" OWNER TO postgres;

--
-- Name: ChannelPrice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelPrice_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelPrice_id_seq" OWNER TO postgres;

--
-- Name: ChannelPrice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelPrice_id_seq" OWNED BY public."ChannelPrice".id;


--
-- Name: ChannelSale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelSale" (
    id integer NOT NULL,
    "channelId" integer NOT NULL,
    "saleDate" timestamp(3) without time zone NOT NULL,
    "totalAmount" double precision NOT NULL,
    notes text,
    status text DEFAULT 'pending'::text NOT NULL,
    "importSource" text,
    "settlementId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelSale" OWNER TO postgres;

--
-- Name: ChannelSaleItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelSaleItem" (
    id integer NOT NULL,
    "channelSaleId" integer NOT NULL,
    "productId" integer NOT NULL,
    "channelInventoryId" integer NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelSaleItem" OWNER TO postgres;

--
-- Name: ChannelSaleItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelSaleItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelSaleItem_id_seq" OWNER TO postgres;

--
-- Name: ChannelSaleItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelSaleItem_id_seq" OWNED BY public."ChannelSaleItem".id;


--
-- Name: ChannelSale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelSale_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelSale_id_seq" OWNER TO postgres;

--
-- Name: ChannelSale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelSale_id_seq" OWNED BY public."ChannelSale".id;


--
-- Name: ChannelSettlement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelSettlement" (
    id integer NOT NULL,
    "channelId" integer NOT NULL,
    "settlementNo" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "paymentDate" timestamp(3) without time zone,
    "paymentMethod" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelSettlement" OWNER TO postgres;

--
-- Name: ChannelSettlement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ChannelSettlement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChannelSettlement_id_seq" OWNER TO postgres;

--
-- Name: ChannelSettlement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ChannelSettlement_id_seq" OWNED BY public."ChannelSettlement".id;


--
-- Name: Channel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Channel_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Channel_id_seq" OWNER TO postgres;

--
-- Name: Channel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Channel_id_seq" OWNED BY public."Channel".id;


--
-- Name: CoffeeShopItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CoffeeShopItem" (
    id integer NOT NULL,
    "coffeeShopSaleId" integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CoffeeShopItem" OWNER TO postgres;

--
-- Name: CoffeeShopItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CoffeeShopItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CoffeeShopItem_id_seq" OWNER TO postgres;

--
-- Name: CoffeeShopItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CoffeeShopItem_id_seq" OWNED BY public."CoffeeShopItem".id;


--
-- Name: CoffeeShopPurchase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CoffeeShopPurchase" (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    supplier text NOT NULL,
    "employeeId" integer NOT NULL,
    items text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paymentMethod" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CoffeeShopPurchase" OWNER TO postgres;

--
-- Name: CoffeeShopPurchase_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CoffeeShopPurchase_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CoffeeShopPurchase_id_seq" OWNER TO postgres;

--
-- Name: CoffeeShopPurchase_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CoffeeShopPurchase_id_seq" OWNED BY public."CoffeeShopPurchase".id;


--
-- Name: CoffeeShopSale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CoffeeShopSale" (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "totalSales" double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "alipayAmount" double precision DEFAULT 0 NOT NULL,
    "cardAmount" double precision DEFAULT 0 NOT NULL,
    "cashAmount" double precision DEFAULT 0 NOT NULL,
    "customerCount" integer DEFAULT 0 NOT NULL,
    "otherAmount" double precision DEFAULT 0 NOT NULL,
    "wechatAmount" double precision DEFAULT 0 NOT NULL,
    "employeeId" integer,
    "paymentMethods" text
);


ALTER TABLE public."CoffeeShopSale" OWNER TO postgres;

--
-- Name: CoffeeShopSale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CoffeeShopSale_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CoffeeShopSale_id_seq" OWNER TO postgres;

--
-- Name: CoffeeShopSale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CoffeeShopSale_id_seq" OWNED BY public."CoffeeShopSale".id;


--
-- Name: CoffeeShopShift; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CoffeeShopShift" (
    id integer NOT NULL,
    "coffeeShopSaleId" integer NOT NULL,
    "employeeId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CoffeeShopShift" OWNER TO postgres;

--
-- Name: CoffeeShopShift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CoffeeShopShift_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CoffeeShopShift_id_seq" OWNER TO postgres;

--
-- Name: CoffeeShopShift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CoffeeShopShift_id_seq" OWNED BY public."CoffeeShopShift".id;


--
-- Name: CompanyProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CompanyProfile" (
    id integer NOT NULL,
    "companyName" text NOT NULL,
    "companyNameEn" text,
    "logoUrl" text,
    address text NOT NULL,
    city text,
    province text,
    "postalCode" text,
    country text DEFAULT '中国'::text NOT NULL,
    phone text NOT NULL,
    fax text,
    email text NOT NULL,
    website text,
    "taxNumber" text,
    "businessLicense" text,
    "legalRepresentative" text,
    "registeredCapital" text,
    "businessScope" text,
    description text,
    "foundedDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CompanyProfile" OWNER TO postgres;

--
-- Name: CompanyProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CompanyProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CompanyProfile_id_seq" OWNER TO postgres;

--
-- Name: CompanyProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CompanyProfile_id_seq" OWNED BY public."CompanyProfile".id;


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customer" (
    id integer NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    type text DEFAULT 'individual'::text NOT NULL,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- Name: Customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Customer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Customer_id_seq" OWNER TO postgres;

--
-- Name: Customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Customer_id_seq" OWNED BY public."Customer".id;


--
-- Name: DashboardLayout; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DashboardLayout" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    layout jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DashboardLayout" OWNER TO postgres;

--
-- Name: DataBackup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DataBackup" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "filePath" text,
    "fileSize" integer,
    modules text[],
    "startTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endTime" timestamp(3) without time zone,
    duration integer,
    "errorMessage" text,
    "createdBy" text NOT NULL,
    "isEncrypted" boolean DEFAULT true NOT NULL,
    checksum text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DataBackup" OWNER TO postgres;

--
-- Name: DataBackup_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DataBackup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DataBackup_id_seq" OWNER TO postgres;

--
-- Name: DataBackup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DataBackup_id_seq" OWNED BY public."DataBackup".id;


--
-- Name: DataDictionary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DataDictionary" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DataDictionary" OWNER TO postgres;

--
-- Name: DataDictionaryItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DataDictionaryItem" (
    id integer NOT NULL,
    "dictionaryId" integer NOT NULL,
    code text NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DataDictionaryItem" OWNER TO postgres;

--
-- Name: DataDictionaryItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DataDictionaryItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DataDictionaryItem_id_seq" OWNER TO postgres;

--
-- Name: DataDictionaryItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DataDictionaryItem_id_seq" OWNED BY public."DataDictionaryItem".id;


--
-- Name: DataDictionary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DataDictionary_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DataDictionary_id_seq" OWNER TO postgres;

--
-- Name: DataDictionary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DataDictionary_id_seq" OWNED BY public."DataDictionary".id;


--
-- Name: DataTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DataTemplate" (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    module text NOT NULL,
    description text,
    fields jsonb NOT NULL,
    mapping jsonb,
    validation jsonb,
    example jsonb,
    version text DEFAULT '1.0'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DataTemplate" OWNER TO postgres;

--
-- Name: DataTemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DataTemplate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DataTemplate_id_seq" OWNER TO postgres;

--
-- Name: DataTemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DataTemplate_id_seq" OWNED BY public."DataTemplate".id;


--
-- Name: Employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Employee" (
    id integer NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    phone text,
    email text,
    "dailySalary" double precision NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Employee" OWNER TO postgres;

--
-- Name: Employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Employee_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Employee_id_seq" OWNER TO postgres;

--
-- Name: Employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Employee_id_seq" OWNED BY public."Employee".id;


--
-- Name: FinancialAccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FinancialAccount" (
    id integer NOT NULL,
    name text NOT NULL,
    "accountNumber" text,
    "accountType" text NOT NULL,
    "bankName" text,
    "initialBalance" double precision DEFAULT 0 NOT NULL,
    "currentBalance" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FinancialAccount" OWNER TO postgres;

--
-- Name: FinancialAccount_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FinancialAccount_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FinancialAccount_id_seq" OWNER TO postgres;

--
-- Name: FinancialAccount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FinancialAccount_id_seq" OWNED BY public."FinancialAccount".id;


--
-- Name: FinancialCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FinancialCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    code text NOT NULL,
    "parentId" integer,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FinancialCategory" OWNER TO postgres;

--
-- Name: FinancialCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FinancialCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FinancialCategory_id_seq" OWNER TO postgres;

--
-- Name: FinancialCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FinancialCategory_id_seq" OWNED BY public."FinancialCategory".id;


--
-- Name: FinancialTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FinancialTransaction" (
    id integer NOT NULL,
    "transactionDate" timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL,
    type text NOT NULL,
    "accountId" integer NOT NULL,
    "categoryId" integer,
    "paymentMethod" text,
    "relatedId" integer,
    "relatedType" text,
    counterparty text,
    notes text,
    "attachmentUrl" text,
    status text DEFAULT 'completed'::text NOT NULL,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FinancialTransaction" OWNER TO postgres;

--
-- Name: FinancialTransaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FinancialTransaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FinancialTransaction_id_seq" OWNER TO postgres;

--
-- Name: FinancialTransaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FinancialTransaction_id_seq" OWNED BY public."FinancialTransaction".id;


--
-- Name: GallerySale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GallerySale" (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "totalAmount" double precision NOT NULL,
    notes text,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GallerySale" OWNER TO postgres;

--
-- Name: GallerySale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."GallerySale_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GallerySale_id_seq" OWNER TO postgres;

--
-- Name: GallerySale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."GallerySale_id_seq" OWNED BY public."GallerySale".id;


--
-- Name: InventoryItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InventoryItem" (
    id integer NOT NULL,
    "warehouseId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    "minQuantity" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    notes text
);


ALTER TABLE public."InventoryItem" OWNER TO postgres;

--
-- Name: InventoryItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."InventoryItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."InventoryItem_id_seq" OWNER TO postgres;

--
-- Name: InventoryItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."InventoryItem_id_seq" OWNED BY public."InventoryItem".id;


--
-- Name: InventoryTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InventoryTransaction" (
    id integer NOT NULL,
    type text NOT NULL,
    "sourceWarehouseId" integer,
    "targetWarehouseId" integer,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    notes text,
    "referenceId" integer,
    "referenceType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "attachmentUrl" text,
    "relatedTransactionId" integer,
    "productionOrderId" integer,
    "qualityStatus" text
);


ALTER TABLE public."InventoryTransaction" OWNER TO postgres;

--
-- Name: InventoryTransaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."InventoryTransaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."InventoryTransaction_id_seq" OWNER TO postgres;

--
-- Name: InventoryTransaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."InventoryTransaction_id_seq" OWNED BY public."InventoryTransaction".id;


--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "senderId" text NOT NULL,
    "recipientId" text,
    subject text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'chat'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: MessageRecipient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MessageRecipient" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageRecipient" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    priority text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id integer NOT NULL,
    "orderNumber" text NOT NULL,
    "customerId" integer NOT NULL,
    "employeeId" integer NOT NULL,
    "orderDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "paymentStatus" text DEFAULT 'unpaid'::text NOT NULL,
    "paymentMethod" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customDesign" text,
    "customRequirements" text,
    "designApproved" boolean,
    "designImageUrl" text,
    "designerNotes" text,
    "expectedDeliveryDate" timestamp(3) without time zone,
    "isCustom" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- Name: OrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OrderItem_id_seq" OWNER TO postgres;

--
-- Name: OrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OrderItem_id_seq" OWNED BY public."OrderItem".id;


--
-- Name: Order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Order_id_seq" OWNER TO postgres;

--
-- Name: Order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Order_id_seq" OWNED BY public."Order".id;


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Permission" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    module text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Permission" OWNER TO postgres;

--
-- Name: Permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Permission_id_seq" OWNER TO postgres;

--
-- Name: Permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Permission_id_seq" OWNED BY public."Permission".id;


--
-- Name: PieceWork; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PieceWork" (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "workType" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PieceWork" OWNER TO postgres;

--
-- Name: PieceWorkDetail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PieceWorkDetail" (
    id integer NOT NULL,
    "pieceWorkId" integer NOT NULL,
    "pieceWorkItemId" integer NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PieceWorkDetail" OWNER TO postgres;

--
-- Name: PieceWorkDetail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PieceWorkDetail_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PieceWorkDetail_id_seq" OWNER TO postgres;

--
-- Name: PieceWorkDetail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PieceWorkDetail_id_seq" OWNED BY public."PieceWorkDetail".id;


--
-- Name: PieceWorkItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PieceWorkItem" (
    id integer NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    type text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PieceWorkItem" OWNER TO postgres;

--
-- Name: PieceWorkItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PieceWorkItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PieceWorkItem_id_seq" OWNER TO postgres;

--
-- Name: PieceWorkItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PieceWorkItem_id_seq" OWNED BY public."PieceWorkItem".id;


--
-- Name: PieceWork_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PieceWork_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PieceWork_id_seq" OWNER TO postgres;

--
-- Name: PieceWork_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PieceWork_id_seq" OWNED BY public."PieceWork".id;


--
-- Name: PosSale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PosSale" (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    "customerId" integer,
    "customerInfo" jsonb,
    "totalAmount" double precision NOT NULL,
    "paymentMethod" text DEFAULT 'cash'::text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PosSale" OWNER TO postgres;

--
-- Name: PosSaleItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PosSaleItem" (
    id integer NOT NULL,
    "posSaleId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PosSaleItem" OWNER TO postgres;

--
-- Name: PosSaleItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PosSaleItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PosSaleItem_id_seq" OWNER TO postgres;

--
-- Name: PosSaleItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PosSaleItem_id_seq" OWNED BY public."PosSaleItem".id;


--
-- Name: PosSale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PosSale_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PosSale_id_seq" OWNER TO postgres;

--
-- Name: PosSale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PosSale_id_seq" OWNED BY public."PosSale".id;


--
-- Name: PrintTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PrintTemplate" (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    template jsonb NOT NULL,
    "paperSize" text DEFAULT 'A4'::text NOT NULL,
    orientation text DEFAULT 'portrait'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    version text DEFAULT '1.0'::text NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PrintTemplate" OWNER TO postgres;

--
-- Name: PrintTemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PrintTemplate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PrintTemplate_id_seq" OWNER TO postgres;

--
-- Name: PrintTemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PrintTemplate_id_seq" OWNED BY public."PrintTemplate".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    "commissionRate" double precision NOT NULL,
    type text DEFAULT 'product'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "imageUrl" text,
    barcode text,
    category text,
    cost double precision,
    sku text,
    "categoryId" integer,
    details text,
    dimensions text,
    "imageUrls" text[] DEFAULT ARRAY[]::text[],
    inventory integer,
    material text,
    unit text
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    code text,
    description text,
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "parentId" integer,
    level integer DEFAULT 1 NOT NULL,
    path text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductCategory" OWNER TO postgres;

--
-- Name: ProductCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProductCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProductCategory_id_seq" OWNER TO postgres;

--
-- Name: ProductCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProductCategory_id_seq" OWNED BY public."ProductCategory".id;


--
-- Name: ProductTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductTag" (
    id integer NOT NULL,
    name text NOT NULL,
    color text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductTag" OWNER TO postgres;

--
-- Name: ProductTag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProductTag_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProductTag_id_seq" OWNER TO postgres;

--
-- Name: ProductTag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProductTag_id_seq" OWNED BY public."ProductTag".id;


--
-- Name: ProductTagsOnProducts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductTagsOnProducts" (
    "productId" integer NOT NULL,
    "tagId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProductTagsOnProducts" OWNER TO postgres;

--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Product_id_seq" OWNER TO postgres;

--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: ProductionBase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductionBase" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    location text NOT NULL,
    "contactName" text,
    "contactPhone" text,
    "contactEmail" text,
    address text,
    specialties text[] DEFAULT ARRAY[]::text[],
    capacity integer,
    "leadTime" integer,
    "qualityRating" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductionBase" OWNER TO postgres;

--
-- Name: ProductionBase_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProductionBase_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProductionBase_id_seq" OWNER TO postgres;

--
-- Name: ProductionBase_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProductionBase_id_seq" OWNED BY public."ProductionBase".id;


--
-- Name: ProductionOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductionOrder" (
    id integer NOT NULL,
    "orderNumber" text NOT NULL,
    "productionBaseId" integer NOT NULL,
    "employeeId" integer NOT NULL,
    "sourceOrderId" integer,
    "orderDate" timestamp(3) without time zone NOT NULL,
    "expectedStartDate" timestamp(3) without time zone,
    "expectedEndDate" timestamp(3) without time zone,
    "actualStartDate" timestamp(3) without time zone,
    "actualEndDate" timestamp(3) without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "paymentStatus" text DEFAULT 'unpaid'::text NOT NULL,
    "paymentMethod" text,
    "shippingMethod" text,
    "trackingNumber" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductionOrder" OWNER TO postgres;

--
-- Name: ProductionOrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductionOrderItem" (
    id integer NOT NULL,
    "productionOrderId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    specifications text,
    "completedQuantity" integer DEFAULT 0 NOT NULL,
    "qualityStatus" text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductionOrderItem" OWNER TO postgres;

--
-- Name: ProductionOrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProductionOrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProductionOrderItem_id_seq" OWNER TO postgres;

--
-- Name: ProductionOrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProductionOrderItem_id_seq" OWNED BY public."ProductionOrderItem".id;


--
-- Name: ProductionOrder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProductionOrder_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProductionOrder_id_seq" OWNER TO postgres;

--
-- Name: ProductionOrder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProductionOrder_id_seq" OWNED BY public."ProductionOrder".id;


--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrder" (
    id integer NOT NULL,
    "orderNumber" text NOT NULL,
    "supplierId" integer NOT NULL,
    "employeeId" integer NOT NULL,
    "orderDate" timestamp(3) without time zone NOT NULL,
    "expectedDate" timestamp(3) without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "paymentStatus" text DEFAULT 'unpaid'::text NOT NULL,
    "paymentMethod" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PurchaseOrder" OWNER TO postgres;

--
-- Name: PurchaseOrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrderItem" (
    id integer NOT NULL,
    "purchaseOrderId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "receivedQuantity" integer DEFAULT 0 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PurchaseOrderItem" OWNER TO postgres;

--
-- Name: PurchaseOrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PurchaseOrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PurchaseOrderItem_id_seq" OWNER TO postgres;

--
-- Name: PurchaseOrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PurchaseOrderItem_id_seq" OWNED BY public."PurchaseOrderItem".id;


--
-- Name: PurchaseOrder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PurchaseOrder_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PurchaseOrder_id_seq" OWNER TO postgres;

--
-- Name: PurchaseOrder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PurchaseOrder_id_seq" OWNED BY public."PurchaseOrder".id;


--
-- Name: QualityRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QualityRecord" (
    id integer NOT NULL,
    "productionOrderId" integer,
    "productionBaseId" integer NOT NULL,
    "productId" integer NOT NULL,
    "inspectorId" integer NOT NULL,
    "inspectionDate" timestamp(3) without time zone NOT NULL,
    "qualityGrade" text NOT NULL,
    "qualityScore" double precision,
    "defectDescription" text,
    "actionRequired" text,
    status text DEFAULT 'pending'::text NOT NULL,
    images text[] DEFAULT ARRAY[]::text[],
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."QualityRecord" OWNER TO postgres;

--
-- Name: QualityRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."QualityRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."QualityRecord_id_seq" OWNER TO postgres;

--
-- Name: QualityRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."QualityRecord_id_seq" OWNED BY public."QualityRecord".id;


--
-- Name: ReportConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReportConfig" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "reportType" text NOT NULL,
    name text NOT NULL,
    description text,
    config jsonb NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isShared" boolean DEFAULT false NOT NULL,
    "sharedWith" text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReportConfig" OWNER TO postgres;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RolePermission" (
    id integer NOT NULL,
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO postgres;

--
-- Name: RolePermission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RolePermission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RolePermission_id_seq" OWNER TO postgres;

--
-- Name: RolePermission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RolePermission_id_seq" OWNED BY public."RolePermission".id;


--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO postgres;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: SalaryAdjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SalaryAdjustment" (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    "adjustmentDate" timestamp(3) without time zone NOT NULL,
    "oldSalary" double precision NOT NULL,
    "newSalary" double precision NOT NULL,
    reason text NOT NULL,
    "approvedBy" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "salaryRecordId" integer
);


ALTER TABLE public."SalaryAdjustment" OWNER TO postgres;

--
-- Name: SalaryAdjustment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SalaryAdjustment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SalaryAdjustment_id_seq" OWNER TO postgres;

--
-- Name: SalaryAdjustment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SalaryAdjustment_id_seq" OWNED BY public."SalaryAdjustment".id;


--
-- Name: SalaryRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SalaryRecord" (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "baseSalary" double precision NOT NULL,
    "scheduleSalary" double precision NOT NULL,
    "salesCommission" double precision NOT NULL,
    "pieceWorkIncome" double precision NOT NULL,
    "workshopIncome" double precision NOT NULL,
    "coffeeShiftCommission" double precision NOT NULL,
    "overtimePay" double precision NOT NULL,
    bonus double precision NOT NULL,
    deductions double precision NOT NULL,
    "socialInsurance" double precision NOT NULL,
    tax double precision NOT NULL,
    "totalIncome" double precision NOT NULL,
    "netIncome" double precision NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "paymentDate" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalaryRecord" OWNER TO postgres;

--
-- Name: SalaryRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SalaryRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SalaryRecord_id_seq" OWNER TO postgres;

--
-- Name: SalaryRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SalaryRecord_id_seq" OWNED BY public."SalaryRecord".id;


--
-- Name: SalesItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SalesItem" (
    id integer NOT NULL,
    "gallerySaleId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalesItem" OWNER TO postgres;

--
-- Name: SalesItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SalesItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SalesItem_id_seq" OWNER TO postgres;

--
-- Name: SalesItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SalesItem_id_seq" OWNED BY public."SalesItem".id;


--
-- Name: Schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Schedule" (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    note text
);


ALTER TABLE public."Schedule" OWNER TO postgres;

--
-- Name: ScheduleTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ScheduleTemplate" (
    id integer NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    weekdays integer[],
    "employeeIds" integer[],
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScheduleTemplate" OWNER TO postgres;

--
-- Name: ScheduleTemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ScheduleTemplate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ScheduleTemplate_id_seq" OWNER TO postgres;

--
-- Name: ScheduleTemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ScheduleTemplate_id_seq" OWNED BY public."ScheduleTemplate".id;


--
-- Name: Schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Schedule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Schedule_id_seq" OWNER TO postgres;

--
-- Name: Schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Schedule_id_seq" OWNED BY public."Schedule".id;


--
-- Name: ShippingRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ShippingRecord" (
    id integer NOT NULL,
    "productionOrderId" integer NOT NULL,
    "shippingType" text NOT NULL,
    "shippingDate" timestamp(3) without time zone NOT NULL,
    "expectedDate" timestamp(3) without time zone,
    "actualDate" timestamp(3) without time zone,
    carrier text,
    "trackingNumber" text,
    "shippingCost" double precision,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ShippingRecord" OWNER TO postgres;

--
-- Name: ShippingRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ShippingRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ShippingRecord_id_seq" OWNER TO postgres;

--
-- Name: ShippingRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ShippingRecord_id_seq" OWNED BY public."ShippingRecord".id;


--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supplier" (
    id integer NOT NULL,
    name text NOT NULL,
    "contactPerson" text,
    phone text,
    email text,
    address text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "supplierType" text DEFAULT 'material'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Supplier" OWNER TO postgres;

--
-- Name: Supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Supplier_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Supplier_id_seq" OWNER TO postgres;

--
-- Name: Supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Supplier_id_seq" OWNED BY public."Supplier".id;


--
-- Name: SystemAnnouncement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemAnnouncement" (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    "targetUsers" text[],
    "displayType" text DEFAULT 'banner'::text NOT NULL,
    "startTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endTime" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "requireRead" boolean DEFAULT false NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemAnnouncement" OWNER TO postgres;

--
-- Name: SystemAnnouncement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemAnnouncement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemAnnouncement_id_seq" OWNER TO postgres;

--
-- Name: SystemAnnouncement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemAnnouncement_id_seq" OWNED BY public."SystemAnnouncement".id;


--
-- Name: SystemLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemLog" (
    id integer NOT NULL,
    module text NOT NULL,
    level text NOT NULL,
    message text NOT NULL,
    details jsonb,
    "userId" text,
    action text,
    "ipAddress" text,
    "userAgent" text,
    "sessionId" text,
    "requestId" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SystemLog" OWNER TO postgres;

--
-- Name: SystemLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemLog_id_seq" OWNER TO postgres;

--
-- Name: SystemLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemLog_id_seq" OWNED BY public."SystemLog".id;


--
-- Name: SystemMetrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemMetrics" (
    id integer NOT NULL,
    "metricType" text NOT NULL,
    "metricName" text NOT NULL,
    value double precision NOT NULL,
    unit text,
    threshold double precision,
    status text DEFAULT 'normal'::text NOT NULL,
    details jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SystemMetrics" OWNER TO postgres;

--
-- Name: SystemMetrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemMetrics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemMetrics_id_seq" OWNER TO postgres;

--
-- Name: SystemMetrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemMetrics_id_seq" OWNED BY public."SystemMetrics".id;


--
-- Name: SystemParameter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemParameter" (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "group" text DEFAULT 'general'::text NOT NULL,
    type text DEFAULT 'string'::text NOT NULL,
    options text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "isReadonly" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemParameter" OWNER TO postgres;

--
-- Name: SystemParameter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemParameter_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemParameter_id_seq" OWNER TO postgres;

--
-- Name: SystemParameter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemParameter_id_seq" OWNED BY public."SystemParameter".id;


--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemSetting" (
    id integer NOT NULL,
    "companyName" text NOT NULL,
    "coffeeSalesCommissionRate" double precision NOT NULL,
    "gallerySalesCommissionRate" double precision NOT NULL,
    "teacherWorkshopFee" double precision NOT NULL,
    "assistantWorkshopFee" double precision NOT NULL,
    "enableImageUpload" boolean DEFAULT true NOT NULL,
    "enableNotifications" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "basicWorkingDays" integer DEFAULT 22 NOT NULL,
    "basicWorkingHours" double precision DEFAULT 8 NOT NULL,
    "holidayOvertimeRate" double precision DEFAULT 3 NOT NULL,
    "overtimeRate" double precision DEFAULT 1.5 NOT NULL,
    "socialInsuranceRate" double precision DEFAULT 0 NOT NULL,
    "taxRate" double precision DEFAULT 0 NOT NULL,
    "weekendOvertimeRate" double precision DEFAULT 2 NOT NULL,
    "assistantWorkshopFeeInside" double precision DEFAULT 110 NOT NULL,
    "assistantWorkshopFeeOutside" double precision DEFAULT 130 NOT NULL,
    "teacherWorkshopFeeInside" double precision DEFAULT 180 NOT NULL,
    "teacherWorkshopFeeOutside" double precision DEFAULT 200 NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO postgres;

--
-- Name: SystemSetting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemSetting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemSetting_id_seq" OWNER TO postgres;

--
-- Name: SystemSetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemSetting_id_seq" OWNED BY public."SystemSetting".id;


--
-- Name: Todo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Todo" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    priority text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "dueDate" timestamp(3) without time zone,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public."Todo" OWNER TO postgres;

--
-- Name: UploadedFile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UploadedFile" (
    id integer NOT NULL,
    filename text NOT NULL,
    "originalName" text,
    path text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    "gallerySaleId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UploadedFile" OWNER TO postgres;

--
-- Name: UploadedFile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UploadedFile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UploadedFile_id_seq" OWNER TO postgres;

--
-- Name: UploadedFile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UploadedFile_id_seq" OWNED BY public."UploadedFile".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text,
    role text DEFAULT 'user'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    bio text,
    "employeeId" integer,
    "lastLogin" timestamp(3) without time zone,
    phone text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    roles integer[] DEFAULT ARRAY[]::integer[],
    "passwordLastChanged" timestamp(3) without time zone,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserFavorite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserFavorite" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    url text,
    icon text,
    category text,
    description text,
    config jsonb,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isShared" boolean DEFAULT false NOT NULL,
    "sharedWith" text[] DEFAULT ARRAY[]::text[],
    "accessCount" integer DEFAULT 0 NOT NULL,
    "lastAccess" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserFavorite" OWNER TO postgres;

--
-- Name: UserLoginHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserLoginHistory" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "ipAddress" text NOT NULL,
    "userAgent" text NOT NULL,
    "loginTime" timestamp(3) without time zone NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserLoginHistory" OWNER TO postgres;

--
-- Name: UserLoginHistory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UserLoginHistory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserLoginHistory_id_seq" OWNER TO postgres;

--
-- Name: UserLoginHistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UserLoginHistory_id_seq" OWNED BY public."UserLoginHistory".id;


--
-- Name: UserPreference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserPreference" (
    id text NOT NULL,
    "userId" text NOT NULL,
    category text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserPreference" OWNER TO postgres;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserRole" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "roleId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO postgres;

--
-- Name: UserRole_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UserRole_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserRole_id_seq" OWNER TO postgres;

--
-- Name: UserRole_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UserRole_id_seq" OWNED BY public."UserRole".id;


--
-- Name: UserSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSettings" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    theme text DEFAULT 'light'::text NOT NULL,
    language text DEFAULT 'zh-CN'::text NOT NULL,
    "enableNotifications" boolean DEFAULT true NOT NULL,
    "enableTwoFactorAuth" boolean DEFAULT false NOT NULL,
    "twoFactorAuthSecret" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserSettings" OWNER TO postgres;

--
-- Name: UserSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UserSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserSettings_id_seq" OWNER TO postgres;

--
-- Name: UserSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UserSettings_id_seq" OWNED BY public."UserSettings".id;


--
-- Name: Warehouse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Warehouse" (
    id integer NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'physical'::text NOT NULL,
    location text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    code text,
    "isDefault" boolean DEFAULT false NOT NULL,
    "productionBaseId" integer
);


ALTER TABLE public."Warehouse" OWNER TO postgres;

--
-- Name: Warehouse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Warehouse_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Warehouse_id_seq" OWNER TO postgres;

--
-- Name: Warehouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Warehouse_id_seq" OWNED BY public."Warehouse".id;


--
-- Name: Workflow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Workflow" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "entityType" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Workflow" OWNER TO postgres;

--
-- Name: WorkflowApproval; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkflowApproval" (
    id text NOT NULL,
    "workflowInstanceId" text NOT NULL,
    "workflowStepId" integer NOT NULL,
    "approverId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    comments text,
    "actionDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkflowApproval" OWNER TO postgres;

--
-- Name: WorkflowInstance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkflowInstance" (
    id text NOT NULL,
    "workflowId" integer NOT NULL,
    "entityId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "initiatedBy" text NOT NULL,
    "initiatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "currentStepNumber" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkflowInstance" OWNER TO postgres;

--
-- Name: WorkflowStep; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkflowStep" (
    id integer NOT NULL,
    "workflowId" integer NOT NULL,
    name text NOT NULL,
    description text,
    "stepNumber" integer NOT NULL,
    "approverType" text NOT NULL,
    "approverId" text,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkflowStep" OWNER TO postgres;

--
-- Name: WorkflowStep_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WorkflowStep_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkflowStep_id_seq" OWNER TO postgres;

--
-- Name: WorkflowStep_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WorkflowStep_id_seq" OWNED BY public."WorkflowStep".id;


--
-- Name: Workflow_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Workflow_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Workflow_id_seq" OWNER TO postgres;

--
-- Name: Workflow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Workflow_id_seq" OWNED BY public."Workflow".id;


--
-- Name: Workshop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Workshop" (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "productId" integer,
    "teacherId" integer NOT NULL,
    "assistantId" integer,
    role text NOT NULL,
    "locationType" text NOT NULL,
    location text NOT NULL,
    participants integer NOT NULL,
    duration double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "activityId" integer,
    "activityType" text,
    "baseType" text,
    "channelId" integer,
    "customerId" integer,
    "depositAmount" double precision DEFAULT 0 NOT NULL,
    "managerId" integer,
    "paymentMethod" text,
    "paymentStatus" text DEFAULT 'unpaid'::text,
    status text DEFAULT 'completed'::text,
    "totalAmount" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."Workshop" OWNER TO postgres;

--
-- Name: WorkshopActivity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkshopActivity" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "productId" integer NOT NULL,
    duration double precision NOT NULL,
    "minParticipants" integer NOT NULL,
    "maxParticipants" integer NOT NULL,
    price double precision NOT NULL,
    "materialFee" double precision DEFAULT 0 NOT NULL,
    "teacherFee" double precision DEFAULT 0 NOT NULL,
    "assistantFee" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkshopActivity" OWNER TO postgres;

--
-- Name: WorkshopActivity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WorkshopActivity_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkshopActivity_id_seq" OWNER TO postgres;

--
-- Name: WorkshopActivity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WorkshopActivity_id_seq" OWNED BY public."WorkshopActivity".id;


--
-- Name: WorkshopPrice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkshopPrice" (
    id integer NOT NULL,
    "activityId" integer,
    "channelId" integer NOT NULL,
    "basePrice" double precision NOT NULL,
    "pricePerPerson" double precision NOT NULL,
    "minParticipants" integer NOT NULL,
    "maxParticipants" integer NOT NULL,
    "materialFee" double precision DEFAULT 0 NOT NULL,
    "teacherFee" double precision DEFAULT 0 NOT NULL,
    "assistantFee" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkshopPrice" OWNER TO postgres;

--
-- Name: WorkshopPrice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WorkshopPrice_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkshopPrice_id_seq" OWNER TO postgres;

--
-- Name: WorkshopPrice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WorkshopPrice_id_seq" OWNED BY public."WorkshopPrice".id;


--
-- Name: WorkshopServiceItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkshopServiceItem" (
    id integer NOT NULL,
    "workshopId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkshopServiceItem" OWNER TO postgres;

--
-- Name: WorkshopServiceItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WorkshopServiceItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkshopServiceItem_id_seq" OWNER TO postgres;

--
-- Name: WorkshopServiceItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WorkshopServiceItem_id_seq" OWNED BY public."WorkshopServiceItem".id;


--
-- Name: WorkshopTeamMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkshopTeamMember" (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    role text NOT NULL,
    specialties text[],
    rating double precision DEFAULT 5.0 NOT NULL,
    "maxWorkshopsPerDay" integer DEFAULT 2 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkshopTeamMember" OWNER TO postgres;

--
-- Name: WorkshopTeamMember_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WorkshopTeamMember_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WorkshopTeamMember_id_seq" OWNER TO postgres;

--
-- Name: WorkshopTeamMember_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WorkshopTeamMember_id_seq" OWNED BY public."WorkshopTeamMember".id;


--
-- Name: Workshop_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Workshop_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Workshop_id_seq" OWNER TO postgres;

--
-- Name: Workshop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Workshop_id_seq" OWNED BY public."Workshop".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: AnnouncementRead id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnnouncementRead" ALTER COLUMN id SET DEFAULT nextval('public."AnnouncementRead_id_seq"'::regclass);


--
-- Name: AuditLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog" ALTER COLUMN id SET DEFAULT nextval('public."AuditLog_id_seq"'::regclass);


--
-- Name: Channel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Channel" ALTER COLUMN id SET DEFAULT nextval('public."Channel_id_seq"'::regclass);


--
-- Name: ChannelDeposit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelDeposit" ALTER COLUMN id SET DEFAULT nextval('public."ChannelDeposit_id_seq"'::regclass);


--
-- Name: ChannelDistribution id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelDistribution" ALTER COLUMN id SET DEFAULT nextval('public."ChannelDistribution_id_seq"'::regclass);


--
-- Name: ChannelInventory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelInventory" ALTER COLUMN id SET DEFAULT nextval('public."ChannelInventory_id_seq"'::regclass);


--
-- Name: ChannelInvoice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelInvoice" ALTER COLUMN id SET DEFAULT nextval('public."ChannelInvoice_id_seq"'::regclass);


--
-- Name: ChannelPrice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelPrice" ALTER COLUMN id SET DEFAULT nextval('public."ChannelPrice_id_seq"'::regclass);


--
-- Name: ChannelSale id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSale" ALTER COLUMN id SET DEFAULT nextval('public."ChannelSale_id_seq"'::regclass);


--
-- Name: ChannelSaleItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSaleItem" ALTER COLUMN id SET DEFAULT nextval('public."ChannelSaleItem_id_seq"'::regclass);


--
-- Name: ChannelSettlement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSettlement" ALTER COLUMN id SET DEFAULT nextval('public."ChannelSettlement_id_seq"'::regclass);


--
-- Name: CoffeeShopItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopItem" ALTER COLUMN id SET DEFAULT nextval('public."CoffeeShopItem_id_seq"'::regclass);


--
-- Name: CoffeeShopPurchase id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopPurchase" ALTER COLUMN id SET DEFAULT nextval('public."CoffeeShopPurchase_id_seq"'::regclass);


--
-- Name: CoffeeShopSale id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopSale" ALTER COLUMN id SET DEFAULT nextval('public."CoffeeShopSale_id_seq"'::regclass);


--
-- Name: CoffeeShopShift id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopShift" ALTER COLUMN id SET DEFAULT nextval('public."CoffeeShopShift_id_seq"'::regclass);


--
-- Name: CompanyProfile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CompanyProfile" ALTER COLUMN id SET DEFAULT nextval('public."CompanyProfile_id_seq"'::regclass);


--
-- Name: Customer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer" ALTER COLUMN id SET DEFAULT nextval('public."Customer_id_seq"'::regclass);


--
-- Name: DataBackup id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataBackup" ALTER COLUMN id SET DEFAULT nextval('public."DataBackup_id_seq"'::regclass);


--
-- Name: DataDictionary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataDictionary" ALTER COLUMN id SET DEFAULT nextval('public."DataDictionary_id_seq"'::regclass);


--
-- Name: DataDictionaryItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataDictionaryItem" ALTER COLUMN id SET DEFAULT nextval('public."DataDictionaryItem_id_seq"'::regclass);


--
-- Name: DataTemplate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataTemplate" ALTER COLUMN id SET DEFAULT nextval('public."DataTemplate_id_seq"'::regclass);


--
-- Name: Employee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee" ALTER COLUMN id SET DEFAULT nextval('public."Employee_id_seq"'::regclass);


--
-- Name: FinancialAccount id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialAccount" ALTER COLUMN id SET DEFAULT nextval('public."FinancialAccount_id_seq"'::regclass);


--
-- Name: FinancialCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialCategory" ALTER COLUMN id SET DEFAULT nextval('public."FinancialCategory_id_seq"'::regclass);


--
-- Name: FinancialTransaction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialTransaction" ALTER COLUMN id SET DEFAULT nextval('public."FinancialTransaction_id_seq"'::regclass);


--
-- Name: GallerySale id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GallerySale" ALTER COLUMN id SET DEFAULT nextval('public."GallerySale_id_seq"'::regclass);


--
-- Name: InventoryItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryItem" ALTER COLUMN id SET DEFAULT nextval('public."InventoryItem_id_seq"'::regclass);


--
-- Name: InventoryTransaction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction" ALTER COLUMN id SET DEFAULT nextval('public."InventoryTransaction_id_seq"'::regclass);


--
-- Name: Order id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order" ALTER COLUMN id SET DEFAULT nextval('public."Order_id_seq"'::regclass);


--
-- Name: OrderItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem" ALTER COLUMN id SET DEFAULT nextval('public."OrderItem_id_seq"'::regclass);


--
-- Name: Permission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission" ALTER COLUMN id SET DEFAULT nextval('public."Permission_id_seq"'::regclass);


--
-- Name: PieceWork id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWork" ALTER COLUMN id SET DEFAULT nextval('public."PieceWork_id_seq"'::regclass);


--
-- Name: PieceWorkDetail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWorkDetail" ALTER COLUMN id SET DEFAULT nextval('public."PieceWorkDetail_id_seq"'::regclass);


--
-- Name: PieceWorkItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWorkItem" ALTER COLUMN id SET DEFAULT nextval('public."PieceWorkItem_id_seq"'::regclass);


--
-- Name: PosSale id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PosSale" ALTER COLUMN id SET DEFAULT nextval('public."PosSale_id_seq"'::regclass);


--
-- Name: PosSaleItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PosSaleItem" ALTER COLUMN id SET DEFAULT nextval('public."PosSaleItem_id_seq"'::regclass);


--
-- Name: PrintTemplate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PrintTemplate" ALTER COLUMN id SET DEFAULT nextval('public."PrintTemplate_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Name: ProductCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory" ALTER COLUMN id SET DEFAULT nextval('public."ProductCategory_id_seq"'::regclass);


--
-- Name: ProductTag id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductTag" ALTER COLUMN id SET DEFAULT nextval('public."ProductTag_id_seq"'::regclass);


--
-- Name: ProductionBase id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionBase" ALTER COLUMN id SET DEFAULT nextval('public."ProductionBase_id_seq"'::regclass);


--
-- Name: ProductionOrder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrder" ALTER COLUMN id SET DEFAULT nextval('public."ProductionOrder_id_seq"'::regclass);


--
-- Name: ProductionOrderItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrderItem" ALTER COLUMN id SET DEFAULT nextval('public."ProductionOrderItem_id_seq"'::regclass);


--
-- Name: PurchaseOrder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder" ALTER COLUMN id SET DEFAULT nextval('public."PurchaseOrder_id_seq"'::regclass);


--
-- Name: PurchaseOrderItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem" ALTER COLUMN id SET DEFAULT nextval('public."PurchaseOrderItem_id_seq"'::regclass);


--
-- Name: QualityRecord id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityRecord" ALTER COLUMN id SET DEFAULT nextval('public."QualityRecord_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: RolePermission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission" ALTER COLUMN id SET DEFAULT nextval('public."RolePermission_id_seq"'::regclass);


--
-- Name: SalaryAdjustment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryAdjustment" ALTER COLUMN id SET DEFAULT nextval('public."SalaryAdjustment_id_seq"'::regclass);


--
-- Name: SalaryRecord id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryRecord" ALTER COLUMN id SET DEFAULT nextval('public."SalaryRecord_id_seq"'::regclass);


--
-- Name: SalesItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesItem" ALTER COLUMN id SET DEFAULT nextval('public."SalesItem_id_seq"'::regclass);


--
-- Name: Schedule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule" ALTER COLUMN id SET DEFAULT nextval('public."Schedule_id_seq"'::regclass);


--
-- Name: ScheduleTemplate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScheduleTemplate" ALTER COLUMN id SET DEFAULT nextval('public."ScheduleTemplate_id_seq"'::regclass);


--
-- Name: ShippingRecord id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShippingRecord" ALTER COLUMN id SET DEFAULT nextval('public."ShippingRecord_id_seq"'::regclass);


--
-- Name: Supplier id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supplier" ALTER COLUMN id SET DEFAULT nextval('public."Supplier_id_seq"'::regclass);


--
-- Name: SystemAnnouncement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemAnnouncement" ALTER COLUMN id SET DEFAULT nextval('public."SystemAnnouncement_id_seq"'::regclass);


--
-- Name: SystemLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemLog" ALTER COLUMN id SET DEFAULT nextval('public."SystemLog_id_seq"'::regclass);


--
-- Name: SystemMetrics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemMetrics" ALTER COLUMN id SET DEFAULT nextval('public."SystemMetrics_id_seq"'::regclass);


--
-- Name: SystemParameter id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemParameter" ALTER COLUMN id SET DEFAULT nextval('public."SystemParameter_id_seq"'::regclass);


--
-- Name: SystemSetting id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSetting" ALTER COLUMN id SET DEFAULT nextval('public."SystemSetting_id_seq"'::regclass);


--
-- Name: UploadedFile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UploadedFile" ALTER COLUMN id SET DEFAULT nextval('public."UploadedFile_id_seq"'::regclass);


--
-- Name: UserLoginHistory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserLoginHistory" ALTER COLUMN id SET DEFAULT nextval('public."UserLoginHistory_id_seq"'::regclass);


--
-- Name: UserRole id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole" ALTER COLUMN id SET DEFAULT nextval('public."UserRole_id_seq"'::regclass);


--
-- Name: UserSettings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSettings" ALTER COLUMN id SET DEFAULT nextval('public."UserSettings_id_seq"'::regclass);


--
-- Name: Warehouse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Warehouse" ALTER COLUMN id SET DEFAULT nextval('public."Warehouse_id_seq"'::regclass);


--
-- Name: Workflow id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workflow" ALTER COLUMN id SET DEFAULT nextval('public."Workflow_id_seq"'::regclass);


--
-- Name: WorkflowStep id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowStep" ALTER COLUMN id SET DEFAULT nextval('public."WorkflowStep_id_seq"'::regclass);


--
-- Name: Workshop id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop" ALTER COLUMN id SET DEFAULT nextval('public."Workshop_id_seq"'::regclass);


--
-- Name: WorkshopActivity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopActivity" ALTER COLUMN id SET DEFAULT nextval('public."WorkshopActivity_id_seq"'::regclass);


--
-- Name: WorkshopPrice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopPrice" ALTER COLUMN id SET DEFAULT nextval('public."WorkshopPrice_id_seq"'::regclass);


--
-- Name: WorkshopServiceItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopServiceItem" ALTER COLUMN id SET DEFAULT nextval('public."WorkshopServiceItem_id_seq"'::regclass);


--
-- Name: WorkshopTeamMember id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopTeamMember" ALTER COLUMN id SET DEFAULT nextval('public."WorkshopTeamMember_id_seq"'::regclass);


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
-- Data for Name: ChannelDistribution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelDistribution" (id, "channelId", "channelInventoryId", quantity, "distributionDate", notes, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChannelInventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelInventory" (id, "channelId", "productId", quantity, "minQuantity", notes, "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: ChannelSettlement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChannelSettlement" (id, "channelId", "settlementNo", "startDate", "endDate", "totalAmount", "paidAmount", status, "paymentDate", "paymentMethod", notes, "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: CoffeeShopSale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CoffeeShopSale" (id, date, "totalSales", notes, "createdAt", "updatedAt", "alipayAmount", "cardAmount", "cashAmount", "customerCount", "otherAmount", "wechatAmount", "employeeId", "paymentMethods") FROM stdin;
2	2024-01-15 00:00:00	150.5	测试销售记录	2025-05-27 07:33:11.08	2025-05-27 07:33:11.08	0	0	0	8	0	0	1	{"cash":50,"wechat":60.5,"alipay":40,"card":0}
3	2025-05-27 12:38:58.395	1000		2025-05-27 12:39:07.637	2025-05-27 12:39:07.637	0	0	1000	0	0	0	\N	\N
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
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Employee" (id, name, "position", phone, email, "dailySalary", status, "createdAt", "updatedAt") FROM stdin;
1	测试员工	咖啡师	13800138000	test@example.com	200	active	2025-05-27 07:32:59.969	2025-05-27 07:32:59.969
2	伍尚明	店长	\N	simon@linghuaart.com	100	active	2025-05-27 10:25:35.888	2025-05-27 10:25:35.888
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
-- Data for Name: PieceWorkDetail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PieceWorkDetail" (id, "pieceWorkId", "pieceWorkItemId", quantity, price, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PieceWorkItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PieceWorkItem" (id, name, price, type, "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, price, "commissionRate", type, "createdAt", "updatedAt", description, "imageUrl", barcode, category, cost, sku, "categoryId", details, dimensions, "imageUrls", inventory, material, unit) FROM stdin;
2	定制掐丝珐琅花瓶	1200	0	product	2025-05-27 08:50:03.995	2025-05-27 08:50:03.995	手工制作的掐丝珐琅花瓶，可定制图案和颜色	\N	\N	\N	600	CUSTOM-VASE-001	\N	\N	\N	{}	\N	\N	\N
13	件 单位	0	0	unit_placeholder	2025-05-27 22:49:17.464	2025-05-27 22:49:17.464	件 单位的占位产品	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	件
14	铜胎 材料	0	0	material_placeholder	2025-05-27 22:49:28.56	2025-05-27 22:49:28.56	铜胎 材料的占位产品	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	铜胎	\N
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, name, code, description, "imageUrl", "isActive", "sortOrder", "parentId", level, path, "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: SalaryAdjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalaryAdjustment" (id, "employeeId", "adjustmentDate", "oldSalary", "newSalary", reason, "approvedBy", notes, "createdAt", "updatedAt", "salaryRecordId") FROM stdin;
\.


--
-- Data for Name: SalaryRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalaryRecord" (id, "employeeId", year, month, "baseSalary", "scheduleSalary", "salesCommission", "pieceWorkIncome", "workshopIncome", "coffeeShiftCommission", "overtimePay", bonus, deductions, "socialInsurance", tax, "totalIncome", "netIncome", status, "paymentDate", notes, "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Supplier" (id, name, "contactPerson", phone, email, address, description, "isActive", "supplierType", "createdAt", "updatedAt") FROM stdin;
1	人22	\N	\N	\N	\N	\N	t	material	2025-05-27 10:32:39.114	2025-05-27 10:32:39.114
\.


--
-- Data for Name: SystemAnnouncement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemAnnouncement" (id, title, content, type, priority, "targetUsers", "displayType", "startTime", "endTime", "isActive", "requireRead", "createdBy", "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, "createdAt", "updatedAt", bio, "employeeId", "lastLogin", phone, "resetToken", "resetTokenExpiry", roles, "passwordLastChanged", "failedLoginAttempts", "lockedUntil") FROM stdin;
cmb6der6000016w3ills0rhxb	伍尚明	simon@linghuaart.com	\N	\N	$2b$12$QBUROGfuakCGI45UDPnij.g8/GvyRViJhhYg.wtTxdpvmYxAIKD5y	manager	2025-05-27 10:25:36.264	2025-05-27 11:03:42.739	\N	2	\N	\N	\N	\N	{}	\N	0	\N
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
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Warehouse" (id, name, type, location, description, "isActive", "createdAt", "updatedAt", code, "isDefault", "productionBaseId") FROM stdin;
1	测试仓库_1748343727080	physical	测试位置	\N	t	2025-05-27 11:02:07.081	2025-05-27 11:02:07.081	\N	f	\N
\.


--
-- Data for Name: Workflow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Workflow" (id, code, name, description, "entityType", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowApproval; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkflowApproval" (id, "workflowInstanceId", "workflowStepId", "approverId", status, comments, "actionDate", "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: Workshop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Workshop" (id, date, "productId", "teacherId", "assistantId", role, "locationType", location, participants, duration, notes, "createdAt", "updatedAt", "activityId", "activityType", "baseType", "channelId", "customerId", "depositAmount", "managerId", "paymentMethod", "paymentStatus", status, "totalAmount") FROM stdin;
\.


--
-- Data for Name: WorkshopActivity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkshopActivity" (id, name, description, "productId", duration, "minParticipants", "maxParticipants", price, "materialFee", "teacherFee", "assistantFee", "isActive", "createdAt", "updatedAt") FROM stdin;
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
-- Name: AnnouncementRead AnnouncementRead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnnouncementRead"
    ADD CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ChannelDeposit ChannelDeposit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelDeposit"
    ADD CONSTRAINT "ChannelDeposit_pkey" PRIMARY KEY (id);


--
-- Name: ChannelDistribution ChannelDistribution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelDistribution"
    ADD CONSTRAINT "ChannelDistribution_pkey" PRIMARY KEY (id);


--
-- Name: ChannelInventory ChannelInventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelInventory"
    ADD CONSTRAINT "ChannelInventory_pkey" PRIMARY KEY (id);


--
-- Name: ChannelInvoice ChannelInvoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelInvoice"
    ADD CONSTRAINT "ChannelInvoice_pkey" PRIMARY KEY (id);


--
-- Name: ChannelPrice ChannelPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelPrice"
    ADD CONSTRAINT "ChannelPrice_pkey" PRIMARY KEY (id);


--
-- Name: ChannelSaleItem ChannelSaleItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSaleItem"
    ADD CONSTRAINT "ChannelSaleItem_pkey" PRIMARY KEY (id);


--
-- Name: ChannelSale ChannelSale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSale"
    ADD CONSTRAINT "ChannelSale_pkey" PRIMARY KEY (id);


--
-- Name: ChannelSettlement ChannelSettlement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSettlement"
    ADD CONSTRAINT "ChannelSettlement_pkey" PRIMARY KEY (id);


--
-- Name: Channel Channel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Channel"
    ADD CONSTRAINT "Channel_pkey" PRIMARY KEY (id);


--
-- Name: CoffeeShopItem CoffeeShopItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopItem"
    ADD CONSTRAINT "CoffeeShopItem_pkey" PRIMARY KEY (id);


--
-- Name: CoffeeShopPurchase CoffeeShopPurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopPurchase"
    ADD CONSTRAINT "CoffeeShopPurchase_pkey" PRIMARY KEY (id);


--
-- Name: CoffeeShopSale CoffeeShopSale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopSale"
    ADD CONSTRAINT "CoffeeShopSale_pkey" PRIMARY KEY (id);


--
-- Name: CoffeeShopShift CoffeeShopShift_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopShift"
    ADD CONSTRAINT "CoffeeShopShift_pkey" PRIMARY KEY (id);


--
-- Name: CompanyProfile CompanyProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CompanyProfile"
    ADD CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DashboardLayout DashboardLayout_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DashboardLayout"
    ADD CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY (id);


--
-- Name: DataBackup DataBackup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataBackup"
    ADD CONSTRAINT "DataBackup_pkey" PRIMARY KEY (id);


--
-- Name: DataDictionaryItem DataDictionaryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataDictionaryItem"
    ADD CONSTRAINT "DataDictionaryItem_pkey" PRIMARY KEY (id);


--
-- Name: DataDictionary DataDictionary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataDictionary"
    ADD CONSTRAINT "DataDictionary_pkey" PRIMARY KEY (id);


--
-- Name: DataTemplate DataTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataTemplate"
    ADD CONSTRAINT "DataTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: FinancialAccount FinancialAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialAccount"
    ADD CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY (id);


--
-- Name: FinancialCategory FinancialCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialCategory"
    ADD CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY (id);


--
-- Name: FinancialTransaction FinancialTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialTransaction"
    ADD CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY (id);


--
-- Name: GallerySale GallerySale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GallerySale"
    ADD CONSTRAINT "GallerySale_pkey" PRIMARY KEY (id);


--
-- Name: InventoryItem InventoryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_pkey" PRIMARY KEY (id);


--
-- Name: InventoryTransaction InventoryTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY (id);


--
-- Name: MessageRecipient MessageRecipient_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageRecipient"
    ADD CONSTRAINT "MessageRecipient_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: PieceWorkDetail PieceWorkDetail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWorkDetail"
    ADD CONSTRAINT "PieceWorkDetail_pkey" PRIMARY KEY (id);


--
-- Name: PieceWorkItem PieceWorkItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWorkItem"
    ADD CONSTRAINT "PieceWorkItem_pkey" PRIMARY KEY (id);


--
-- Name: PieceWork PieceWork_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWork"
    ADD CONSTRAINT "PieceWork_pkey" PRIMARY KEY (id);


--
-- Name: PosSaleItem PosSaleItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PosSaleItem"
    ADD CONSTRAINT "PosSaleItem_pkey" PRIMARY KEY (id);


--
-- Name: PosSale PosSale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PosSale"
    ADD CONSTRAINT "PosSale_pkey" PRIMARY KEY (id);


--
-- Name: PrintTemplate PrintTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PrintTemplate"
    ADD CONSTRAINT "PrintTemplate_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: ProductTag ProductTag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductTag"
    ADD CONSTRAINT "ProductTag_pkey" PRIMARY KEY (id);


--
-- Name: ProductTagsOnProducts ProductTagsOnProducts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductTagsOnProducts"
    ADD CONSTRAINT "ProductTagsOnProducts_pkey" PRIMARY KEY ("productId", "tagId");


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: ProductionBase ProductionBase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionBase"
    ADD CONSTRAINT "ProductionBase_pkey" PRIMARY KEY (id);


--
-- Name: ProductionOrderItem ProductionOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrderItem"
    ADD CONSTRAINT "ProductionOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: ProductionOrder ProductionOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrder"
    ADD CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrderItem PurchaseOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: QualityRecord QualityRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityRecord"
    ADD CONSTRAINT "QualityRecord_pkey" PRIMARY KEY (id);


--
-- Name: ReportConfig ReportConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReportConfig"
    ADD CONSTRAINT "ReportConfig_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SalaryAdjustment SalaryAdjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryAdjustment"
    ADD CONSTRAINT "SalaryAdjustment_pkey" PRIMARY KEY (id);


--
-- Name: SalaryRecord SalaryRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryRecord"
    ADD CONSTRAINT "SalaryRecord_pkey" PRIMARY KEY (id);


--
-- Name: SalesItem SalesItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesItem"
    ADD CONSTRAINT "SalesItem_pkey" PRIMARY KEY (id);


--
-- Name: ScheduleTemplate ScheduleTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScheduleTemplate"
    ADD CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Schedule Schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_pkey" PRIMARY KEY (id);


--
-- Name: ShippingRecord ShippingRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShippingRecord"
    ADD CONSTRAINT "ShippingRecord_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: SystemAnnouncement SystemAnnouncement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemAnnouncement"
    ADD CONSTRAINT "SystemAnnouncement_pkey" PRIMARY KEY (id);


--
-- Name: SystemLog SystemLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemLog"
    ADD CONSTRAINT "SystemLog_pkey" PRIMARY KEY (id);


--
-- Name: SystemMetrics SystemMetrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemMetrics"
    ADD CONSTRAINT "SystemMetrics_pkey" PRIMARY KEY (id);


--
-- Name: SystemParameter SystemParameter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemParameter"
    ADD CONSTRAINT "SystemParameter_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (id);


--
-- Name: Todo Todo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Todo"
    ADD CONSTRAINT "Todo_pkey" PRIMARY KEY (id);


--
-- Name: UploadedFile UploadedFile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UploadedFile"
    ADD CONSTRAINT "UploadedFile_pkey" PRIMARY KEY (id);


--
-- Name: UserFavorite UserFavorite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserFavorite"
    ADD CONSTRAINT "UserFavorite_pkey" PRIMARY KEY (id);


--
-- Name: UserLoginHistory UserLoginHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserLoginHistory"
    ADD CONSTRAINT "UserLoginHistory_pkey" PRIMARY KEY (id);


--
-- Name: UserPreference UserPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (id);


--
-- Name: UserSettings UserSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSettings"
    ADD CONSTRAINT "UserSettings_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Warehouse Warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowApproval WorkflowApproval_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowApproval"
    ADD CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowInstance WorkflowInstance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowInstance"
    ADD CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowStep WorkflowStep_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowStep"
    ADD CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY (id);


--
-- Name: Workflow Workflow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workflow"
    ADD CONSTRAINT "Workflow_pkey" PRIMARY KEY (id);


--
-- Name: WorkshopActivity WorkshopActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopActivity"
    ADD CONSTRAINT "WorkshopActivity_pkey" PRIMARY KEY (id);


--
-- Name: WorkshopPrice WorkshopPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopPrice"
    ADD CONSTRAINT "WorkshopPrice_pkey" PRIMARY KEY (id);


--
-- Name: WorkshopServiceItem WorkshopServiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopServiceItem"
    ADD CONSTRAINT "WorkshopServiceItem_pkey" PRIMARY KEY (id);


--
-- Name: WorkshopTeamMember WorkshopTeamMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopTeamMember"
    ADD CONSTRAINT "WorkshopTeamMember_pkey" PRIMARY KEY (id);


--
-- Name: Workshop Workshop_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop"
    ADD CONSTRAINT "Workshop_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AnnouncementRead_announcementId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON public."AnnouncementRead" USING btree ("announcementId", "userId");


--
-- Name: AnnouncementRead_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnnouncementRead_userId_idx" ON public."AnnouncementRead" USING btree ("userId");


--
-- Name: ChannelInventory_channelId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ChannelInventory_channelId_productId_key" ON public."ChannelInventory" USING btree ("channelId", "productId");


--
-- Name: ChannelPrice_channelId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ChannelPrice_channelId_productId_key" ON public."ChannelPrice" USING btree ("channelId", "productId");


--
-- Name: ChannelSettlement_settlementNo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ChannelSettlement_settlementNo_key" ON public."ChannelSettlement" USING btree ("settlementNo");


--
-- Name: Channel_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Channel_code_key" ON public."Channel" USING btree (code);


--
-- Name: CompanyProfile_companyName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CompanyProfile_companyName_idx" ON public."CompanyProfile" USING btree ("companyName");


--
-- Name: DashboardLayout_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DashboardLayout_userId_idx" ON public."DashboardLayout" USING btree ("userId");


--
-- Name: DataBackup_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataBackup_createdBy_idx" ON public."DataBackup" USING btree ("createdBy");


--
-- Name: DataBackup_startTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataBackup_startTime_idx" ON public."DataBackup" USING btree ("startTime");


--
-- Name: DataBackup_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataBackup_status_idx" ON public."DataBackup" USING btree (status);


--
-- Name: DataDictionaryItem_dictionaryId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DataDictionaryItem_dictionaryId_code_key" ON public."DataDictionaryItem" USING btree ("dictionaryId", code);


--
-- Name: DataDictionary_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DataDictionary_code_key" ON public."DataDictionary" USING btree (code);


--
-- Name: DataTemplate_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataTemplate_isActive_idx" ON public."DataTemplate" USING btree ("isActive");


--
-- Name: DataTemplate_module_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataTemplate_module_idx" ON public."DataTemplate" USING btree (module);


--
-- Name: DataTemplate_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataTemplate_type_idx" ON public."DataTemplate" USING btree (type);


--
-- Name: FinancialCategory_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FinancialCategory_code_key" ON public."FinancialCategory" USING btree (code);


--
-- Name: MessageRecipient_messageId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MessageRecipient_messageId_userId_key" ON public."MessageRecipient" USING btree ("messageId", "userId");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Permission_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Permission_code_key" ON public."Permission" USING btree (code);


--
-- Name: PrintTemplate_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PrintTemplate_isActive_idx" ON public."PrintTemplate" USING btree ("isActive");


--
-- Name: PrintTemplate_isDefault_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PrintTemplate_isDefault_idx" ON public."PrintTemplate" USING btree ("isDefault");


--
-- Name: PrintTemplate_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PrintTemplate_type_idx" ON public."PrintTemplate" USING btree (type);


--
-- Name: ProductTag_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductTag_name_key" ON public."ProductTag" USING btree (name);


--
-- Name: ProductTagsOnProducts_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductTagsOnProducts_productId_idx" ON public."ProductTagsOnProducts" USING btree ("productId");


--
-- Name: ProductTagsOnProducts_tagId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductTagsOnProducts_tagId_idx" ON public."ProductTagsOnProducts" USING btree ("tagId");


--
-- Name: ProductionBase_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductionBase_code_key" ON public."ProductionBase" USING btree (code);


--
-- Name: ProductionOrder_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductionOrder_orderNumber_key" ON public."ProductionOrder" USING btree ("orderNumber");


--
-- Name: PurchaseOrder_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON public."PurchaseOrder" USING btree ("orderNumber");


--
-- Name: ReportConfig_userId_reportType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReportConfig_userId_reportType_idx" ON public."ReportConfig" USING btree ("userId", "reportType");


--
-- Name: RolePermission_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON public."RolePermission" USING btree ("roleId", "permissionId");


--
-- Name: Role_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_code_key" ON public."Role" USING btree (code);


--
-- Name: SalaryRecord_employeeId_year_month_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SalaryRecord_employeeId_year_month_key" ON public."SalaryRecord" USING btree ("employeeId", year, month);


--
-- Name: SystemAnnouncement_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemAnnouncement_isActive_idx" ON public."SystemAnnouncement" USING btree ("isActive");


--
-- Name: SystemAnnouncement_startTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemAnnouncement_startTime_idx" ON public."SystemAnnouncement" USING btree ("startTime");


--
-- Name: SystemAnnouncement_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemAnnouncement_type_idx" ON public."SystemAnnouncement" USING btree (type);


--
-- Name: SystemLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemLog_createdAt_idx" ON public."SystemLog" USING btree ("createdAt");


--
-- Name: SystemLog_level_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemLog_level_idx" ON public."SystemLog" USING btree (level);


--
-- Name: SystemLog_module_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemLog_module_idx" ON public."SystemLog" USING btree (module);


--
-- Name: SystemLog_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemLog_timestamp_idx" ON public."SystemLog" USING btree ("timestamp");


--
-- Name: SystemLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemLog_userId_idx" ON public."SystemLog" USING btree ("userId");


--
-- Name: SystemMetrics_metricType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemMetrics_metricType_idx" ON public."SystemMetrics" USING btree ("metricType");


--
-- Name: SystemMetrics_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemMetrics_status_idx" ON public."SystemMetrics" USING btree (status);


--
-- Name: SystemMetrics_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemMetrics_timestamp_idx" ON public."SystemMetrics" USING btree ("timestamp");


--
-- Name: SystemParameter_group_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemParameter_group_idx" ON public."SystemParameter" USING btree ("group");


--
-- Name: SystemParameter_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemParameter_key_idx" ON public."SystemParameter" USING btree (key);


--
-- Name: SystemParameter_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SystemParameter_key_key" ON public."SystemParameter" USING btree (key);


--
-- Name: UserFavorite_userId_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserFavorite_userId_category_idx" ON public."UserFavorite" USING btree ("userId", category);


--
-- Name: UserFavorite_userId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserFavorite_userId_type_idx" ON public."UserFavorite" USING btree ("userId", type);


--
-- Name: UserPreference_userId_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserPreference_userId_category_idx" ON public."UserPreference" USING btree ("userId", category);


--
-- Name: UserPreference_userId_category_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserPreference_userId_category_key_key" ON public."UserPreference" USING btree ("userId", category, key);


--
-- Name: UserRole_userId_roleId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON public."UserRole" USING btree ("userId", "roleId");


--
-- Name: UserSettings_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserSettings_userId_key" ON public."UserSettings" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_employeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_employeeId_key" ON public."User" USING btree ("employeeId");


--
-- Name: Workflow_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Workflow_code_key" ON public."Workflow" USING btree (code);


--
-- Name: WorkshopPrice_activityId_channelId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WorkshopPrice_activityId_channelId_key" ON public."WorkshopPrice" USING btree ("activityId", "channelId");


--
-- Name: WorkshopTeamMember_employeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WorkshopTeamMember_employeeId_key" ON public."WorkshopTeamMember" USING btree ("employeeId");


--
-- Name: AnnouncementRead AnnouncementRead_announcementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnnouncementRead"
    ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES public."SystemAnnouncement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChannelDeposit ChannelDeposit_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelDeposit"
    ADD CONSTRAINT "ChannelDeposit_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelDistribution ChannelDistribution_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelDistribution"
    ADD CONSTRAINT "ChannelDistribution_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelDistribution ChannelDistribution_channelInventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelDistribution"
    ADD CONSTRAINT "ChannelDistribution_channelInventoryId_fkey" FOREIGN KEY ("channelInventoryId") REFERENCES public."ChannelInventory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelInventory ChannelInventory_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelInventory"
    ADD CONSTRAINT "ChannelInventory_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelInventory ChannelInventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelInventory"
    ADD CONSTRAINT "ChannelInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelInvoice ChannelInvoice_settlementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelInvoice"
    ADD CONSTRAINT "ChannelInvoice_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES public."ChannelSettlement"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelPrice ChannelPrice_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelPrice"
    ADD CONSTRAINT "ChannelPrice_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelPrice ChannelPrice_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelPrice"
    ADD CONSTRAINT "ChannelPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelSaleItem ChannelSaleItem_channelInventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSaleItem"
    ADD CONSTRAINT "ChannelSaleItem_channelInventoryId_fkey" FOREIGN KEY ("channelInventoryId") REFERENCES public."ChannelInventory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelSaleItem ChannelSaleItem_channelSaleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSaleItem"
    ADD CONSTRAINT "ChannelSaleItem_channelSaleId_fkey" FOREIGN KEY ("channelSaleId") REFERENCES public."ChannelSale"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChannelSaleItem ChannelSaleItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSaleItem"
    ADD CONSTRAINT "ChannelSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelSale ChannelSale_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSale"
    ADD CONSTRAINT "ChannelSale_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChannelSale ChannelSale_settlementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSale"
    ADD CONSTRAINT "ChannelSale_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES public."ChannelSettlement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChannelSettlement ChannelSettlement_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelSettlement"
    ADD CONSTRAINT "ChannelSettlement_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CoffeeShopItem CoffeeShopItem_coffeeShopSaleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopItem"
    ADD CONSTRAINT "CoffeeShopItem_coffeeShopSaleId_fkey" FOREIGN KEY ("coffeeShopSaleId") REFERENCES public."CoffeeShopSale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CoffeeShopPurchase CoffeeShopPurchase_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopPurchase"
    ADD CONSTRAINT "CoffeeShopPurchase_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CoffeeShopSale CoffeeShopSale_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopSale"
    ADD CONSTRAINT "CoffeeShopSale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CoffeeShopShift CoffeeShopShift_coffeeShopSaleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopShift"
    ADD CONSTRAINT "CoffeeShopShift_coffeeShopSaleId_fkey" FOREIGN KEY ("coffeeShopSaleId") REFERENCES public."CoffeeShopSale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CoffeeShopShift CoffeeShopShift_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CoffeeShopShift"
    ADD CONSTRAINT "CoffeeShopShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DashboardLayout DashboardLayout_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DashboardLayout"
    ADD CONSTRAINT "DashboardLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DataDictionaryItem DataDictionaryItem_dictionaryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataDictionaryItem"
    ADD CONSTRAINT "DataDictionaryItem_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES public."DataDictionary"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FinancialCategory FinancialCategory_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialCategory"
    ADD CONSTRAINT "FinancialCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."FinancialCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialTransaction FinancialTransaction_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialTransaction"
    ADD CONSTRAINT "FinancialTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."FinancialAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FinancialTransaction FinancialTransaction_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinancialTransaction"
    ADD CONSTRAINT "FinancialTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."FinancialCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GallerySale GallerySale_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GallerySale"
    ADD CONSTRAINT "GallerySale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryItem InventoryItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryItem InventoryItem_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryTransaction InventoryTransaction_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryTransaction InventoryTransaction_relatedTransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES public."InventoryTransaction"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryTransaction InventoryTransaction_sourceWarehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryTransaction InventoryTransaction_targetWarehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_targetWarehouseId_fkey" FOREIGN KEY ("targetWarehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MessageRecipient MessageRecipient_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageRecipient"
    ADD CONSTRAINT "MessageRecipient_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageRecipient MessageRecipient_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageRecipient"
    ADD CONSTRAINT "MessageRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PieceWorkDetail PieceWorkDetail_pieceWorkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWorkDetail"
    ADD CONSTRAINT "PieceWorkDetail_pieceWorkId_fkey" FOREIGN KEY ("pieceWorkId") REFERENCES public."PieceWork"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PieceWorkDetail PieceWorkDetail_pieceWorkItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWorkDetail"
    ADD CONSTRAINT "PieceWorkDetail_pieceWorkItemId_fkey" FOREIGN KEY ("pieceWorkItemId") REFERENCES public."PieceWorkItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PieceWork PieceWork_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceWork"
    ADD CONSTRAINT "PieceWork_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PosSaleItem PosSaleItem_posSaleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PosSaleItem"
    ADD CONSTRAINT "PosSaleItem_posSaleId_fkey" FOREIGN KEY ("posSaleId") REFERENCES public."PosSale"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PosSaleItem PosSaleItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PosSaleItem"
    ADD CONSTRAINT "PosSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PosSale PosSale_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PosSale"
    ADD CONSTRAINT "PosSale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductCategory ProductCategory_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductTagsOnProducts ProductTagsOnProducts_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductTagsOnProducts"
    ADD CONSTRAINT "ProductTagsOnProducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductTagsOnProducts ProductTagsOnProducts_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductTagsOnProducts"
    ADD CONSTRAINT "ProductTagsOnProducts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."ProductTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductionOrderItem ProductionOrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrderItem"
    ADD CONSTRAINT "ProductionOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductionOrderItem ProductionOrderItem_productionOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrderItem"
    ADD CONSTRAINT "ProductionOrderItem_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES public."ProductionOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductionOrder ProductionOrder_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrder"
    ADD CONSTRAINT "ProductionOrder_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductionOrder ProductionOrder_productionBaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionOrder"
    ADD CONSTRAINT "ProductionOrder_productionBaseId_fkey" FOREIGN KEY ("productionBaseId") REFERENCES public."ProductionBase"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrder PurchaseOrder_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrder PurchaseOrder_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QualityRecord QualityRecord_inspectorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityRecord"
    ADD CONSTRAINT "QualityRecord_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QualityRecord QualityRecord_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityRecord"
    ADD CONSTRAINT "QualityRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QualityRecord QualityRecord_productionBaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityRecord"
    ADD CONSTRAINT "QualityRecord_productionBaseId_fkey" FOREIGN KEY ("productionBaseId") REFERENCES public."ProductionBase"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QualityRecord QualityRecord_productionOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityRecord"
    ADD CONSTRAINT "QualityRecord_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES public."ProductionOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReportConfig ReportConfig_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReportConfig"
    ADD CONSTRAINT "ReportConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalaryAdjustment SalaryAdjustment_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryAdjustment"
    ADD CONSTRAINT "SalaryAdjustment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalaryAdjustment SalaryAdjustment_salaryRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryAdjustment"
    ADD CONSTRAINT "SalaryAdjustment_salaryRecordId_fkey" FOREIGN KEY ("salaryRecordId") REFERENCES public."SalaryRecord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SalaryRecord SalaryRecord_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryRecord"
    ADD CONSTRAINT "SalaryRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesItem SalesItem_gallerySaleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesItem"
    ADD CONSTRAINT "SalesItem_gallerySaleId_fkey" FOREIGN KEY ("gallerySaleId") REFERENCES public."GallerySale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesItem SalesItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesItem"
    ADD CONSTRAINT "SalesItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Schedule Schedule_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ShippingRecord ShippingRecord_productionOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShippingRecord"
    ADD CONSTRAINT "ShippingRecord_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES public."ProductionOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Todo Todo_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Todo"
    ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UploadedFile UploadedFile_gallerySaleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UploadedFile"
    ADD CONSTRAINT "UploadedFile_gallerySaleId_fkey" FOREIGN KEY ("gallerySaleId") REFERENCES public."GallerySale"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserFavorite UserFavorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserFavorite"
    ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserLoginHistory UserLoginHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserLoginHistory"
    ADD CONSTRAINT "UserLoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserPreference UserPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSettings UserSettings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSettings"
    ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkflowApproval WorkflowApproval_workflowInstanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowApproval"
    ADD CONSTRAINT "WorkflowApproval_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES public."WorkflowInstance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowApproval WorkflowApproval_workflowStepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowApproval"
    ADD CONSTRAINT "WorkflowApproval_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES public."WorkflowStep"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkflowInstance WorkflowInstance_workflowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowInstance"
    ADD CONSTRAINT "WorkflowInstance_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES public."Workflow"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkflowStep WorkflowStep_workflowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowStep"
    ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES public."Workflow"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkshopActivity WorkshopActivity_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopActivity"
    ADD CONSTRAINT "WorkshopActivity_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkshopPrice WorkshopPrice_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopPrice"
    ADD CONSTRAINT "WorkshopPrice_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."WorkshopActivity"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkshopPrice WorkshopPrice_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopPrice"
    ADD CONSTRAINT "WorkshopPrice_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkshopServiceItem WorkshopServiceItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopServiceItem"
    ADD CONSTRAINT "WorkshopServiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkshopServiceItem WorkshopServiceItem_workshopId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopServiceItem"
    ADD CONSTRAINT "WorkshopServiceItem_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES public."Workshop"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkshopTeamMember WorkshopTeamMember_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkshopTeamMember"
    ADD CONSTRAINT "WorkshopTeamMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Workshop Workshop_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop"
    ADD CONSTRAINT "Workshop_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."WorkshopActivity"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Workshop Workshop_assistantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop"
    ADD CONSTRAINT "Workshop_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Workshop Workshop_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop"
    ADD CONSTRAINT "Workshop_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Workshop Workshop_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop"
    ADD CONSTRAINT "Workshop_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Workshop Workshop_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop"
    ADD CONSTRAINT "Workshop_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Workshop Workshop_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workshop"
    ADD CONSTRAINT "Workshop_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

