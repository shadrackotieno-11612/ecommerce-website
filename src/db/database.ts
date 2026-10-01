import fs from 'fs';
import path from 'path';
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

const { Pool } = pg;

// Check if PostgreSQL environment variables are provided
const hasPostgresConfig = Boolean(
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME)
);

export let pgPool: pg.Pool | null = null;

if (hasPostgresConfig) {
  try {
    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
    } else {
      pgPool = new Pool({
        host: process.env.SQL_HOST,
        port: Number(process.env.SQL_PORT || 5432),
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
      });
    }
    console.log('PostgreSQL connection pool initialized.');
  } catch (err) {
    console.warn('PostgreSQL pool initialization failed, using file repository:', err);
    pgPool = null;
  }
}

// File-persisted local relational store
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'zawadi_store.json');

export interface DatabaseState {
  users: (User & { passwordHash: string })[];
  categories: Category[];
  products: Product[];
  services: Service[];
  orders: Order[];
  payments: PaymentTransaction[];
  wishlists: Record<string, string[]>; // userId -> productIds[]
  carts: Record<string, { itemId: string; itemType: 'product' | 'service'; quantity: number }[]>;
}

// In-memory state synchronized to disk
let memoryDb: DatabaseState = {
  users: [],
  categories: [],
  products: [],
  services: [],
  orders: [],
  payments: [],
  wishlists: {},
  carts: {},
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function persistDb() {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database state:', err);
  }
}

export function loadDb(): DatabaseState {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(data);
      return memoryDb;
    }
  } catch (err) {
    console.error('Failed to load database file, re-initializing seed data:', err);
  }
  initSeedData();
  persistDb();
  return memoryDb;
}

