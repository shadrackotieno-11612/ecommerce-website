import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import {
  User,
  Category,
  Product,
  Service,
  Order,
  PaymentTransaction,
  SupportedLanguage,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

// Warning if DATABASE_URL is not set in production mode
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn(
    '[Database Warning] DATABASE_URL environment variable is not configured. The app will boot using in-memory storage until DATABASE_URL is set.'
  );
}

export let pgPool: pg.Pool | null = null;
let isInitialized = false;

export function getPgPool(): pg.Pool | null {
  if (pgPool) return pgPool;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    try {
      pgPool = new Pool({
        connectionString,
        ssl:
          process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : undefined,
      });
      return pgPool;
    } catch (err) {
      console.error('[PostgreSQL] Failed to initialize pool with DATABASE_URL:', err);
      return null;
    }
  }

  // Fallback to individual parameters if present
  if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME) {
    try {
      pgPool = new Pool({
        host: process.env.SQL_HOST,
        port: Number(process.env.SQL_PORT || 5432),
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
      });
      return pgPool;
    } catch (err) {
      console.error('[PostgreSQL] Failed to initialize pool with host parameters:', err);
      return null;
    }
  }

  return null;
}

// In-memory fallback state used only in local development when DATABASE_URL is not set
interface MemoryDatabaseState {
  users: (User & { passwordHash: string })[];
  categories: Category[];
  products: Product[];
  services: Service[];
  orders: Order[];
  payments: PaymentTransaction[];
  wishlists: Record<string, string[]>;
  carts: Record<string, { itemId: string; itemType: 'product' | 'service'; quantity: number }[]>;
}

const memoryDb: MemoryDatabaseState = {
  users: [],
  categories: [],
  products: [],
  services: [],
  orders: [],
  payments: [],
  wishlists: {},
  carts: {},
};

