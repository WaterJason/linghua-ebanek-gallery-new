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