export function initSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('Admin@2026!', salt);
  const customerPasswordHash = bcrypt.hashSync('Customer@2026!', salt);

  const initialUsers: (User & { passwordHash: string })[] = [
    {
      id: 'usr_admin_001',
      fullName: 'Amina Wanjiku',
      email: 'admin@jitustores.co.ke',
      phone: '254712345678',
      role: 'admin',
      preferredLanguage: 'en',
      deliveryAddress: 'JITU STOREs Headquarters, Kimathi Street',
      county: 'Nairobi',
      town: 'Nairobi CBD',
      createdAt: '2026-01-15T08:00:00Z',
      passwordHash: adminPasswordHash,
    },
    {
      id: 'usr_admin_compat',
      fullName: 'Amina Wanjiku (Zawadi)',
      email: 'admin@zawadi.co.ke',
      phone: '254712345678',
      role: 'admin',
      preferredLanguage: 'en',
      deliveryAddress: 'JITU STOREs Headquarters, Kimathi Street',
      county: 'Nairobi',
      town: 'Nairobi CBD',
      createdAt: '2026-01-15T08:00:00Z',
      passwordHash: adminPasswordHash,
    },
    {
      id: 'usr_cust_002',
      fullName: 'David Kiprono',
      email: 'customer@jitustores.co.ke',
      phone: '254798765432',
      role: 'customer',
      preferredLanguage: 'sw',
      deliveryAddress: 'Westlands Commercial Park, Block B',
      county: 'Nairobi',
      town: 'Westlands',
      createdAt: '2026-02-10T10:30:00Z',
      passwordHash: customerPasswordHash,
    },
    {
      id: 'usr_cust_compat',
      fullName: 'David Kiprono (Zawadi)',
      email: 'customer@zawadi.co.ke',
      phone: '254798765432',
      role: 'customer',
      preferredLanguage: 'sw',
      deliveryAddress: 'Westlands Commercial Park, Block B',
      county: 'Nairobi',
      town: 'Westlands',
      createdAt: '2026-02-10T10:30:00Z',
      passwordHash: customerPasswordHash,
    },
  ];

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
        es: 'Tallada a mano en Tabaka, condado de Kisii. Cada pieza es pulida con agua para revelar hermosos tonos terrosos.',
        pt: 'Entalhada à mão em Tabaka, condado de Kisii. Cada escultura é polida com água para realçar os tons terrosos naturais.',
      },
      price: 2750,
      images: [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_crafts',
      categoryName: 'Handmade Crafts & Art',
      stockQuantity: 14,
      isAvailable: true,
      featured: false,
      rating: 4.8,
      reviewCount: 16,
      origin: 'Tabaka, Kisii County',
      weight: '850g',
      createdAt: '2026-02-05T15:00:00Z',
    },
    {
      id: 'prod_007',
      sku: 'ZWD-BEA-007',
      slug: 'maasai-beaded-choker-set',
      name: {
        en: 'Traditional Maasai Beaded Choker & Bracelet Set',
        sw: 'Seti ya Mkufu na Bangili ya Ushanga ya Kimaasai',
        lg: 'Ebikomo n’Eby’omu Bulago eby’Ensimbi eby’Abaamaasai',
        zh: '马赛传统手工玻璃串珠项圈与手镯套装',
        es: 'Juego de Gargantilla y Pulsera de Cuentas Masái',
        pt: 'Conjunto de Gargantilha e Bracelete de Miçangas Maasai',
      },
      description: {
        en: 'Hand-strung with vibrant glass beads honoring the ceremonial colors of bravery (red), peace (white), and energy (blue). Comfortable wire clasp.',
        sw: 'Imetengenezwa kwa ushanga safi wa vioo unaoonyesha rangi za kishujaa (nyekundu), amani (nyeupe), na nguvu (bluu).',
        lg: 'Ezitungiddwa n’obukugu nga ziriko amabala ag’obumu, obuvumu n’emirembe.',
        zh: '遵循马赛古老工序，手工穿缀高密度琉璃彩珠，红色代表勇气，白色代表和平，蓝色代表能量与生命。',
        es: 'Enhebradas a mano con cuentas de vidrio tradicionales en los colores ceremoniales masái que simbolizan valentía, paz y energía.',
        pt: 'Feitas à mão com contas de vidro coloridas que celebram as cores cerimoniais da bravura, paz e energia do povo Maasai.',
      },
      price: 2200,
      images: [
        'https://images.unsplash.com/photo-1611591475816-3a7cb45d4750?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_crafts',
      categoryName: 'Handmade Crafts & Art',
      stockQuantity: 30,
      isAvailable: true,
      featured: false,
      rating: 4.9,
      reviewCount: 31,
      origin: 'Kajiado & Narok Counties',
      weight: '150g',
      createdAt: '2026-02-08T10:00:00Z',
    },
    {
      id: 'prod_008',
      sku: 'ZWD-TEA-008',
      slug: 'kericho-purple-artisan-tea-250g',
      name: {
        en: 'Kericho Highland Artisan Purple Loose Tea (250g)',
        sw: 'Chai ya Zambarau ya Kericho ya Kiasili (Gramu 250)',
        lg: 'Caayi wa Kericho Owa Kkaki (Gulaamu 250)',
        zh: '肯尼亚凯里乔高海拔天然花青素紫茶 (250克)',
        es: 'Té Morado Artesanal de las Tierras de Kericho (250g)',
        pt: 'Chá Roxo Artesanal de Kericho (250g)',
      },
      description: {
        en: 'An exclusive Kenyan varietal rich in anthocyanins and health polyphenols, grown at 2,000m above sea level with sweet earthy notes and purple hue.',
        sw: 'Aina ya kipekee ya chai ya Kenya iliyo na virutubisho vingi vya afya, inayolimwa mita 2,000 juu ya usawa wa bahari katika mashamba ya Kericho.',
        lg: 'Caayi ow’enjawulo asangibwa mu nsozi z’e Kericho, alina akaloosa akasuffu n’eddagala erizimba omubiri.',
        zh: '生长于东非大裂谷 2000 米高原茶园的肯尼亚特有茶树品种，天然富含高倍花青素，汤色紫润，口感甘醇柔滑。',
        es: 'Una variedad exclusiva de Kenia rica en antocianinas y antioxidantes, cosechada a más de 2.000 metros de altitud.',
        pt: 'Variedade exclusiva do Quênia cultivada a mais de 2.000 metros de altitude em Kericho, rica em antocianinas naturais.',
      },
      price: 950,
      images: [
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_coffee',
      categoryName: 'Kenyan Coffee & Tea',
      stockQuantity: 50,
      isAvailable: true,
      featured: false,
      rating: 4.6,
      reviewCount: 14,
      origin: 'Kericho County',
      weight: '250g Tin',
      createdAt: '2026-02-12T13:00:00Z',
    },
    {
      id: 'prod_009',
      sku: 'ZWD-OLI-009',
      slug: 'kenyan-wild-olive-salad-servers',
      name: {
        en: 'Hand-carved Wild Olive Wood Salad Server Pair',
        sw: 'Vijiko Vikubwa vya Saladi vya Mti wa Mzeituni wa Pori',
        lg: 'Ebijiko by’Emikono eby’Omuti gw’Omuzaituni ogw’omu Nsiko',
        zh: '肯尼亚野生橄榄木手工雕花沙拉勺叉礼盒套',
        es: 'Juego de Cubiertos para Ensalada en Madera de Olivo Silvestre',
        pt: 'Conjunto de Talheres para Salada em Madeira de Oliveira Selvagem',
      },
      description: {
        en: 'Carved from naturally fallen Kenyan wild olive branches, highlighting dramatic grain swirls and finished with organic coconut oil.',
        sw: 'Vimechongwa kutoka kwenye matawi ya miti ya mizaituni iliyoanguka kiasili, vikiwa na mistari mizuri na kupakwa mafuta safi ya nazi.',
        lg: 'Byakolebwa okuva mu miti gy’omuzaituni emizibu, birina enkula ennungi n’obukugu obusuffu.',
        zh: '甄选肯尼亚自然老熟枯落的野生橄榄木整木手工雕琢，木纹如行云流水，天然椰子油养护，安全环保。',
        es: 'Tallados en madera de olivo silvestre de ramas caídas naturalmente, con preciosas vetas y acabado en aceite de coco orgánico.',
        pt: 'Esculpidos em madeira de oliveira selvagem queniana com acabamento em óleo de coco natural, revelando veios únicos.',
      },
      price: 1950,
      images: [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_crafts',
      categoryName: 'Handmade Crafts & Art',
      stockQuantity: 28,
      isAvailable: true,
      featured: false,
      rating: 4.9,
      reviewCount: 18,
      origin: 'Rift Valley Woodcrafters',
      weight: '350g',
      createdAt: '2026-02-15T09:30:00Z',
    },
    {
      id: 'prod_010',
      sku: 'ZWD-BAO-010',
      slug: 'organic-baobab-marula-body-butter',
      name: {
        en: 'Coastal Organic Baobab & Marula Whipped Body Butter (200ml)',
        sw: 'Siagi ya Mwili ya Mbuyu na Marula kutoka Pwani (Mililita 200)',
        lg: 'Omuzigo gw’Omubiri ogwa Baobab ne Marula (Miliriita 200)',
        zh: '肯尼亚沿海野生猴面包树籽油与马鲁拉焕采润肤霜 (200ml)',
        es: 'Manteca Corporal Batida de Baobab y Marula (200ml)',
        pt: 'Manteiga Corporal Batida de Baobá e Marula (200ml)',
      },
      description: {
        en: 'Cold-pressed wild baobab seed oil blended with golden marula oil and raw nilotica shea butter. Deeply nourishing and rejuvenating.',
        sw: 'Mafuta ya mbegu za mbuyu yaliyokamuliwa kiasili yakichanganywa na marula na siagi ya shea. Yanalinda na kulainisha ngozi vizuri sana.',
        lg: 'Ebijanjaalo by’omu nsiko ebirimu amafuta agawa omubiri obulamu n’okunyirira okutukula.',
        zh: '冷压萃取肯尼亚沿海古树猴面包树籽油与黄金马鲁拉果油，深层滋养保湿，抗氧修护肌肤。',
        es: 'Aceite de semilla de baobab silvestre prensado en frío con marula dorada y manteca de karité cruda para una hidratación profunda.',
        pt: 'Óleo de semente de baobá selvagem prensado a frio com marula dourada e manteiga de karité para hidratação intensiva.',
      },
      price: 1650,
      images: [
        'https://images.unsplash.com/photo-1608248597359-5509930773d5?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_organic',
      categoryName: 'Organic Farm Goods',
      stockQuantity: 36,
      isAvailable: true,
      featured: false,
      rating: 4.9,
      reviewCount: 27,
      origin: 'Kilifi, Coastal Kenya',
      weight: '200ml Glass Jar',
      createdAt: '2026-02-18T11:45:00Z',
    },
  ];

  const initialServices: Service[] = [
    {
      id: 'serv_001',
      slug: 'nairobi-national-park-safari',
      name: {
        en: 'Nairobi National Park Half-Day Wildlife Safari & Guide',
        sw: 'Mwongozo wa Safari ya Nusu Siku katika Mbuga ya Wanyama ya Nairobi',
        lg: 'Omukulembeze w’Olugendo mu Kkuumiro ly’Ebisolo ery’e Nairobi',
        zh: '内罗毕国家公园半日野生动物游猎与专业向导服务',
        es: 'Safari de Medio Día y Guía en el Parque Nacional de Nairobi',
        pt: 'Safári de Meio Dia e Guia no Parque Nacional de Nairóbi',
      },
      description: {
        en: 'Experience endangered black rhinos, lions, and giraffes against Nairobi’s skyline. Includes customized 4x4 pop-up roof Land Cruiser and licensed naturalist guide.',
        sw: 'Furahia kuona vifaru weusi walio hatarini, simba, na twiga mbele ya majengo marefu ya Nairobi. Inajumuisha gari la 4x4 na mwongozo mwenye leseni.',
        lg: 'Laba enkula z’ensolo zonna ez’omu kibira n’empologoma nga oli mu mmotoka ennungi eya 4x4 eriko abakulembeze.',
        zh: '置身“世界唯一背靠现代都会天际线的国家公园”，近距离探访濒危黑犀牛、狮群与长颈鹿。配备专业 4x4 顶篷升降游猎越野车与持证自然学家向导。',
        es: 'Observe rinocerontes negros, leones y jirafas frente al horizonte de Nairobi. Incluye vehículo 4x4 adaptado y guía naturalista titulado.',
        pt: 'Veja rinocerontes-negros, leões e girafas com a linha do horizonte de Nairóbi ao fundo. Inclui veículo 4x4 com teto retrátil e guia credenciado.',
      },
      price: 9500,
      duration: '5 Hours (Morning / Afternoon)',
      images: [
        'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_safari',
      categoryName: 'Safari & Tour Guides',
      isAvailable: true,
      featured: true,
      rating: 5.0,
      reviewCount: 46,
      provider: 'Zawadi Certified Naturalist Drivers',
      location: 'Nairobi City & Park Gates',
      createdAt: '2026-01-18T08:00:00Z',
    },
    {
      id: 'serv_002',
      slug: 'solar-pv-home-commercial-audit',
      name: {
        en: 'Solar PV Clean Energy Assessment & Installation Audit',
        sw: 'Tathmini na Ukaguzi wa Mifumo ya Umeme wa Jua kwa Majumba na Biashara',
        lg: 'Okukebera n’Okutegeka Amasannyalaze g’Enjuba mu Mayumba',
        zh: '工商业与民用太阳能光伏系统评估与工程审计',
        es: 'Auditoría Energética e Instalación Solar Fotovoltaica',
        pt: 'Auditoria e Avaliação de Sistemas Solares Fotovoltaicos',
      },
      description: {
        en: 'On-site technical assessment by EPRA-certified engineers in Kenya to calculate your solar capacity, battery storage sizing, and ROI for residential or business premises.',
        sw: 'Ukaguzi wa kitaalamu kutoka kwa wahandisi walioidhinishwa na EPRA kupima uwezo wa umeme wa jua, betri, na jinsi utakavyookoa gharama za umeme.',
        lg: 'Abakugu abalina satifikeeti bajja kukebera ennyumba yo basobole okumanya amasannyalaze g’enjuba agasinga okukuganyula.',
        zh: '由肯尼亚能源监管局（EPRA）认证工程师亲赴现场勘探，定制光伏并网/离网装机容量、储能锂电配置及投资回本周期测算。',
        es: 'Evaluación técnica in situ por ingenieros certificados para dimensionar su instalación solar fotovoltaica, baterías y amortización de inversión.',
        pt: 'Avaliação técnica no local por engenheiros certificados para dimensionar capacidade solar, baterias e retorno financeiro.',
      },
      price: 6500,
      duration: '1 Full Day Technical Survey + Detailed Report',
      images: [
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_business',
      categoryName: 'Business & Professional Services',
      isAvailable: true,
      featured: true,
      rating: 4.8,
      reviewCount: 19,
      provider: 'GreenGrid Kenya EPRA Certified Engineers',
      location: 'Nairobi, Kiambu, Machakos & Nakuru',
      createdAt: '2026-01-24T09:00:00Z',
    },
    {
      id: 'serv_003',
      slug: 'swahili-east-africa-translation-localization',
      name: {
        en: 'Official East African Swahili Translation & Legal Localization',
        sw: 'Ukalimani Rasmi wa Kiswahili cha Afrika Mashariki na Sheria',
        lg: "Okuvvuunula Oluswayiri olw'Obukugu n'Amateeka",
        zh: '东非斯瓦希里语官方商务翻译与涉外法律本地化',
        es: 'Traducción Jurídica y Localización a Suajili de África Oriental',
        pt: 'Tradução Jurídica e Localização em Suaíli da África Oriental',
      },
      description: {
        en: 'Certified translation of business contracts, regulatory submissions, marketing campaigns, and technical manuals into authentic standard Swahili and Luganda.',
        sw: 'Ufasiri wenye vyeti wa mikataba ya kibiashara, hati za kisheria, matangazo ya bidhaa, na miongozo ya kiufundi kwa Kiswahili sanifu na Luganda.',
        lg: 'Okuvvuunula ebiwandiiko by’obusuubuzi, eby’amateeka, n’eby’akatale mu lulimi Oluswayiri olutukuvu n’Oluganda.',
        zh: '提供东非肯尼亚、坦桑尼亚、乌干达标准斯瓦希里语及卢干达语的商务合同、政府合规文件、产品说明书及跨境营销文案精准本地化。',
        es: 'Traducción certificada de contratos mercantiles, normativas y campañas comerciales a suajili estándar y luganda por traductores jurados.',
        pt: 'Tradução juramentada de contratos, documentos regulatórios e campanhas para o suaíli padrão da África Oriental e luganda.',
      },
      price: 4500,
      duration: 'Up to 2,500 Words (48h Turnaround)',
      images: [
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_business',
      categoryName: 'Business & Professional Services',
      isAvailable: true,
      featured: false,
      rating: 5.0,
      reviewCount: 34,
      provider: 'Zawadi East Africa Language Bureau',
      location: 'All East Africa & Digital Delivery',
      createdAt: '2026-01-30T10:00:00Z',
    },
    {
      id: 'serv_004',
      slug: 'nairobi-airport-transfer-vip-chauffeur',
      name: {
        en: 'Nairobi JKIA Airport Private VIP Chauffeur & Luggage Transfer',
        sw: 'Usafiri Binafsi wa VIP wa Uwanja wa Ndege wa JKIA Nairobi',
        lg: "Entambula ey'Ekitiibwa ey'Abagenyi ku Kisaawe ky'e JKIA",
        zh: '内罗毕 JKIA 国际机场贵宾私享专车接送机与行李礼宾服务',
        es: 'Traslado VIP Privado al Aeropuerto Internacional JKIA Nairobi',
        pt: 'Transfer VIP Privado para o Aeroporto Internacional JKIA Nairóbi',
      },
      description: {
        en: 'Executive flight-tracked meet-and-greet at Jomo Kenyatta International Airport with complimentary onboard Wi-Fi, bottled water, and air-conditioned luxury SUV.',
        sw: 'Kupokelewa kwa heshima kwenye Uwanja wa Ndege wa Kimataifa wa Jomo Kenyatta kukiwa na Wi-Fi, maji ya kunywa, na gari la kifahari lenye kiyoyozi.',
        lg: 'Okukusisinkana ku kisaawe kya JKIA mu kitiibwa nga olina Wi-Fi n’amazzi mu mmotoka ey’omulembe.',
        zh: '内罗毕乔莫·肯雅塔国际机场（JKIA）航班动态实时跟踪接送机。配备高端豪华 SUV、车内免费 Wi-Fi、瓶装高山矿泉水及持证专业双语司机。',
        es: 'Servicio privado con seguimiento de vuelo en JKIA, bienvenida personalizada, Wi-Fi a bordo y vehículo SUV de lujo climatizado.',
        pt: 'Recepção personalizada com monitoramento de voo no aeroporto JKIA em SUV executivo com Wi-Fi e ar-condicionado.',
      },
      price: 4000,
      duration: 'One-Way Transfer (24/7 Availability)',
      images: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_safari',
      categoryName: 'Safari & Tour Guides',
      isAvailable: true,
      featured: false,
      rating: 4.9,
      reviewCount: 52,
      provider: 'Zawadi Mobility & Fleet Services',
      location: 'JKIA Airport to Greater Nairobi Hotels',
      createdAt: '2026-02-04T14:00:00Z',
    },
    {
      id: 'serv_005',
      slug: 'ecommerce-daraja-mpesa-onboarding-consult',
      name: {
        en: 'Kenyan SME E-Commerce & Safaricom Daraja M-Pesa Setup',
        sw: 'Ushauri na Uunganishaji wa Tovuti ya Biashara na Safaricom M-Pesa',
        lg: "Entegeka y'Akatale k'Omukutu n'Okusasula kwa M-Pesa",
        zh: '肯尼亚中小企业独立站搭建与 Safaricom Daraja M-Pesa 官方接入部署',
        es: 'Integración E-Commerce y Pasarela Safaricom Daraja M-Pesa para PYMEs',
        pt: 'Integração de E-Commerce e Safaricom Daraja M-Pesa para PMEs',
      },
      description: {
        en: 'Complete architecture setup for Kenyan merchants: Daraja API sandbox to production transition, webhooks, STK push error handling, and accounting reconciliation.',
        sw: 'Ushauri kamili kwa wafanyabiashara wa Kenya: kuunganisha M-Pesa Daraja STK Push, kushughulikia makosa ya malipo, na mfumo wa hesabu.',
        lg: 'Okukuyamba okuteeka M-Pesa ku mukutu gwo n’okusasula okw’amangu n’obukuumi.',
        zh: '资深全栈工程师一对一协助肯尼亚本土商家：完成 Daraja 开发者账号注册、沙箱调试至生产上线、STK Push 异常熔断与自动对账系统闭环。',
        es: 'Configuración técnica completa para comercios en Kenia: transición de Daraja Sandbox a producción, webhooks y conciliación contable.',
        pt: 'Configuração técnica completa para lojistas no Quênia: transição de Sandbox para produção, webhooks e reconciliação financeira.',
      },
      price: 15000,
      duration: '3 Days Implementation & Testing Package',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: 'cat_business',
      categoryName: 'Business & Professional Services',
      isAvailable: true,
      featured: true,
      rating: 5.0,
      reviewCount: 28,
      provider: 'Zawadi Digital Systems Engineers',
      location: 'Virtual / Nairobi Office Consultation',
      createdAt: '2026-02-10T16:00:00Z',
    },
  ];

  const initialOrders: Order[] = [
    {
      id: 'ord_sample_001',
      orderNumber: 'ZWD-2026-1042',
      userId: 'usr_cust_002',
      customerName: 'David Kiprono',
      customerEmail: 'customer@zawadi.co.ke',
      customerPhone: '254798765432',
      deliveryAddress: 'Westlands Commercial Park, Block B, Suite 401',
      county: 'Nairobi',
      town: 'Westlands',
      notes: 'Please call before delivery. Deliver to reception desk.',
      subtotal: 5650,
      deliveryFee: 250,
      discount: 0,
      totalAmount: 5900,
      orderStatus: 'delivered',
      paymentStatus: 'completed',
      paymentMethod: 'mpesa',
      mpesaReceiptNumber: 'NL45K8Z99Q',
      checkoutRequestId: 'ws_CO_240220261145321042',
      items: [
        {
          id: 'item_01',
          orderId: 'ord_sample_001',
          itemId: 'prod_001',
          itemType: 'product',
          name: 'Kenyan AA Single-Origin Coffee Beans (500g)',
          quantity: 2,
          unitPrice: 1850,
          totalPrice: 3700,
          image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'item_02',
          orderId: 'ord_sample_001',
          itemId: 'prod_009',
          itemType: 'product',
          name: 'Hand-carved Wild Olive Wood Salad Server Pair',
          quantity: 1,
          unitPrice: 1950,
          totalPrice: 1950,
          image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        },
      ],
      createdAt: '2026-02-24T11:45:00Z',
      updatedAt: '2026-02-25T14:30:00Z',
    },
    {
      id: 'ord_sample_002',
      orderNumber: 'ZWD-2026-1088',
      userId: 'usr_cust_002',
      customerName: 'Sarah Mwangi',
      customerEmail: 'sarah.mwangi@example.com',
      customerPhone: '254722113355',
      deliveryAddress: 'Lavington Green, James Gichuru Road',
      county: 'Nairobi',
      town: 'Lavington',
      notes: 'Morning safari timing preferred.',
      subtotal: 13300,
      deliveryFee: 0,
      discount: 500,
      totalAmount: 12800,
      orderStatus: 'processing',
      paymentStatus: 'completed',
      paymentMethod: 'mpesa',
      mpesaReceiptNumber: 'NL89M2P11V',
      checkoutRequestId: 'ws_CO_260220260912441088',
      items: [
        {
          id: 'item_03',
          orderId: 'ord_sample_002',
          itemId: 'serv_001',
          itemType: 'service',
          name: 'Nairobi National Park Half-Day Wildlife Safari & Guide',
          quantity: 1,
          unitPrice: 9500,
          totalPrice: 9500,
          image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'item_04',
          orderId: 'ord_sample_002',
          itemId: 'prod_002',
          itemType: 'product',
          name: 'Authentic Maasai Handwoven Kiondo Tote Bag',
          quantity: 1,
          unitPrice: 3800,
          totalPrice: 3800,
          image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
        },
      ],
      createdAt: '2026-02-26T09:12:00Z',
      updatedAt: '2026-02-26T09:20:00Z',
    },
  ];

  const initialPayments: PaymentTransaction[] = [
    {
      id: 'pay_001',
      orderId: 'ord_sample_001',
      orderNumber: 'ZWD-2026-1042',
      amount: 5900,
      phoneNumber: '254798765432',
      merchantRequestId: 'MR-9041-89312',
      checkoutRequestId: 'ws_CO_240220261145321042',
      mpesaReceiptNumber: 'NL45K8Z99Q',
      resultCode: 0,
      resultDesc: 'The service request is processed successfully.',
      status: 'completed',
      environment: 'sandbox',
      createdAt: '2026-02-24T11:45:32Z',
      completedAt: '2026-02-24T11:46:12Z',
    },
    {
      id: 'pay_002',
      orderId: 'ord_sample_002',
      orderNumber: 'ZWD-2026-1088',
      amount: 12800,
      phoneNumber: '254722113355',
      merchantRequestId: 'MR-9042-47201',
      checkoutRequestId: 'ws_CO_260220260912441088',
      mpesaReceiptNumber: 'NL89M2P11V',
      resultCode: 0,
      resultDesc: 'The service request is processed successfully.',
      status: 'completed',
      environment: 'sandbox',
      createdAt: '2026-02-26T09:12:44Z',
      completedAt: '2026-02-26T09:13:18Z',
    },
  ];

  memoryDb = {
    users: initialUsers,
    categories: initialCategories,
    products: initialProducts,
    services: initialServices,
    orders: initialOrders,
    payments: initialPayments,
    wishlists: {
      usr_cust_002: ['prod_001', 'prod_003'],
    },
    carts: {},
  };
}

// Ensure database is initialized on load
loadDb();

// Database Access Methods
export const db = {
  // Users
  getUserByEmail: (email: string) => {
    return memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById: (id: string) => {
    return memoryDb.users.find((u) => u.id === id);
  },
  createUser: (userData: User & { passwordHash: string }) => {
    memoryDb.users.push(userData);
    persistDb();
    return userData;
  },
  updateUserLanguage: (userId: string, lang: SupportedLanguage) => {
    const user = memoryDb.users.find((u) => u.id === userId);
    if (user) {
      user.preferredLanguage = lang;
      persistDb();
      return user;
    }
    return null;
  },
  updateUserProfile: (userId: string, updates: Partial<User>) => {
    const user = memoryDb.users.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      persistDb();
      return user;
    }
    return null;
  },
  getAllUsers: () => memoryDb.users,

  // Categories
  getCategories: () => memoryDb.categories,
  getCategoryById: (id: string) => memoryDb.categories.find((c) => c.id === id),

  // Products
  getProducts: (filter?: {
    categoryId?: string;
    search?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    language?: SupportedLanguage;
  }) => {
    let result = [...memoryDb.products];
    const lang = filter?.language || 'en';

    if (filter?.categoryId) {
      result = result.filter((p) => p.categoryId === filter.categoryId);
    }
    if (filter?.featured !== undefined) {
      result = result.filter((p) => p.featured === filter.featured);
    }
    if (filter?.minPrice !== undefined) {
      result = result.filter((p) => (p.discountPrice || p.price) >= filter.minPrice!);
    }
    if (filter?.maxPrice !== undefined) {
      result = result.filter((p) => (p.discountPrice || p.price) <= filter.maxPrice!);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((p) => {
        const nameMatches = Object.values(p.name).some((n) => n.toLowerCase().includes(q));
        const descMatches = Object.values(p.description).some((d) => d.toLowerCase().includes(q));
        const originMatches = p.origin.toLowerCase().includes(q);
        const skuMatches = p.sku.toLowerCase().includes(q);
        return nameMatches || descMatches || originMatches || skuMatches;
      });
    }

    if (filter?.sortBy) {
      if (filter.sortBy === 'price_asc') {
        result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      } else if (filter.sortBy === 'price_desc') {
        result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      } else if (filter.sortBy === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (filter.sortBy === 'newest') {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return result;
  },
  getProductById: (id: string) => memoryDb.products.find((p) => p.id === id),
  createProduct: (product: Product) => {
    memoryDb.products.unshift(product);
    persistDb();
    return product;
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const idx = memoryDb.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      memoryDb.products[idx] = { ...memoryDb.products[idx], ...updates };
      persistDb();
      return memoryDb.products[idx];
    }
    return null;
  },
  deleteProduct: (id: string) => {
    const idx = memoryDb.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const deleted = memoryDb.products.splice(idx, 1)[0];
      persistDb();
      return deleted;
    }
    return null;
  },

  // Services
  getServices: (filter?: { categoryId?: string; search?: string; featured?: boolean }) => {
    let result = [...memoryDb.services];
    if (filter?.categoryId) {
      result = result.filter((s) => s.categoryId === filter.categoryId);
    }
    if (filter?.featured !== undefined) {
      result = result.filter((s) => s.featured === filter.featured);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((s) => {
        const nameMatches = Object.values(s.name).some((n) => n.toLowerCase().includes(q));
        const descMatches = Object.values(s.description).some((d) => d.toLowerCase().includes(q));
        const providerMatches = s.provider.toLowerCase().includes(q);
        const locMatches = s.location.toLowerCase().includes(q);
        return nameMatches || descMatches || providerMatches || locMatches;
      });
    }
    return result;
  },
  getServiceById: (id: string) => memoryDb.services.find((s) => s.id === id),
  createService: (service: Service) => {
    memoryDb.services.unshift(service);
    persistDb();
    return service;
  },
  updateService: (id: string, updates: Partial<Service>) => {
    const idx = memoryDb.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      memoryDb.services[idx] = { ...memoryDb.services[idx], ...updates };
      persistDb();
      return memoryDb.services[idx];
    }
    return null;
  },
  deleteService: (id: string) => {
    const idx = memoryDb.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const deleted = memoryDb.services.splice(idx, 1)[0];
      persistDb();
      return deleted;
    }
    return null;
  },

  // Orders
  getOrders: (filter?: { userId?: string; status?: string }) => {
    let result = [...memoryDb.orders];
    if (filter?.userId) {
      result = result.filter((o) => o.userId === filter.userId);
    }
    if (filter?.status) {
      result = result.filter((o) => o.orderStatus === filter.status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getOrderById: (id: string) => memoryDb.orders.find((o) => o.id === id || o.orderNumber === id),
  createOrder: (order: Order) => {
    memoryDb.orders.unshift(order);
    persistDb();
    return order;
  },
  updateOrderStatus: (
    id: string,
    orderStatus: Order['orderStatus'],
    paymentStatus?: Order['paymentStatus'],
    mpesaReceipt?: string
  ) => {
    const order = memoryDb.orders.find((o) => o.id === id || o.orderNumber === id);
    if (order) {
      order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      if (mpesaReceipt) order.mpesaReceiptNumber = mpesaReceipt;
      order.updatedAt = new Date().toISOString();
      persistDb();
      return order;
    }
    return null;
  },

  // Payments
  getPayments: () => {
    return [...memoryDb.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  getPaymentByCheckoutId: (checkoutRequestId: string) => {
    return memoryDb.payments.find((p) => p.checkoutRequestId === checkoutRequestId);
  },
  createPaymentTransaction: (tx: PaymentTransaction) => {
    memoryDb.payments.unshift(tx);
    persistDb();
    return tx;
  },
  updatePaymentTransaction: (
    checkoutRequestId: string,
    updates: Partial<PaymentTransaction>
  ) => {
    const tx = memoryDb.payments.find((p) => p.checkoutRequestId === checkoutRequestId);
    if (tx) {
      Object.assign(tx, updates);
      persistDb();
      return tx;
    }
    return null;
  },

  // Wishlist
  getWishlist: (userId: string) => {
    const productIds = memoryDb.wishlists[userId] || [];
    return memoryDb.products.filter((p) => productIds.includes(p.id));
  },
  toggleWishlist: (userId: string, productId: string) => {
    if (!memoryDb.wishlists[userId]) {
      memoryDb.wishlists[userId] = [];
    }
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
    persistDb();
    return { added, list };
  },

  // Analytics
  getAdminStats: () => {
    const totalOrders = memoryDb.orders.length;
    const paidOrders = memoryDb.orders.filter(
      (o) => o.paymentStatus === 'completed' || o.orderStatus === 'paid'
    );
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = memoryDb.orders.filter(
      (o) => o.orderStatus === 'pending' || o.orderStatus === 'payment_pending'
    ).length;
    const totalCustomers = memoryDb.users.filter((u) => u.role === 'customer').length;
    const lowStockProducts = memoryDb.products.filter((p) => p.stockQuantity < 20);

    return {
      totalRevenue,
      totalOrders,
      paidOrdersCount: paidOrders.length,
      pendingOrders,
      totalCustomers,
      productsCount: memoryDb.products.length,
      servicesCount: memoryDb.services.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    };
  },
};