// Seed catalog definition (Categories, Products, Services)
export function getCatalogSeedData() {
  const initialCategories: Category[] = [
    {
      id: 'cat_coffee',
      slug: 'coffee-tea',
      icon: 'Coffee',
      type: 'product',
      name: {
        en: 'Kenyan Coffee & Tea',
        sw: 'Kahawa na Chai ya Kenya',
        lg: 'Emmwanyi ne Caayi wa Kenya',
        zh: '肯尼亚咖啡与高山茶',
        es: 'Café y Té de Kenia',
        pt: 'Café e Chá do Quênia',
      },
    },
    {
      id: 'cat_crafts',
      slug: 'crafts-art',
      icon: 'Palette',
      type: 'product',
      name: {
        en: 'Handmade Crafts & Art',
        sw: 'Sanaa na Vitu vya Mikono',
        lg: "Eby'emikono n'Ebiwandiiko",
        zh: '传统手工艺与石雕艺术',
        es: 'Artesanías y Arte Hecho a Mano',
        pt: 'Artesanato e Esculturas Manuais',
      },
    },
    {
      id: 'cat_textiles',
      slug: 'textiles-fashion',
      icon: 'Shirt',
      type: 'product',
      name: {
        en: 'Kitenge & Fashion',
        sw: 'Mavazi ya Kitenge na Mitindo',
        lg: "Engoye za Kitenge n'Emisono",
        zh: '基滕格特色服饰与配饰',
        es: 'Moda y Tejidos Kitenge',
        pt: 'Moda e Tecidos Kitenge',
      },
    },
    {
      id: 'cat_organic',
      slug: 'organic-produce',
      icon: 'Apple',
      type: 'product',
      name: {
        en: 'Organic Farm Goods',
        sw: 'Mazao Halisi ya Kilimo',
        lg: 'Ebirime Ebitononde',
        zh: '有机天然坚果与蜂蜜',
        es: 'Productos Orgánicos del Campo',
        pt: 'Produtos Agrícolas Orgânicos',
      },
    },
    {
      id: 'cat_safari',
      slug: 'safari-tourism',
      icon: 'Compass',
      type: 'service',
      name: {
        en: 'Safari & Tour Guides',
        sw: 'Safari na Miongozo ya Watalii',
        lg: "Engendo za Safari n'Abakulembeze",
        zh: '野生动物游猎与向导',
        es: 'Safaris y Guías Turísticos',
        pt: 'Safáris e Guias Turísticos',
      },
    },
    {
      id: 'cat_business',
      slug: 'business-consulting',
      icon: 'Briefcase',
      type: 'service',
      name: {
        en: 'Business & Professional Services',
        sw: 'Huduma za Kibiashara na Wataalamu',
        lg: "Empeereza z'Abakugu n'Ebyobusuubuzi",
        zh: '商务咨询与本地化服务',
        es: 'Servicios Profesionales y Negocios',
        pt: 'Serviços Profissionais e Negócios',
      },
    },
  ];

  const initialProducts: Product[] = [
    {
      id: 'prod_001',
      sku: 'ZWD-COF-001',
      slug: 'kenyan-aa-nyeri-coffee-500g',
      name: {
        en: 'Kenyan AA Single-Origin Coffee Beans (500g)',
        sw: 'Kahawa ya Kenya AA Asili ya Nyeri (Gramu 500)',
        lg: 'Emmwanyi ya Kenya AA ey’e Nyeri (Gulaamu 500)',
        zh: '肯尼亚 AA 级涅里高地单一产区咖啡豆 (500克)',
        es: 'Café de Origen Único Kenia AA Nyeri (500g)',
        pt: 'Café de Origem Única Quênia AA Nyeri (500g)',
      },
      description: {
        en: 'Hand-picked from the volcanic slopes of Mount Kenya, featuring bright blackcurrant acidity, floral notes, and a silky caramel finish. Medium-dark roast.',
        sw: 'Imevunwa kwa mikono kutoka kwenye miteremko ya volkano ya Mlima Kenya, ikiwa na ladha ya kipekee ya matunda, harufu nzuri ya maua, na utamu laini wa karameli.',
        lg: 'Yanoleddwa n’emikono ku nsozi za Mount Kenya, erina akawoowo ak’ebibala, n’obusunguwavu obulungi obw’ekikugu.',
        zh: '采自肯尼亚火山斜坡优质庄园，手选全红樱桃水洗处理，洋溢着经典的黑加仑明亮果酸与焦糖回甘，中深烘焙。',
        es: 'Cosechado a mano en las faldas volcánicas del Monte Kenia, con brillante acidez a grosella negra, notas florales y suave final a caramelo.',
        pt: 'Colhido à mão nas encostas vulcânicas do Monte Quênia, com acidez brilhante de cassis, notas florais e final aveludado de caramelo.',
      },
      price: 1850,
      discountPrice: 1650,
      images: [
        'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_coffee',
      categoryName: 'Kenyan Coffee & Tea',
      stockQuantity: 45,
      isAvailable: true,
      featured: true,
      rating: 4.9,
      reviewCount: 42,
      origin: 'Nyeri County, Mount Kenya',
      weight: '500g',
      createdAt: '2026-01-20T09:00:00Z',
    },
    {
      id: 'prod_002',
      sku: 'ZWD-KIO-002',
      slug: 'maasai-handwoven-kiondo-tote',
      name: {
        en: 'Authentic Maasai Handwoven Kiondo Tote Bag',
        sw: 'Kikapu Asili cha Kiondo cha Kufumwa cha Maasai',
        lg: 'Ekisero ky’Emikono ekya Kiondo eky’Abaamaasai',
        zh: '传统马赛纯手工编织 Kiondo 剑麻提包',
        es: 'Bolso Artesanal Kiondo Tejido a Mano Masái',
        pt: 'Bolsa Artesanal Kiondo Tecida à Mão Maasai',
      },
      description: {
        en: 'Hand-woven by Maasai women artisans using sustainably harvested sisal fibers and finished with genuine Kenyan cowhide leather shoulder handles.',
        sw: 'Kimefumwa kwa mikono na wanawake mafundi wa Kimaasai wakitumia makonge asili pamoja na mikanda imara ya ngozi halisi ya ng’ombe.',
        lg: 'Kyatungiddwa n’emikono gy’abakazi Abaamaasai nga bakozesa olukonge n’emiguwa egy’amaliba g’ente.',
        zh: '由马赛部落女性手工艺人采用天然剑麻手工捻线编织，搭配坚固牛皮提手与传统几何纹理，经久耐用。',
        es: 'Tejido a mano por artesanas masái con fibras de sisal cosechadas de forma sostenible y asas de cuero genuino de vaca keniana.',
        pt: 'Tecida à mão por artesãs Maasai com fibras de sisal sustentáveis e alças resistentes em couro bovino genuíno do Quênia.',
      },
      price: 3800,
      discountPrice: 3400,
      images: [
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_crafts',
      categoryName: 'Handmade Crafts & Art',
      stockQuantity: 18,
      isAvailable: true,
      featured: true,
      rating: 4.8,
      reviewCount: 29,
      origin: 'Machakos & Kajiado Counties',
      weight: '650g',
      createdAt: '2026-01-22T11:00:00Z',
    },
    {
      id: 'prod_003',
      sku: 'ZWD-HON-003',
      slug: 'baringo-pure-acacia-honey-1kg',
      name: {
        en: 'Raw Baringo Highland Acacia Honey (1kg)',
        sw: 'Asali Mbichi Safi ya Mshita ya Baringo (Kilo 1)',
        lg: 'Omubisi gw’Enjuki Omutononde ogw’e Baringo (Kkiro 1)',
        zh: '巴林戈高地纯天然生金合欢洋槐蜂蜜 (1公斤)',
        es: 'Miel Pura de Acacia de Baringo (1kg)',
        pt: 'Mel Puro de Acácia das Terras Altas de Baringo (1kg)',
      },
      description: {
        en: '100% unpasteurized raw honey harvested from wild acacia blossoms in the Great Rift Valley. Rich in natural enzymes, pollen, and therapeutic antioxidants.',
        sw: 'Asali asilia 100% isiyochujwa viwandani, iliyovunwa kutoka kwenye maua ya miti ya miiba kwenye Bonde Kuu la Ufa. Ina virutubisho na tiba asili.',
        lg: 'Omubisi gw’enjuki ogw’obutonde 100% ogwatoolwa ku bimuli by’omu Bonde Kuu lya Ufa. Gulimu eddagala erigumya omubiri.',
        zh: '采自东非大裂谷野生洋槐花丛，未经高温巴氏杀菌，完整保留活性酶、天然蜂花粉与抗氧化营养成分。',
        es: 'Miel 100% cruda sin pasteurizar recolectada de flores silvestres de acacia en el Gran Valle del Rift. Rica en enzimas y antioxidantes.',
        pt: 'Mel cru 100% puro não pasteurizado colhido de acácias selvagens no Vale do Rift. Rico em enzimas e antioxidantes.',
      },
      price: 1450,
      images: [
        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_organic',
      categoryName: 'Organic Farm Goods',
      stockQuantity: 32,
      isAvailable: true,
      featured: true,
      rating: 5.0,
      reviewCount: 38,
      origin: 'Baringo County, Rift Valley',
      weight: '1kg Glass Jar',
      createdAt: '2026-01-25T14:30:00Z',
    },
    {
      id: 'prod_004',
      sku: 'ZWD-MAC-004',
      slug: 'roasted-embu-macadamia-nuts-400g',
      name: {
        en: 'Roasted Sea Salt Embu Macadamia Nuts (400g)',
        sw: 'Karanga za Makadamia za Kuchomwa za Embu (Gramu 400)',
        lg: 'Ebinyeebwa bya Macadamia ebyookeddwa eby’e Embu (Gulaamu 400)',
        zh: '肯尼亚恩布高地慢烘海盐夏威夷果 (400克)',
        es: 'Nueces de Macadamia Tostadas con Sal Marina (400g)',
        pt: 'Nozes Macadâmia Torradas com Sal Marinho (400g)',
      },
      description: {
        en: 'Grown on fertile volcanic soils around Mount Kenya, gently dry-roasted and lightly sprinkled with Indian Ocean sea salt for a creamy, crunchy snack.',
        sw: 'Zimelimwa kwenye udongo wenye rutuba wa Mlima Kenya, zikachomwa kwa uangalifu na kuongezwa chumvi asili ya Bahari Hindi.',
        lg: 'Biwedde obulungi n’omunnyo ogw’ennyanja, birina obwoomi n’amaanyi.',
        zh: '产自肯尼亚山肥沃火山灰土壤，低温慢火烘烤，辅以微量印度洋纯净海盐，奶香浓郁，酥脆可口。',
        es: 'Cultivadas en suelos volcánicos de Embu, tostadas suavemente con un toque de sal marina del Océano Índico.',
        pt: 'Cultivadas nos solos vulcânicos do Monte Quênia, torradas lentamente com um toque de sal marinho do Oceano Índico.',
      },
      price: 1200,
      images: [
        'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_organic',
      categoryName: 'Organic Farm Goods',
      stockQuantity: 60,
      isAvailable: true,
      featured: false,
      rating: 4.7,
      reviewCount: 19,
      origin: 'Embu County',
      weight: '400g Foil Pouch',
      createdAt: '2026-01-28T16:00:00Z',
    },
    {
      id: 'prod_005',
      sku: 'ZWD-KIT-005',
      slug: 'tailored-kitenge-safari-shirt',
      name: {
        en: 'Hand-tailored Unisex Kitenge Wax Print Shirt',
        sw: 'Shati ya Kitenge ya Kushonwa kwa Mkono',
        lg: 'Essaati ey’Engoye za Kitenge ey’Omulembe',
        zh: '传统手裁非洲 Kitenge 蜡染纯棉衬衫',
        es: 'Camisa Unisex Artesanal con Estampado Kitenge',
        pt: 'Camisa Unissex Artesanal em Tecido Kitenge',
      },
      description: {
        en: 'Breathable 100% African wax cotton tailored by master artisans in Nairobi. Bold geometric motifs celebrating East African heritage.',
        sw: 'Pamba safi ya Kiafrika 100% iliyoshonwa na mafundi stadi mjini Nairobi. Ina nakshi nzuri za kiasili zinazosherehekea utamaduni wa Afrika Mashariki.',
        lg: 'Pamba omulungi ow’obutonde eyatungibwa abakugu mu Nairobi. Eraga obuwangwa bwa Buvanjuba bwa Afirika.',
        zh: '100% 高支透气纯棉非洲蜡染布料，由内罗毕经验资深裁缝手工缝制，兼具舒适度与鲜明东非图腾。',
        es: 'Algodón 100% estampado con técnica de cera africana, confeccionada por sastres expertos en Nairobi.',
        pt: 'Algodão 100% africano confeccionado por mestres alfaiates em Nairóbi, com estampas geométricas vibrantes.',
      },
      price: 3200,
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_textiles',
      categoryName: 'Kitenge & Fashion',
      stockQuantity: 24,
      isAvailable: true,
      featured: true,
      rating: 4.9,
      reviewCount: 22,
      origin: 'Nairobi Workshops',
      weight: '300g',
      createdAt: '2026-02-01T12:00:00Z',
    },
    {
      id: 'prod_006',
      sku: 'ZWD-SOP-006',
      slug: 'kisii-soapstone-family-sculpture',
      name: {
        en: 'Kisii Soapstone Hand-carved Family Sculpture',
        sw: 'Sanamu ya Familia ya Jiwe la Kisii ya Kuchongwa',
        lg: 'Ekibumbe ky’Amayinja ga Kisii eky’Amaka',
        zh: '基西手作天然滑石“和谐家庭”艺术石雕',
        es: 'Escultura Familiar Tallada en Esteatita de Kisii',
        pt: 'Escultura Familiar Entalhada em Pedra-Sabão de Kisii',
      },
      description: {
        en: 'Quarried in Tabaka, Kisii County, each soapstone figurine is hand-carved, sanded with water, and naturally polished to reveal warm earthy tones.',
        sw: 'Imetoka machimbo ya Tabaka, Kisii. Kila kinyago kinachongwa kwa mkono, kulainishwa na maji na kung’arishwa kwa asili kuonyesha rangi nzuri za asili.',
        lg: 'Yabumbibwa n’emikono okuva mu mayinja g’e Tabaka mu Kisii, erina obunyiikivu n’obulungi obw’ekitalo.',
        zh: '采自肯尼亚基西郡塔巴卡天然矿区，工匠世代相传的水磨雕琢技艺，手感温润如玉，象征家庭美满与团结。',
        es: 'Esculpida a mano en Tabaka, condado de Kisii, pulida con agua para revelar sus tonos terrosos naturales.',
        pt: 'Esculpida à mão em Tabaka, condado de Kisii, polida com água para realçar seus tons terrosos naturais.',
      },
      price: 2750,
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_crafts',
      categoryName: 'Handmade Crafts & Art',
      stockQuantity: 15,
      isAvailable: true,
      featured: false,
      rating: 4.8,
      reviewCount: 16,
      origin: 'Tabaka, Kisii County',
      weight: '1.2kg',
      createdAt: '2026-02-03T15:00:00Z',
    },
  ];

  const initialServices: Service[] = [
    {
      id: 'serv_001',
      slug: 'nairobi-national-park-half-day-safari',
      name: {
        en: 'Nairobi National Park Half-Day Wildlife Safari & Guide',
        sw: 'Safari ya Nusu Siku ya Hifadhi ya Taifa ya Nairobi',
        lg: 'Olugendo lwa Safari olw’Ekitundu ky’Olunaku mu Nairobi',
        zh: '内罗毕国家公园半日野生动物探秘游猎 (含专业金牌向导)',
        es: 'Safari Guiado de Medio Día en el Parque Nacional de Nairobi',
        pt: 'Safári Guiado de Meio Dia no Parque Nacional de Nairóbi',
      },
      description: {
        en: 'Experience majestic lions, endangered black rhinos, giraffes, and zebras against the city skyline in a custom 4x4 pop-up roof safari vehicle with a KPSGA-certified guide.',
        sw: 'Tazama simba, vifaru weusi walio hatarini kutoweka, twiga na punda milia mbele ya majengo marefu ya jiji ukiwa ndani ya gari la 4x4 na kiongozi aliyeidhinishwa.',
        lg: 'Laba empologoma, enkura ez’omuwendo, n’ebisolo ebirala n’omukulembeze omukugu mu mmotoka eya 4x4.',
        zh: '乘坐四驱升顶越野游猎车，由肯尼亚专业级持牌野生动物向导陪同，在城市天际线背景下探寻雄狮、珍稀黑犀牛、长颈鹿与斑马群。',
        es: 'Avista leones, rinocerontes negros, jirafas y cebras con la silueta de Nairobi de fondo en vehículo 4x4 adaptado con guía profesional.',
        pt: 'Veja leões, rinocerontes negros, girafas e zebras com o skyline da cidade ao fundo em veículo 4x4 adaptado com guia credenciado.',
      },
      price: 9500,
      duration: '5 Hours (Morning or Afternoon)',
      images: [
        'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_safari',
      categoryName: 'Safari & Tour Guides',
      isAvailable: true,
      featured: true,
      rating: 5.0,
      reviewCount: 36,
      provider: 'Zawadi Certified Safari Guides',
      location: 'Nairobi National Park, Main Gate',
      createdAt: '2026-01-18T08:00:00Z',
    },
    {
      id: 'serv_002',
      slug: 'solar-pv-energy-audit-assessment',
      name: {
        en: 'Solar PV Clean Energy Assessment & Installation Audit',
        sw: 'Ukaguzi wa Nishati ya Jua ya Umeme na Ushauri wa Kufunga',
        lg: 'Okukebera n’Okutegeka Amasannyalaze g’Enjuba aga Solar',
        zh: '家庭与工商业分布式太阳能光伏发电系统勘测及方案设计',
        es: 'Auditoría Energética Solar y Asesoría de Instalación Fotovoltaica',
        pt: 'Auditoria de Energia Solar e Consultoria de Instalação Fotovoltaica',
      },
      description: {
        en: 'Comprehensive site assessment by EPRA-licensed solar engineers. Includes structural roof load analysis, solar irradiance modeling, battery sizing, and ROI payback forecast.',
        sw: 'Ukaguzi kamili wa eneo na wahandisi walioidhinishwa na EPRA. Inajumuisha tathmini ya paa, uwezo wa betri na makadirio ya kuokoa gharama za umeme.',
        lg: 'Okupima n’okutegeka amakubo ag’enjawulo ag’amasannyalaze n’abakugu abalina layisinsi.',
        zh: '由肯尼亚能源监管局 (EPRA) 持牌高级电气工程师进行全方位屋顶荷载测算、光照建模、储能电池选型与投资回报测算。',
        es: 'Evaluación técnica completa por ingenieros solares certificados. Incluye análisis de carga de techo, dimensionamiento de baterías y cálculo de retorno de inversión.',
        pt: 'Avaliação técnica completa por engenheiros solares certificados por EPRA, com análise de viabilidade, dimensionamento e retorno financeiro.',
      },
      price: 6500,
      duration: 'Site Visit + Comprehensive Report (48h)',
      images: [
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_business',
      categoryName: 'Business & Professional Services',
      isAvailable: true,
      featured: true,
      rating: 4.9,
      reviewCount: 18,
      provider: 'Zawadi Green Energy Engineering Team',
      location: 'Nairobi Metropolitan & 47 Counties',
      createdAt: '2026-01-24T09:00:00Z',
    },
    {
      id: 'serv_003',
      slug: 'swahili-localization-legal-translation',
      name: {
        en: 'Official East African Swahili Translation & Legal Localization',
        sw: 'Tafsiri Rasmi ya Kiswahili na Ujanibishaji wa Kisheria',
        lg: 'Olukalala lw’Okutafsiri Oluswayiri n’Amateeka g’omu Buvanjuba bwa Afirika',
        zh: '东非官方斯瓦希里语专业商务文件与法律合同翻译本土化',
        es: 'Traducción Jurada y Localización al Suajili de África Oriental',
        pt: 'Tradução Oficial e Localização em Suaíli da África Oriental',
      },
      description: {
        en: 'Certified translation of legal contracts, corporate policies, e-commerce stores, and software UI by sworn Swahili linguists fluent in regional dialects (Kenya, Tanzania, Uganda).',
        sw: 'Tafsiri iliyoidhinishwa ya mikataba ya kisheria, mifumo ya kiteknolojia na tovuti na wataalamu waliobobea katika lahaja za kanda ya Afrika Mashariki.',
        lg: 'Okutafsiri ebiwandiiko eby’amateeka n’ebyobusuubuzi n’abakugu mu lulimi Oluswayiri.',
        zh: '由东非权威语言协会认证的资深斯瓦希里语母语译员提供法律合同、公司合规文件、跨境电商平台与软件界面的严谨本土化翻译。',
        es: 'Traducción certificada de contratos legales, sitios web y documentación comercial por lingüistas jurados.',
        pt: 'Tradução juramentada de contratos, documentação comercial e aplicativos por especialistas nativos em língua suaíli.',
      },
      price: 4500,
      duration: 'Per Document Batch (Up to 2,500 words)',
      images: [
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_business',
      categoryName: 'Business & Professional Services',
      isAvailable: true,
      featured: false,
      rating: 5.0,
      reviewCount: 29,
      provider: 'Zawadi Linguistic Translation Bureau',
      location: 'Nairobi & Digital Delivery',
      createdAt: '2026-01-29T10:00:00Z',
    },
  ];

  return { initialCategories, initialProducts, initialServices };
}

// Seed catalog into PostgreSQL
async function seedCatalogPostgres(client: pg.PoolClient | pg.Pool) {
  const { initialCategories, initialProducts, initialServices } = getCatalogSeedData();

  // 1. Categories & Translations
  for (const c of initialCategories) {
    await client.query(
      `INSERT INTO categories (id, slug, icon, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.slug, c.icon, c.type]
    );

    for (const [lang, name] of Object.entries(c.name)) {
      await client.query(
        `INSERT INTO category_translations (id, category_id, language_code, name, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category_id, language_code) DO NOTHING`,
        [`${c.id}_${lang}`, c.id, lang, name, '']
      );
    }
  }

  // 2. Products & Translations
  for (const p of initialProducts) {
    await client.query(
      `INSERT INTO products (id, sku, slug, category_id, price_kes, discount_price_kes, stock_quantity, is_available, featured, rating, review_count, origin, weight, images, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        p.id,
        p.sku,
        p.slug,
        p.categoryId,
        p.price,
        p.discountPrice || null,
        p.stockQuantity,
        p.isAvailable,
        p.featured,
        p.rating,
        p.reviewCount,
        p.origin,
        p.weight || null,
        JSON.stringify(p.images),
        p.createdAt,
      ]
    );

    for (const lang of ['en', 'sw', 'lg', 'zh', 'es', 'pt'] as SupportedLanguage[]) {
      const name = p.name[lang] || p.name.en;
      const desc = p.description[lang] || p.description.en;
      await client.query(
        `INSERT INTO product_translations (id, product_id, language_code, name, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (product_id, language_code) DO NOTHING`,
        [`${p.id}_${lang}`, p.id, lang, name, desc]
      );
    }
  }

  // 3. Services & Translations
  for (const s of initialServices) {
    await client.query(
      `INSERT INTO services (id, slug, category_id, price_kes, duration, provider, location, is_available, featured, rating, review_count, images, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
       ON CONFLICT (id) DO NOTHING`,
      [
        s.id,
        s.slug,
        s.categoryId,
        s.price,
        s.duration,
        s.provider,
        s.location,
        s.isAvailable,
        s.featured,
        s.rating,
        s.reviewCount,
        JSON.stringify(s.images),
        s.createdAt,
      ]
    );

    for (const lang of ['en', 'sw', 'lg', 'zh', 'es', 'pt'] as SupportedLanguage[]) {
      const name = s.name[lang] || s.name.en;
      const desc = s.description[lang] || s.description.en;
      await client.query(
        `INSERT INTO service_translations (id, service_id, language_code, name, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (service_id, language_code) DO NOTHING`,
        [`${s.id}_${lang}`, s.id, lang, name, desc]
      );
    }
  }
}

// Ensure an admin user exists from ADMIN_EMAIL & ADMIN_PASSWORD environment variables
async function ensureAdminUser(client: pg.PoolClient | pg.Pool) {
  const adminCheck = await client.query("SELECT count(*)::int AS count FROM users WHERE role = 'admin'");
  const adminCount = adminCheck.rows[0]?.count || 0;

  if (adminCount === 0) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(adminPassword, salt);
      const adminId = `usr_admin_${Date.now()}`;

      await client.query(
        `INSERT INTO users (id, full_name, email, phone, password_hash, role, preferred_language, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'admin', 'en', NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash`,
        [adminId, 'Zawadi Administrator', adminEmail.trim().toLowerCase(), '254712345678', passwordHash]
      );
      console.log(`[PostgreSQL] Created initial administrator account for: ${adminEmail.trim().toLowerCase()}`);
    } else {
      console.log('[PostgreSQL] No administrator exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to auto-provision.');
    }
  }
}

// Load all records from PostgreSQL into memory for fast fallback
async function loadFromPostgres(client: pg.PoolClient | pg.Pool) {
  // Users
  const userRes = await client.query('SELECT * FROM users');
  memoryDb.users = userRes.rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    preferredLanguage: r.preferred_language,
    deliveryAddress: r.delivery_address || undefined,
    county: r.county || undefined,
    town: r.town || undefined,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    passwordHash: r.password_hash,
  }));

  // Categories + Translations
  const catRes = await client.query(`
    SELECT c.*, ct.language_code, ct.name AS trans_name
    FROM categories c
    LEFT JOIN category_translations ct ON c.id = ct.category_id
  `);
  const catMap = new Map<string, Category>();
  for (const row of catRes.rows) {
    if (!catMap.has(row.id)) {
      catMap.set(row.id, {
        id: row.id,
        slug: row.slug,
        icon: row.icon,
        type: row.type,
        name: {} as any,
      });
    }
    const cat = catMap.get(row.id)!;
    if (row.language_code && row.trans_name) {
      cat.name[row.language_code as SupportedLanguage] = row.trans_name;
    }
  }
  memoryDb.categories = Array.from(catMap.values());

  // Products + Translations
  const prodRes = await client.query(`
    SELECT p.*, pt.language_code, pt.name AS trans_name, pt.description AS trans_desc
    FROM products p
    LEFT JOIN product_translations pt ON p.id = pt.product_id
  `);
  const prodMap = new Map<string, Product>();
  for (const row of prodRes.rows) {
    if (!prodMap.has(row.id)) {
      prodMap.set(row.id, {
        id: row.id,
        sku: row.sku,
        slug: row.slug,
        categoryId: row.category_id,
        price: Number(row.price_kes),
        discountPrice: row.discount_price_kes ? Number(row.discount_price_kes) : undefined,
        images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : []),
        stockQuantity: row.stock_quantity,
        isAvailable: row.is_available,
        featured: row.featured,
        rating: Number(row.rating || 5.0),
        reviewCount: row.review_count,
        origin: row.origin,
        weight: row.weight || undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        name: {} as any,
        description: {} as any,
      });
    }
    const prod = prodMap.get(row.id)!;
    if (row.language_code) {
      if (row.trans_name) prod.name[row.language_code as SupportedLanguage] = row.trans_name;
      if (row.trans_desc) prod.description[row.language_code as SupportedLanguage] = row.trans_desc;
    }
  }
  memoryDb.products = Array.from(prodMap.values());

  // Services + Translations
  const servRes = await client.query(`
    SELECT s.*, st.language_code, st.name AS trans_name, st.description AS trans_desc
    FROM services s
    LEFT JOIN service_translations st ON s.id = st.service_id
  `);
  const servMap = new Map<string, Service>();
  for (const row of servRes.rows) {
    if (!servMap.has(row.id)) {
      servMap.set(row.id, {
        id: row.id,
        slug: row.slug,
        categoryId: row.category_id,
        price: Number(row.price_kes),
        duration: row.duration,
        provider: row.provider,
        location: row.location,
        isAvailable: row.is_available,
        featured: row.featured,
        rating: Number(row.rating || 5.0),
        reviewCount: row.review_count,
        images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : []),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        name: {} as any,
        description: {} as any,
      });
    }
    const serv = servMap.get(row.id)!;
    if (row.language_code) {
      if (row.trans_name) serv.name[row.language_code as SupportedLanguage] = row.trans_name;
      if (row.trans_desc) serv.description[row.language_code as SupportedLanguage] = row.trans_desc;
    }
  }
  memoryDb.services = Array.from(servMap.values());

  // Orders + Items
  const orderRes = await client.query(`SELECT * FROM orders ORDER BY created_at DESC`);
  const itemRes = await client.query(`SELECT * FROM order_items`);
  const itemsByOrder = new Map<string, any[]>();
  for (const it of itemRes.rows) {
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id)!.push({
      id: it.id,
      orderId: it.order_id,
      itemType: it.item_type,
      itemId: it.item_id,
      name: it.name,
      quantity: it.quantity,
      unitPrice: Number(it.unit_price),
      totalPrice: Number(it.total_price),
      image: it.image,
    });
  }

  memoryDb.orders = orderRes.rows.map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    userId: r.user_id || undefined,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    deliveryAddress: r.delivery_address,
    county: r.county,
    town: r.town,
    notes: r.order_notes || undefined,
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    discount: Number(r.discount),
    totalAmount: Number(r.total_amount),
    orderStatus: r.order_status,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    mpesaReceiptNumber: r.mpesa_receipt_number || undefined,
    checkoutRequestId: r.checkout_request_id || undefined,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    items: itemsByOrder.get(r.id) || [],
  }));

  // Payments
  const payRes = await client.query(`SELECT * FROM payments ORDER BY created_at DESC`);
  memoryDb.payments = payRes.rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    orderNumber: r.order_number,
    amount: Number(r.amount),
    phoneNumber: r.phone_number,
    merchantRequestId: r.merchant_request_id || undefined,
    checkoutRequestId: r.checkout_request_id,
    mpesaReceiptNumber: r.mpesa_receipt_number || undefined,
    resultCode: r.result_code !== null ? r.result_code : undefined,
    resultDesc: r.result_desc || undefined,
    status: r.status,
    environment: r.environment,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
  }));
}

// In-Memory Seed Fallback (when running in dev mode without DATABASE_URL)
export function initSeedData() {
  const { initialCategories, initialProducts, initialServices } = getCatalogSeedData();
  memoryDb.categories = [...initialCategories];
  memoryDb.products = [...initialProducts];
  memoryDb.services = [...initialServices];
  memoryDb.orders = [];
  memoryDb.payments = [];
  memoryDb.wishlists = {};
  memoryDb.carts = {};

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && memoryDb.users.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    memoryDb.users.push({
      id: 'usr_admin_dev',
      fullName: 'Zawadi Administrator',
      email: adminEmail.trim().toLowerCase(),
      phone: '254712345678',
      role: 'admin',
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync(adminPassword, salt),
    });
  }
}

// ==============================================================================
// INITIALIZE DATABASE ON STARTUP (Executes schema.sql and seeds if products empty)
// ==============================================================================
export async function initDatabase(): Promise<void> {
  const pool = getPgPool();

  if (!pool) {
    console.warn(
      '[PostgreSQL] DATABASE_URL is not set or database pool could not be created. Starting with in-memory catalog.'
    );
    initSeedData();
    isInitialized = true;
    return;
  }

  try {
    console.log('[PostgreSQL] Connecting to PostgreSQL using DATABASE_URL...');
    const client = await pool.connect();
    try {
      // 1. Locate and read schema.sql from candidate locations
      const schemaCandidates = [
        path.resolve(process.cwd(), 'src/db/schema.sql'),
        path.resolve(process.cwd(), 'schema.sql'),
        path.resolve(__dirname, 'schema.sql'),
        path.resolve(__dirname, '../schema.sql'),
        path.resolve(__dirname, '../../schema.sql'),
      ];
      let schemaSql = '';
      for (const p of schemaCandidates) {
        if (fs.existsSync(p)) {
          schemaSql = fs.readFileSync(p, 'utf-8');
          console.log(`[PostgreSQL] Found schema file: ${p}`);
          break;
        }
      }

      // 2. Execute schema.sql to create all tables on startup if they don't exist
      if (schemaSql) {
        console.log('[PostgreSQL] Executing schema.sql to verify/create relational tables...');
        await client.query(schemaSql);
        console.log('[PostgreSQL] Schema applied successfully! All tables ready.');
      }

      // 3. Seed sample categories and products ONLY if the products table is empty
      const prodCheck = await client.query('SELECT count(*)::int AS count FROM products');
      const prodCount = prodCheck.rows[0]?.count || 0;

      if (prodCount === 0) {
        console.log('[PostgreSQL] Products table is empty. Seeding initial categories and products into PostgreSQL...');
        await seedCatalogPostgres(client);
        console.log('[PostgreSQL] Sample categories and products successfully seeded.');
      } else {
        console.log(`[PostgreSQL] Catalog already populated (${prodCount} products found).`);
      }

      // 4. Ensure admin user exists from ADMIN_EMAIL / ADMIN_PASSWORD
      await ensureAdminUser(client);

      // 5. Synchronize memory cache from PostgreSQL
      await loadFromPostgres(client);
      console.log('[PostgreSQL] Synced active application data from PostgreSQL.');
      isInitialized = true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[PostgreSQL] Database startup initialization failed:', err.message);
    console.warn('[PostgreSQL] Falling back to in-memory store.');
    initSeedData();
    isInitialized = true;
  }
}

// Auto-initialize when file is imported
initDatabase().catch((e) => console.error('[Database] Async init error:', e));

// ==============================================================================
// ASYNCHRONOUS DATABASE ACCESS LAYER (Direct PostgreSQL Queries)
// ==============================================================================
export const db = {
  // --------------------------------------------------------------------------
  // USERS
  // --------------------------------------------------------------------------
  getUserByEmail: async (email: string): Promise<(User & { passwordHash: string }) | null> => {
    const cleanEmail = email.trim().toLowerCase();
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
        if (res.rows.length === 0) return null;
        const r = res.rows[0];
        return {
          id: r.id,
          fullName: r.full_name,
          email: r.email,
          phone: r.phone,
          role: r.role,
          preferredLanguage: r.preferred_language,
          deliveryAddress: r.delivery_address || undefined,
          county: r.county || undefined,
          town: r.town || undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          passwordHash: r.password_hash,
        };
      } catch (err) {
        console.error('[PostgreSQL] getUserByEmail error:', err);
      }
    }
    return memoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  getUserById: async (id: string): Promise<User | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        const r = res.rows[0];
        return {
          id: r.id,
          fullName: r.full_name,
          email: r.email,
          phone: r.phone,
          role: r.role,
          preferredLanguage: r.preferred_language,
          deliveryAddress: r.delivery_address || undefined,
          county: r.county || undefined,
          town: r.town || undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        };
      } catch (err) {
        console.error('[PostgreSQL] getUserById error:', err);
      }
    }
    const memUser = memoryDb.users.find((u) => u.id === id);
    if (!memUser) return null;
    const { passwordHash: _, ...safeUser } = memUser;
    return safeUser;
  },

  createUser: async (userData: User & { passwordHash: string }): Promise<User> => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO users (id, full_name, email, phone, password_hash, role, preferred_language, delivery_address, county, town, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             phone = EXCLUDED.phone,
             password_hash = EXCLUDED.password_hash,
             preferred_language = EXCLUDED.preferred_language,
             delivery_address = EXCLUDED.delivery_address,
             county = EXCLUDED.county,
             town = EXCLUDED.town,
             updated_at = NOW()`,
          [
            userData.id,
            userData.fullName,
            cleanEmail,
            userData.phone,
            userData.passwordHash,
            userData.role,
            userData.preferredLanguage,
            userData.deliveryAddress || null,
            userData.county || null,
            userData.town || null,
            userData.createdAt,
            new Date().toISOString(),
          ]
        );
      } catch (err) {
        console.error('[PostgreSQL] createUser error:', err);
      }
    }

    const idx = memoryDb.users.findIndex((u) => u.id === userData.id);
    if (idx !== -1) {
      memoryDb.users[idx] = { ...userData, email: cleanEmail };
    } else {
      memoryDb.users.push({ ...userData, email: cleanEmail });
    }

    const { passwordHash: _, ...safeUser } = userData;
    return { ...safeUser, email: cleanEmail };
  },

  updateUserLanguage: async (userId: string, lang: SupportedLanguage): Promise<User | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE users SET preferred_language = $1, updated_at = NOW() WHERE id = $2`,
          [lang, userId]
        );
      } catch (err) {
        console.error('[PostgreSQL] updateUserLanguage error:', err);
      }
    }

    const user = memoryDb.users.find((u) => u.id === userId);
    if (user) {
      user.preferredLanguage = lang;
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE users SET
             full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             delivery_address = COALESCE($3, delivery_address),
             county = COALESCE($4, county),
             town = COALESCE($5, town),
             updated_at = NOW()
           WHERE id = $6`,
          [
            updates.fullName || null,
            updates.phone || null,
            updates.deliveryAddress || null,
            updates.county || null,
            updates.town || null,
            userId,
          ]
        );
      } catch (err) {
        console.error('[PostgreSQL] updateUserProfile error:', err);
      }
    }

    const user = memoryDb.users.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  getAllUsers: async (): Promise<User[]> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT id, full_name, email, phone, role, preferred_language, delivery_address, county, town, created_at FROM users ORDER BY created_at DESC');
        return res.rows.map((r) => ({
          id: r.id,
          fullName: r.full_name,
          email: r.email,
          phone: r.phone,
          role: r.role,
          preferredLanguage: r.preferred_language,
          deliveryAddress: r.delivery_address || undefined,
          county: r.county || undefined,
          town: r.town || undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        }));
      } catch (err) {
        console.error('[PostgreSQL] getAllUsers error:', err);
      }
    }
    return memoryDb.users.map(({ passwordHash: _, ...safeUser }) => safeUser);
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  getCategories: async (): Promise<Category[]> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query(`
          SELECT c.*, ct.language_code, ct.name AS trans_name
          FROM categories c
          LEFT JOIN category_translations ct ON c.id = ct.category_id
        `);
        const catMap = new Map<string, Category>();
        for (const row of res.rows) {
          if (!catMap.has(row.id)) {
            catMap.set(row.id, {
              id: row.id,
              slug: row.slug,
              icon: row.icon,
              type: row.type,
              name: {} as any,
            });
          }
          const cat = catMap.get(row.id)!;
          if (row.language_code && row.trans_name) {
            cat.name[row.language_code as SupportedLanguage] = row.trans_name;
          }
        }
        return Array.from(catMap.values());
      } catch (err) {
        console.error('[PostgreSQL] getCategories error:', err);
      }
    }
    return memoryDb.categories;
  },

  getCategoryById: async (id: string): Promise<Category | null> => {
    const categories = await db.getCategories();
    return categories.find((c) => c.id === id) || null;
  },

  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  getProducts: async (filter?: {
    categoryId?: string;
    search?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    language?: SupportedLanguage;
  }): Promise<Product[]> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query(`
          SELECT p.*, pt.language_code, pt.name AS trans_name, pt.description AS trans_desc
          FROM products p
          LEFT JOIN product_translations pt ON p.id = pt.product_id
        `);
        const prodMap = new Map<string, Product>();
        for (const row of res.rows) {
          if (!prodMap.has(row.id)) {
            prodMap.set(row.id, {
              id: row.id,
              sku: row.sku,
              slug: row.slug,
              categoryId: row.category_id,
              price: Number(row.price_kes),
              discountPrice: row.discount_price_kes ? Number(row.discount_price_kes) : undefined,
              images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : []),
              stockQuantity: row.stock_quantity,
              isAvailable: row.is_available,
              featured: row.featured,
              rating: Number(row.rating || 5.0),
              reviewCount: row.review_count,
              origin: row.origin,
              weight: row.weight || undefined,
              createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
              name: {} as any,
              description: {} as any,
            });
          }
          const prod = prodMap.get(row.id)!;
          if (row.language_code) {
            if (row.trans_name) prod.name[row.language_code as SupportedLanguage] = row.trans_name;
            if (row.trans_desc) prod.description[row.language_code as SupportedLanguage] = row.trans_desc;
          }
        }
        let list = Array.from(prodMap.values());

        if (filter?.categoryId) {
          list = list.filter((p) => p.categoryId === filter.categoryId);
        }
        if (filter?.featured !== undefined) {
          list = list.filter((p) => p.featured === filter.featured);
        }
        if (filter?.minPrice !== undefined) {
          list = list.filter((p) => (p.discountPrice || p.price) >= filter.minPrice!);
        }
        if (filter?.maxPrice !== undefined) {
          list = list.filter((p) => (p.discountPrice || p.price) <= filter.maxPrice!);
        }
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          list = list.filter((p) => {
            const nameMatches = Object.values(p.name).some((n) => n.toLowerCase().includes(q));
            const descMatches = Object.values(p.description).some((d) => d.toLowerCase().includes(q));
            return nameMatches || descMatches || p.origin.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
          });
        }
        if (filter?.sortBy) {
          if (filter.sortBy === 'price_asc') {
            list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
          } else if (filter.sortBy === 'price_desc') {
            list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
          } else if (filter.sortBy === 'rating') {
            list.sort((a, b) => b.rating - a.rating);
          } else if (filter.sortBy === 'newest') {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        }
        return list;
      } catch (err) {
        console.error('[PostgreSQL] getProducts error:', err);
      }
    }
    return memoryDb.products;
  },

  getProductById: async (id: string): Promise<Product | null> => {
    const products = await db.getProducts();
    return products.find((p) => p.id === id) || null;
  },

  createProduct: async (product: Product): Promise<Product> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO products (id, sku, slug, category_id, price_kes, discount_price_kes, stock_quantity, is_available, featured, rating, review_count, origin, weight, images, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)`,
          [
            product.id,
            product.sku,
            product.slug,
            product.categoryId,
            product.price,
            product.discountPrice || null,
            product.stockQuantity,
            product.isAvailable,
            product.featured,
            product.rating,
            product.reviewCount,
            product.origin,
            product.weight || null,
            JSON.stringify(product.images),
            product.createdAt,
          ]
        );

        for (const [lang, name] of Object.entries(product.name)) {
          const desc = product.description[lang as SupportedLanguage] || '';
          await pool.query(
            `INSERT INTO product_translations (id, product_id, language_code, name, description)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (product_id, language_code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
            [`${product.id}_${lang}`, product.id, lang, name, desc]
          );
        }
      } catch (err) {
        console.error('[PostgreSQL] createProduct error:', err);
      }
    }

    memoryDb.products.unshift(product);
    return product;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE products SET
             price_kes = COALESCE($1, price_kes),
             discount_price_kes = COALESCE($2, discount_price_kes),
             stock_quantity = COALESCE($3, stock_quantity),
             is_available = COALESCE($4, is_available),
             origin = COALESCE($5, origin),
             images = COALESCE($6, images),
             updated_at = NOW()
           WHERE id = $7`,
          [
            updates.price || null,
            updates.discountPrice || null,
            updates.stockQuantity !== undefined ? updates.stockQuantity : null,
            updates.isAvailable !== undefined ? updates.isAvailable : null,
            updates.origin || null,
            updates.images ? JSON.stringify(updates.images) : null,
            id,
          ]
        );
      } catch (err) {
        console.error('[PostgreSQL] updateProduct error:', err);
      }
    }

    const idx = memoryDb.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      memoryDb.products[idx] = { ...memoryDb.products[idx], ...updates };
      return memoryDb.products[idx];
    }
    return null;
  },

  deleteProduct: async (id: string): Promise<Product | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
      } catch (err) {
        console.error('[PostgreSQL] deleteProduct error:', err);
      }
    }

    const idx = memoryDb.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      return memoryDb.products.splice(idx, 1)[0];
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // SERVICES
  // --------------------------------------------------------------------------
  getServices: async (filter?: { categoryId?: string; search?: string; featured?: boolean }): Promise<Service[]> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query(`
          SELECT s.*, st.language_code, st.name AS trans_name, st.description AS trans_desc
          FROM services s
          LEFT JOIN service_translations st ON s.id = st.service_id
        `);
        const servMap = new Map<string, Service>();
        for (const row of res.rows) {
          if (!servMap.has(row.id)) {
            servMap.set(row.id, {
              id: row.id,
              slug: row.slug,
              categoryId: row.category_id,
              price: Number(row.price_kes),
              duration: row.duration,
              provider: row.provider,
              location: row.location,
              isAvailable: row.is_available,
              featured: row.featured,
              rating: Number(row.rating || 5.0),
              reviewCount: row.review_count,
              images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : []),
              createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
              name: {} as any,
              description: {} as any,
            });
          }
          const serv = servMap.get(row.id)!;
          if (row.language_code) {
            if (row.trans_name) serv.name[row.language_code as SupportedLanguage] = row.trans_name;
            if (row.trans_desc) serv.description[row.language_code as SupportedLanguage] = row.trans_desc;
          }
        }
        let list = Array.from(servMap.values());
        if (filter?.categoryId) {
          list = list.filter((s) => s.categoryId === filter.categoryId);
        }
        if (filter?.featured !== undefined) {
          list = list.filter((s) => s.featured === filter.featured);
        }
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          list = list.filter((s) => {
            const nameMatches = Object.values(s.name).some((n) => n.toLowerCase().includes(q));
            const descMatches = Object.values(s.description).some((d) => d.toLowerCase().includes(q));
            return nameMatches || descMatches || s.provider.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
          });
        }
        return list;
      } catch (err) {
        console.error('[PostgreSQL] getServices error:', err);
      }
    }
    return memoryDb.services;
  },

  getServiceById: async (id: string): Promise<Service | null> => {
    const services = await db.getServices();
    return services.find((s) => s.id === id) || null;
  },

  createService: async (service: Service): Promise<Service> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO services (id, slug, category_id, price_kes, duration, provider, location, is_available, featured, rating, review_count, images, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)`,
          [
            service.id,
            service.slug,
            service.categoryId,
            service.price,
            service.duration,
            service.provider,
            service.location,
            service.isAvailable,
            service.featured,
            service.rating,
            service.reviewCount,
            JSON.stringify(service.images),
            service.createdAt,
          ]
        );

        for (const [lang, name] of Object.entries(service.name)) {
          const desc = service.description[lang as SupportedLanguage] || '';
          await pool.query(
            `INSERT INTO service_translations (id, service_id, language_code, name, description)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (service_id, language_code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
            [`${service.id}_${lang}`, service.id, lang, name, desc]
          );
        }
      } catch (err) {
        console.error('[PostgreSQL] createService error:', err);
      }
    }

    memoryDb.services.unshift(service);
    return service;
  },

  updateService: async (id: string, updates: Partial<Service>): Promise<Service | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE services SET
             price_kes = COALESCE($1, price_kes),
             duration = COALESCE($2, duration),
             provider = COALESCE($3, provider),
             location = COALESCE($4, location),
             is_available = COALESCE($5, is_available),
             images = COALESCE($6, images),
             updated_at = NOW()
           WHERE id = $7`,
          [
            updates.price || null,
            updates.duration || null,
            updates.provider || null,
            updates.location || null,
            updates.isAvailable !== undefined ? updates.isAvailable : null,
            updates.images ? JSON.stringify(updates.images) : null,
            id,
          ]
        );
      } catch (err) {
        console.error('[PostgreSQL] updateService error:', err);
      }
    }

    const idx = memoryDb.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      memoryDb.services[idx] = { ...memoryDb.services[idx], ...updates };
      return memoryDb.services[idx];
    }
    return null;
  },

  deleteService: async (id: string): Promise<Service | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM services WHERE id = $1', [id]);
      } catch (err) {
        console.error('[PostgreSQL] deleteService error:', err);
      }
    }

    const idx = memoryDb.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      return memoryDb.services.splice(idx, 1)[0];
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // ORDERS
  // --------------------------------------------------------------------------
  getOrders: async (filter?: { userId?: string; status?: string }): Promise<Order[]> => {
    const pool = getPgPool();
    if (pool) {
      try {
        let sql = 'SELECT * FROM orders';
        const params: any[] = [];
        if (filter?.userId) {
          params.push(filter.userId);
          sql += ` WHERE user_id = $${params.length}`;
        }
        if (filter?.status) {
          params.push(filter.status);
          sql += params.length === 1 ? ` WHERE order_status = $${params.length}` : ` AND order_status = $${params.length}`;
        }
        sql += ' ORDER BY created_at DESC';

        const orderRes = await pool.query(sql, params);
        const itemRes = await pool.query('SELECT * FROM order_items');
        const itemsByOrder = new Map<string, any[]>();
        for (const it of itemRes.rows) {
          if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
          itemsByOrder.get(it.order_id)!.push({
            id: it.id,
            orderId: it.order_id,
            itemType: it.item_type,
            itemId: it.item_id,
            name: it.name,
            quantity: it.quantity,
            unitPrice: Number(it.unit_price),
            totalPrice: Number(it.total_price),
            image: it.image,
          });
        }

        return orderRes.rows.map((r) => ({
          id: r.id,
          orderNumber: r.order_number,
          userId: r.user_id || undefined,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          deliveryAddress: r.delivery_address,
          county: r.county,
          town: r.town,
          notes: r.order_notes || undefined,
          subtotal: Number(r.subtotal),
          deliveryFee: Number(r.delivery_fee),
          discount: Number(r.discount),
          totalAmount: Number(r.total_amount),
          orderStatus: r.order_status,
          paymentStatus: r.payment_status,
          paymentMethod: r.payment_method,
          mpesaReceiptNumber: r.mpesa_receipt_number || undefined,
          checkoutRequestId: r.checkout_request_id || undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          items: itemsByOrder.get(r.id) || [],
        }));
      } catch (err) {
        console.error('[PostgreSQL] getOrders error:', err);
      }
    }

    let result = [...memoryDb.orders];
    if (filter?.userId) result = result.filter((o) => o.userId === filter.userId);
    if (filter?.status) result = result.filter((o) => o.orderStatus === filter.status);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1 OR order_number = $1', [id]);
        if (orderRes.rows.length === 0) return null;
        const r = orderRes.rows[0];
        const itemRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [r.id]);

        return {
          id: r.id,
          orderNumber: r.order_number,
          userId: r.user_id || undefined,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          deliveryAddress: r.delivery_address,
          county: r.county,
          town: r.town,
          notes: r.order_notes || undefined,
          subtotal: Number(r.subtotal),
          deliveryFee: Number(r.delivery_fee),
          discount: Number(r.discount),
          totalAmount: Number(r.total_amount),
          orderStatus: r.order_status,
          paymentStatus: r.payment_status,
          paymentMethod: r.payment_method,
          mpesaReceiptNumber: r.mpesa_receipt_number || undefined,
          checkoutRequestId: r.checkout_request_id || undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          items: itemRes.rows.map((it) => ({
            id: it.id,
            orderId: it.order_id,
            itemType: it.item_type,
            itemId: it.item_id,
            name: it.name,
            quantity: it.quantity,
            unitPrice: Number(it.unit_price),
            totalPrice: Number(it.total_price),
            image: it.image,
          })),
        };
      } catch (err) {
        console.error('[PostgreSQL] getOrderById error:', err);
      }
    }

    return memoryDb.orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  createOrder: async (order: Order): Promise<Order> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, delivery_address, county, town, order_notes, subtotal, delivery_fee, discount, total_amount, order_status, payment_status, payment_method, mpesa_receipt_number, checkout_request_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
          [
            order.id,
            order.orderNumber,
            order.userId || null,
            order.customerName,
            order.customerEmail,
            order.customerPhone,
            order.deliveryAddress,
            order.county,
            order.town,
            order.notes || null,
            order.subtotal,
            order.deliveryFee,
            order.discount,
            order.totalAmount,
            order.orderStatus,
            order.paymentStatus,
            order.paymentMethod,
            order.mpesaReceiptNumber || null,
            order.checkoutRequestId || null,
            order.createdAt,
            order.updatedAt,
          ]
        );

        for (const item of order.items) {
          const unitPrice = item.unitPrice || 0;
          const totalPrice = item.totalPrice || (unitPrice * item.quantity);
          await pool.query(
            `INSERT INTO order_items (id, order_id, item_type, item_id, name, quantity, unit_price, total_price, image)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              item.id,
              order.id,
              item.itemType,
              item.itemId,
              item.name,
              item.quantity,
              unitPrice,
              totalPrice,
              item.image || null,
            ]
          );
        }
      } catch (err) {
        console.error('[PostgreSQL] createOrder error:', err);
      }
    }

    memoryDb.orders.unshift(order);
    return order;
  },

  updateOrderStatus: async (
    id: string,
    orderStatus: Order['orderStatus'],
    paymentStatus?: Order['paymentStatus'],
    mpesaReceipt?: string
  ): Promise<Order | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE orders SET
             order_status = $1,
             payment_status = COALESCE($2, payment_status),
             mpesa_receipt_number = COALESCE($3, mpesa_receipt_number),
             updated_at = NOW()
           WHERE id = $4 OR order_number = $4`,
          [orderStatus, paymentStatus || null, mpesaReceipt || null, id]
        );
      } catch (err) {
        console.error('[PostgreSQL] updateOrderStatus error:', err);
      }
    }

    const order = memoryDb.orders.find((o) => o.id === id || o.orderNumber === id);
    if (order) {
      order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      if (mpesaReceipt) order.mpesaReceiptNumber = mpesaReceipt;
      order.updatedAt = new Date().toISOString();
      return order;
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // PAYMENTS
  // --------------------------------------------------------------------------
  getPayments: async (): Promise<PaymentTransaction[]> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
        return res.rows.map((r) => ({
          id: r.id,
          orderId: r.order_id,
          orderNumber: r.order_number,
          amount: Number(r.amount),
          phoneNumber: r.phone_number,
          merchantRequestId: r.merchant_request_id || undefined,
          checkoutRequestId: r.checkout_request_id,
          mpesaReceiptNumber: r.mpesa_receipt_number || undefined,
          resultCode: r.result_code !== null ? r.result_code : undefined,
          resultDesc: r.result_desc || undefined,
          status: r.status,
          environment: r.environment,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
        }));
      } catch (err) {
        console.error('[PostgreSQL] getPayments error:', err);
      }
    }

    return [...memoryDb.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getPaymentByCheckoutId: async (checkoutRequestId: string): Promise<PaymentTransaction | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM payments WHERE checkout_request_id = $1', [checkoutRequestId]);
        if (res.rows.length === 0) return null;
        const r = res.rows[0];
        return {
          id: r.id,
          orderId: r.order_id,
          orderNumber: r.order_number,
          amount: Number(r.amount),
          phoneNumber: r.phone_number,
          merchantRequestId: r.merchant_request_id || undefined,
          checkoutRequestId: r.checkout_request_id,
          mpesaReceiptNumber: r.mpesa_receipt_number || undefined,
          resultCode: r.result_code !== null ? r.result_code : undefined,
          resultDesc: r.result_desc || undefined,
          status: r.status,
          environment: r.environment,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
        };
      } catch (err) {
        console.error('[PostgreSQL] getPaymentByCheckoutId error:', err);
      }
    }

    return memoryDb.payments.find((p) => p.checkoutRequestId === checkoutRequestId) || null;
  },

  createPaymentTransaction: async (tx: PaymentTransaction): Promise<PaymentTransaction> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO payments (id, order_id, order_number, amount, phone_number, merchant_request_id, checkout_request_id, mpesa_receipt_number, result_code, result_desc, status, environment, created_at, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            tx.id,
            tx.orderId,
            tx.orderNumber,
            tx.amount,
            tx.phoneNumber,
            tx.merchantRequestId || null,
            tx.checkoutRequestId,
            tx.mpesaReceiptNumber || null,
            tx.resultCode !== undefined ? tx.resultCode : null,
            tx.resultDesc || null,
            tx.status,
            tx.environment,
            tx.createdAt,
            tx.completedAt || null,
          ]
        );
      } catch (err) {
        console.error('[PostgreSQL] createPaymentTransaction error:', err);
      }
    }

    memoryDb.payments.unshift(tx);
    return tx;
  },

  updatePaymentTransaction: async (
    checkoutRequestId: string,
    updates: Partial<PaymentTransaction>
  ): Promise<PaymentTransaction | null> => {
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE payments SET
             status = COALESCE($1, status),
             mpesa_receipt_number = COALESCE($2, mpesa_receipt_number),
             result_code = COALESCE($3, result_code),
             result_desc = COALESCE($4, result_desc),
             completed_at = COALESCE($5, completed_at)
           WHERE checkout_request_id = $6`,
          [
            updates.status || null,
            updates.mpesaReceiptNumber || null,
            updates.resultCode !== undefined ? updates.resultCode : null,
            updates.resultDesc || null,
            updates.completedAt ? new Date(updates.completedAt) : null,
            checkoutRequestId,
          ]
        );
      } catch (err) {
        console.error('[PostgreSQL] updatePaymentTransaction error:', err);
      }
    }

    const tx = memoryDb.payments.find((p) => p.checkoutRequestId === checkoutRequestId);
    if (tx) {
      Object.assign(tx, updates);
      return tx;
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // WISHLIST
  // --------------------------------------------------------------------------
  getWishlist: async (userId: string): Promise<Product[]> => {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT p.*, pt.language_code, pt.name AS trans_name, pt.description AS trans_desc
           FROM wishlist_items wi
           JOIN wishlist w ON wi.wishlist_id = w.id
           JOIN products p ON wi.product_id = p.id
           LEFT JOIN product_translations pt ON p.id = pt.product_id
           WHERE w.user_id = $1`,
          [userId]
        );
        const prodMap = new Map<string, Product>();
        for (const row of res.rows) {
          if (!prodMap.has(row.id)) {
            prodMap.set(row.id, {
              id: row.id,
              sku: row.sku,
              slug: row.slug,
              categoryId: row.category_id,
              price: Number(row.price_kes),
              discountPrice: row.discount_price_kes ? Number(row.discount_price_kes) : undefined,
              images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : []),
              stockQuantity: row.stock_quantity,
              isAvailable: row.is_available,
              featured: row.featured,
              rating: Number(row.rating || 5.0),
              reviewCount: row.review_count,
              origin: row.origin,
              weight: row.weight || undefined,
              createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
              name: {} as any,
              description: {} as any,
            });
          }
          const prod = prodMap.get(row.id)!;
          if (row.language_code) {
            if (row.trans_name) prod.name[row.language_code as SupportedLanguage] = row.trans_name;
            if (row.trans_desc) prod.description[row.language_code as SupportedLanguage] = row.trans_desc;
          }
        }
        return Array.from(prodMap.values());
      } catch (err) {
        console.error('[PostgreSQL] getWishlist error:', err);
      }
    }

    const productIds = memoryDb.wishlists[userId] || [];
    return memoryDb.products.filter((p) => productIds.includes(p.id));
  },

  toggleWishlist: async (userId: string, productId: string): Promise<{ added: boolean; list: string[] }> => {
    if (!memoryDb.wishlists[userId]) memoryDb.wishlists[userId] = [];
    const list = memoryDb.wishlists[userId];
    const index = list.indexOf(productId);
    let added = false;
    if (index === -1) {
      list.push(productId);
      added = true;
    } else {
      list.splice(index, 1);
      added = false;
    }

    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO wishlist (id, user_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO NOTHING`,
          [`wsh_${userId}`, userId]
        );

        if (added) {
          await pool.query(
            `INSERT INTO wishlist_items (id, wishlist_id, product_id, created_at)
             VALUES ($1, $2, $3, NOW()) ON CONFLICT (wishlist_id, product_id) DO NOTHING`,
            [`wi_${userId}_${productId}`, `wsh_${userId}`, productId]
          );
        } else {
          await pool.query(
            `DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2`,
            [`wsh_${userId}`, productId]
          );
        }
      } catch (err) {
        console.error('[PostgreSQL] toggleWishlist error:', err);
      }
    }

    return { added, list };
  },

  // --------------------------------------------------------------------------
  // DIRECT QUERY HELPER (Execute SQL directly against PostgreSQL)
  // --------------------------------------------------------------------------
  query: async (text: string, params?: any[]): Promise<pg.QueryResult<any>> => {
    const pool = getPgPool();
    if (!pool) {
      throw new Error('[PostgreSQL] No database connection available (DATABASE_URL not configured).');
    }
    return pool.query(text, params);
  },

  // --------------------------------------------------------------------------
  // ANALYTICS & STATS
  // --------------------------------------------------------------------------
  getAdminStats: async (): Promise<{
    totalRevenue: number;
    totalOrders: number;
    paidOrdersCount: number;
    pendingOrders: number;
    totalCustomers: number;
    productsCount: number;
    servicesCount: number;
    lowStockCount: number;
    lowStockProducts: Product[];
  }> => {
    const orders = await db.getOrders();
    const products = await db.getProducts();
    const services = await db.getServices();
    const users = await db.getAllUsers();

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.paymentStatus === 'completed' || o.orderStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'payment_pending').length;
    const totalCustomers = users.filter((u) => u.role === 'customer').length;
    const lowStockProducts = products.filter((p) => p.stockQuantity < 20);

    return {
      totalRevenue,
      totalOrders,
      paidOrdersCount: paidOrders.length,
      pendingOrders,
      totalCustomers,
      productsCount: products.length,
      servicesCount: services.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    };
  },
};
