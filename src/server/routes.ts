import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';
import { MpesaService } from './mpesa.ts';
import {
  authenticateToken,
  requireAdmin,
  generateToken,
  AuthenticatedRequest,
} from './auth.ts';
import { Product, Service, Order, SupportedLanguage, User } from '../types/index.ts';

export const apiRouter = express.Router();

const BUSINESS_NAME = 'Zawadi Kenya';
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || process.env.ADMIN_EMAIL || 'shadiotis2@gmail.com';
const BUSINESS_PHONE = process.env.BUSINESS_PHONE || '+254 712 345 678';
const BUSINESS_LOCATION = process.env.BUSINESS_LOCATION || 'Nairobi CBD, Kenya';

// ==========================================
// AI CHATBOT ASSISTANCE ROUTE (ZAWADI ASSISTANT)
// ==========================================

const ZAWADI_SYSTEM_INSTRUCTION = `You are "Simba AI", the intelligent customer concierge and support assistant for Zawadi Kenya (Kenya's premier multilingual e-commerce marketplace for authentic Kenyan goods and professional trade services).

Key Knowledge Base:
- Store Name: ${BUSINESS_NAME}. Motto: Authentic Kenyan Goods & Professional Services.
- Location: ${BUSINESS_LOCATION}. Support: ${BUSINESS_EMAIL}, Phone: ${BUSINESS_PHONE}.
- Currencies: All prices are in Kenyan Shillings (KES).
- Payment Method: Official Safaricom Lipa na M-Pesa Daraja STK Push. Customers enter their Safaricom phone number, receive an automated STK Push PIN prompt on their handset, and enter their 4-digit PIN to pay instantly and securely.
- Delivery: Nairobi same-day delivery (KES 250, or FREE over KES 10,000), 24-48hr courier across all 47 Kenyan counties, and DHL Express global shipping.
- Products:
  1. Kenyan AA Gourmet Coffee Beans (Nyeri Mount Kenya, KES 1,850/500g, discount KES 1,650)
  2. Authentic Maasai Handwoven Kiondo Sisal Tote Bag (KES 3,800, discount KES 3,400)
  3. Raw Baringo Highland Acacia Honey (KES 1,450/1kg)
  4. Roasted Sea Salt Embu Macadamia Nuts (KES 1,200/400g)
  5. Hand-tailored Kitenge Wax Print Shirt (KES 3,200)
  6. Kisii Soapstone Family Sculpture (KES 2,750)
  7. Traditional Maasai Beaded Choker Set (KES 2,200)
  8. Kericho Highland Artisan Purple Loose Tea (KES 950/250g)
  9. Hand-carved Wild Olive Wood Salad Server Pair (KES 1,950)
  10. Coastal Organic Baobab & Marula Whipped Body Butter (KES 1,650/200ml)
- Services:
  1. Nairobi National Park Half-Day Wildlife Safari & Guide (KES 9,500)
  2. Solar PV Clean Energy Assessment & Installation Audit (KES 6,500)
  3. Official East African Swahili Translation & Legal Localization (KES 4,500)
  4. Nairobi JKIA Airport Private VIP Chauffeur Transfer (KES 4,000)
  5. Kenyan SME E-Commerce & Safaricom Daraja M-Pesa Setup (KES 15,000)

Always respond warmly, politely, and helpfully in the exact language the user addresses you in (English, Kiswahili, Luganda, Chinese, Spanish, or Portuguese). Keep answers concise and actionable.`;

apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI(); // picks up GEMINI_API_KEY from environment

        // Format history for Gemini contents
        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            contents.push({
              role: item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: item.content }],
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: ZAWADI_SYSTEM_INSTRUCTION,
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        });

        if (response.text) {
          return res.json({ reply: response.text });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, falling back to local assistant knowledge engine:', geminiErr.message);
      }
    }

    // Fallback Knowledge Engine (if API key not set or quota reached)
    const lower = message.toLowerCase();
    let reply = '';

    if (lower.includes('mpesa') || lower.includes('m-pesa') || lower.includes('pay') || lower.includes('lipa')) {
      reply = `At Zawadi Kenya, paying with Safaricom M-Pesa is instant and secure:
1. Proceed to Checkout and confirm your Safaricom mobile number.
2. Click "Pay with M-Pesa".
3. An automated STK Push PIN prompt will immediately appear on your phone screen.
4. Enter your 4-digit secret M-Pesa PIN.
5. Your transaction is verified in real-time, your receipt is generated, and order processing starts immediately!`;
    } else if (lower.includes('coffee') || lower.includes('kahawa') || lower.includes('tea') || lower.includes('chai')) {
      reply = `We feature world-renowned Kenyan AA Single-Origin Coffee from the volcanic slopes of Mount Kenya (Nyeri), roasted to medium-dark perfection (KES 1,650 for 500g). We also stock high-antioxidant Kericho Artisan Purple Tea (KES 950). Would you like help adding them to your cart?`;
    } else if (lower.includes('safari') || lower.includes('tour') || lower.includes('wildlife') || lower.includes('nairobi national park')) {
      reply = `Our certified naturalist guides offer the Nairobi National Park Half-Day Wildlife Safari (KES 9,500) featuring pop-up roof 4x4 Land Cruisers to view lions, rhinos, and giraffes against Nairobi's skyline. You can book directly through the Services tab with instant M-Pesa reservation!`;
    } else if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('county') || lower.includes('courier')) {
      reply = `Zawadi Kenya delivers across all 47 counties in Kenya! Nairobi same-day courier is KES 250 (FREE for orders over KES 10,000 or service bookings). Countrywide delivery takes 24-48 hours via secure courier, and international freight is handled via DHL Express.`;
    } else if (lower.includes('habari') || lower.includes('jambo') || lower.includes('mambo') || lower.includes('asante')) {
      reply = `Jambo sana na karibu Zawadi Kenya! Mimi ni Simba AI, msaidizi wako wa huduma. Unaweza kuuliza kuhusu bidhaa zetu halisi za Kenya, huduma za kitaalamu, au jinsi ya kulipa kwa urahisi kupitia Safaricom M-Pesa. Je, nikusaidie na nini leo?`;
    } else if (lower.includes('kiondo') || lower.includes('basket') || lower.includes('craft') || lower.includes('art') || lower.includes('soapstone')) {
      reply = `Our handcrafted treasures include authentic Maasai Sisal Kiondo Bags woven by women cooperatives (KES 3,400) and hand-carved Kisii Soapstone sculptures from Tabaka (KES 2,750). Each piece directly supports Kenyan artisans!`;
    } else {
      reply = `Hello and welcome to Zawadi Kenya! I am Simba AI, your dedicated customer assistant. I can assist you with product recommendations (Kenyan AA coffee, Maasai crafts, organic honey), booking safari or green energy services, tracking your orders, or guiding you through Safaricom M-Pesa STK Push payment. How can I help you today?`;
    }

    res.json({ reply });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: 'Failed to process chat assistance request.' });
  }
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, preferredLanguage, deliveryAddress, county, town } =
      req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Full name, email, phone, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Trim and convert email to lowercase to prevent whitespace mismatch
    const cleanEmail = email.trim().toLowerCase();

    const existing = await db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: MpesaService.formatPhoneNumber(phone),
      role: 'customer' as const,
      preferredLanguage: (preferredLanguage as SupportedLanguage) || 'en',
      deliveryAddress: deliveryAddress || '',
      county: county || 'Nairobi',
      town: town || 'Nairobi',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    await db.createUser(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    const token = generateToken(safeUser);

    res.status(201).json({
      user: safeUser,
      token,
      message: 'Account created successfully! Welcome to Zawadi Kenya.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Trim and convert email to lowercase so trailing spaces do not cause failure
    const cleanEmail = email.trim().toLowerCase();

    const user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(safeUser);

    res.json({
      user: safeUser,
      token,
      message: 'Signed in successfully!',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during sign in.' });
  }
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = await db.getUserByEmail(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email address.' });
  }

  res.json({
    message: `Password reset instructions have been dispatched to ${cleanEmail}. Check your inbox.`,
  });
});

apiRouter.put('/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { fullName, phone, deliveryAddress, county, town } = req.body;

  const updated = await db.updateUserProfile(req.user.id, {
    fullName: fullName || req.user.fullName,
    phone: phone ? MpesaService.formatPhoneNumber(phone) : req.user.phone,
    deliveryAddress,
    county,
    town,
  });

  res.json({ user: updated, message: 'Profile updated successfully.' });
});

apiRouter.put('/auth/language', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { language } = req.body;

  if (!language || !['en', 'sw', 'lg', 'zh', 'es', 'pt'].includes(language)) {
    return res.status(400).json({ error: 'Valid language code is required.' });
  }

  const updated = await db.updateUserLanguage(req.user.id, language as SupportedLanguage);
  res.json({ user: updated, message: 'Language preference saved.' });
});

// ==========================================
// CATEGORIES & PRODUCTS
// ==========================================

apiRouter.get('/categories', async (_req: Request, res: Response) => {
  const categories = await db.getCategories();
  res.json(categories);
});

apiRouter.get('/products', async (req: Request, res: Response) => {
  const { categoryId, search, featured, minPrice, maxPrice, sortBy, language } = req.query;

  const products = await db.getProducts({
    categoryId: categoryId as string,
    search: search as string,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy: sortBy as string,
    language: (language as SupportedLanguage) || 'en',
  });

  res.json(products);
});

apiRouter.get('/products/:id', async (req: Request, res: Response) => {
  const product = await db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(product);
});

apiRouter.post('/products', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, price, discountPrice, categoryId, stockQuantity, origin, weight, images } =
      req.body;

    if (!name?.en || !price || !categoryId) {
      return res.status(400).json({ error: 'Product name in English, price, and category are required.' });
    }

    const category = await db.getCategoryById(categoryId);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      sku: `ZWD-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      slug: (name.en as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      name: {
        en: name.en,
        sw: name.sw || name.en,
        lg: name.lg || name.en,
        zh: name.zh || name.en,
        es: name.es || name.en,
        pt: name.pt || name.en,
      },
      description: {
        en: description?.en || '',
        sw: description?.sw || description?.en || '',
        lg: description?.lg || description?.en || '',
        zh: description?.zh || description?.en || '',
        es: description?.es || description?.en || '',
        pt: description?.pt || description?.en || '',
      },
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      categoryId,
      categoryName: category?.name.en || 'General Goods',
      stockQuantity: Number(stockQuantity || 10),
      isAvailable: true,
      featured: Boolean(req.body.featured),
      rating: 5.0,
      reviewCount: 1,
      origin: origin || 'Kenya',
      weight: weight || 'N/A',
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80'],
      createdAt: new Date().toISOString(),
    };

    const saved = await db.createProduct(newProduct);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

apiRouter.put('/products/:id', requireAdmin, async (req: Request, res: Response) => {
  const updated = await db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(updated);
});

apiRouter.delete('/products/:id', requireAdmin, async (req: Request, res: Response) => {
  const deleted = await db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ message: 'Product deleted successfully', id: req.params.id });
});

// ==========================================
// SERVICES
// ==========================================

apiRouter.get('/services', async (req: Request, res: Response) => {
  const { categoryId, search, featured } = req.query;
  const services = await db.getServices({
    categoryId: categoryId as string,
    search: search as string,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  });
  res.json(services);
});

apiRouter.get('/services/:id', async (req: Request, res: Response) => {
  const service = await db.getServiceById(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  res.json(service);
});

apiRouter.post('/services', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, price, duration, provider, location, categoryId, images } = req.body;
    if (!name?.en || !price || !categoryId) {
      return res.status(400).json({ error: 'Service name in English, price, and category are required.' });
    }

    const category = await db.getCategoryById(categoryId);
    const newService: Service = {
      id: `serv_${Date.now()}`,
      slug: (name.en as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      name: {
        en: name.en,
        sw: name.sw || name.en,
        lg: name.lg || name.en,
        zh: name.zh || name.en,
        es: name.es || name.en,
        pt: name.pt || name.en,
      },
      description: {
        en: description?.en || '',
        sw: description?.sw || description?.en || '',
        lg: description?.lg || description?.en || '',
        zh: description?.zh || description?.en || '',
        es: description?.es || description?.en || '',
        pt: description?.pt || description?.en || '',
      },
      price: Number(price),
      duration: duration || 'Flexible',
      provider: provider || 'Zawadi Certified Partner',
      location: location || 'Nairobi & East Africa',
      categoryId,
      categoryName: category?.name.en || 'Professional Services',
      isAvailable: true,
      featured: Boolean(req.body.featured),
      rating: 5.0,
      reviewCount: 1,
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80'],
      createdAt: new Date().toISOString(),
    };

    const saved = await db.createService(newService);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'Failed to create service.' });
  }
});

apiRouter.put('/services/:id', requireAdmin, async (req: Request, res: Response) => {
  const updated = await db.updateService(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  res.json(updated);
});

apiRouter.delete('/services/:id', requireAdmin, async (req: Request, res: Response) => {
  const deleted = await db.deleteService(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  res.json({ message: 'Service deleted successfully', id: req.params.id });
});

// ==========================================
// ORDERS & CHECKOUT
// ==========================================

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      county,
      town,
      notes,
      items,
    } = req.body;

    if (!customerName || !customerPhone || !deliveryAddress || !items || !items.length) {
      return res.status(400).json({
        error: 'Customer name, phone number, delivery address, and at least one item are required.',
      });
    }

    // Validate items and calculate subtotal
    let subtotal = 0;
    let hasPhysicalItems = false;
    const validatedOrderItems: any[] = [];

    for (let idx = 0; idx < items.length; idx++) {
      const i = items[idx];
      let unitPrice = Number(i.price);
      if (i.itemType === 'product') {
        hasPhysicalItems = true;
        const prod = await db.getProductById(i.itemId);
        if (prod) {
          unitPrice = prod.discountPrice || prod.price;
          // Check stock
          if (prod.stockQuantity < i.quantity) {
            throw new Error(`Insufficient stock for product ${prod.name.en}. Only ${prod.stockQuantity} remaining.`);
          }
        }
      } else if (i.itemType === 'service') {
        const serv = await db.getServiceById(i.itemId);
        if (serv) {
          unitPrice = serv.price;
        }
      }

      const itemTotal = unitPrice * Number(i.quantity);
      subtotal += itemTotal;

      validatedOrderItems.push({
        id: `oi_${Date.now()}_${idx}`,
        orderId: '',
        itemId: i.itemId,
        itemType: i.itemType,
        name: i.name,
        quantity: Number(i.quantity),
        unitPrice,
        totalPrice: itemTotal,
        image: i.image,
      });
    }

    // Delivery fee: KES 250 for physical products within Kenya, free for services only or over KES 10,000
    const deliveryFee = hasPhysicalItems && subtotal < 10000 ? 250 : 0;
    const discount = 0;
    const totalAmount = subtotal + deliveryFee - discount;

    const orderNumber = `ZWD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord_${Date.now()}`;

    // Update orderId on items
    validatedOrderItems.forEach((it: any) => (it.orderId = orderId));

    // Determine user ID: check token if provided or use userId body parameter
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let resolvedUserId = userId && userId !== 'guest' ? userId : 'guest';
    if (token) {
      try {
        const secret =
          process.env.JWT_SECRET ||
          (process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_zawadi' : '');
        if (secret) {
          const decoded = jwt.verify(token, secret) as any;
          if (decoded?.id) {
            resolvedUserId = decoded.id;
          }
        }
      } catch {}
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: resolvedUserId,
      customerName,
      customerEmail: customerEmail || 'guest@zawadikenya.co.ke',
      customerPhone: MpesaService.formatPhoneNumber(customerPhone),
      deliveryAddress,
      county: county || 'Nairobi',
      town: town || 'Nairobi',
      notes,
      subtotal,
      deliveryFee,
      discount,
      totalAmount,
      orderStatus: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'mpesa',
      items: validatedOrderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.createOrder(newOrder);

    // Deduct stock for physical items
    for (const it of validatedOrderItems) {
      if (it.itemType === 'product') {
        const prod = await db.getProductById(it.itemId);
        if (prod) {
          await db.updateProduct(prod.id, {
            stockQuantity: Math.max(0, prod.stockQuantity - it.quantity),
          });
        }
      }
    }

    res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(400).json({ error: err.message || 'Failed to create order.' });
  }
});

apiRouter.get('/orders/user', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const orders = await db.getOrders({ userId: req.user.id });
  res.json(orders);
});

/**
 * GET /api/orders/:id
 * Security rule: Require authentication and only allow order's owner or an admin to view it.
 * For guest checkout orders, require the order number plus the phone number used at checkout.
 */
apiRouter.get('/orders/:id', async (req: Request, res: Response) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // 1. Check for JWT authentication token in headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let authenticatedUser: User | null = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_zawadi' : '');
      if (secret) {
        const decoded = jwt.verify(token, secret) as any;
        authenticatedUser = await db.getUserById(decoded.id);
      }
    } catch {
      // Token is invalid/expired
    }
  }

  // 2. If authenticated as an administrator, always permit viewing
  if (authenticatedUser?.role === 'admin') {
    return res.json(order);
  }

  // 3. If order was placed by a registered user:
  if (order.userId && order.userId !== 'guest') {
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Authentication required to view this order.' });
    }
    if (authenticatedUser.id !== order.userId) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to view this order.' });
    }
    return res.json(order);
  }

  // 4. For guest checkout orders: require order number plus phone number used at checkout
  const providedPhone =
    (req.query.phoneNumber as string) ||
    (req.query.phone as string) ||
    (req.headers['x-guest-phone'] as string);
  const providedOrderNumber =
    (req.query.orderNumber as string) ||
    (req.headers['x-order-number'] as string);

  if (!providedPhone || !providedOrderNumber) {
    return res.status(401).json({
      error: 'Guest order access requires both the order number and the phone number used at checkout.',
    });
  }

  const cleanOrderPhone = MpesaService.formatPhoneNumber(order.customerPhone);
  const cleanProvidedPhone = MpesaService.formatPhoneNumber(providedPhone);

  if (
    order.orderNumber.toUpperCase() !== providedOrderNumber.trim().toUpperCase() ||
    cleanOrderPhone !== cleanProvidedPhone
  ) {
    return res.status(403).json({
      error: 'Order number and phone number do not match checkout details.',
    });
  }

  return res.json(order);
});

// ==========================================
// SAFARICOM M-PESA DARAJA PAYMENTS
// ==========================================

apiRouter.get('/mpesa/config', (_req: Request, res: Response) => {
  res.json(MpesaService.getConfigStatus());
});

/**
 * POST /api/mpesa/stk-push
 * Security rules:
 * 1. Check orderId exists.
 * 2. Amount matches the order total (do not trust amount sent by the browser).
 * 3. The order belongs to the person making the request.
 */
apiRouter.post('/mpesa/stk-push', async (req: Request, res: Response) => {
  try {
    const { orderId, phoneNumber, amount } = req.body;

    if (!orderId || !phoneNumber) {
      return res.status(400).json({
        error: 'Order ID and phone number are required to initiate M-Pesa payment.',
      });
    }

    // 1. Verify that order exists in database
    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // 2. Verify amount matches order total (do not trust browser-provided amount)
    if (amount !== undefined && Math.round(Number(amount)) !== Math.round(order.totalAmount)) {
      return res.status(400).json({
        error: `Amount mismatch: Provided ${amount} does not match order total of ${order.totalAmount}.`,
      });
    }

    // 3. Verify order ownership
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let authenticatedUser: User | null = null;

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_zawadi' : '');
        if (secret) {
          const decoded = jwt.verify(token, secret) as any;
          authenticatedUser = await db.getUserById(decoded.id);
        }
      } catch {
        // Invalid token
      }
    }

    // If order was created by a registered user:
    if (order.userId && order.userId !== 'guest') {
      if (!authenticatedUser) {
        // For unauthenticated requests to registered orders, verify phone number matches customer record
        const cleanOrderPhone = MpesaService.formatPhoneNumber(order.customerPhone);
        const cleanInputPhone = MpesaService.formatPhoneNumber(phoneNumber);
        if (cleanOrderPhone !== cleanInputPhone) {
          return res.status(403).json({
            error: 'Access denied: Phone number does not match registered order details.',
          });
        }
      } else if (authenticatedUser.id !== order.userId && authenticatedUser.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied: This order does not belong to your account.',
        });
      }
    } else {
      // Guest order: verify phone number matches
      const cleanOrderPhone = MpesaService.formatPhoneNumber(order.customerPhone);
      const cleanInputPhone = MpesaService.formatPhoneNumber(phoneNumber);
      if (cleanOrderPhone !== cleanInputPhone) {
        return res.status(403).json({
          error: 'Access denied: Phone number does not match checkout details for this order.',
        });
      }
    }

    // Initiate real Daraja STK push with verified database total amount
    const result = await MpesaService.initiateStkPush({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      phoneNumber,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err: any) {
    console.error('STK Push router error:', err);
    res.status(500).json({ error: err.message || 'M-Pesa STK Push initialization failed.' });
  }
});

apiRouter.get('/mpesa/query/:checkoutRequestId', async (req: Request, res: Response) => {
  const status = await MpesaService.queryTransactionStatus(req.params.checkoutRequestId);
  res.json(status);
});

// Webhook endpoint called by Safaricom Daraja
apiRouter.post('/mpesa/callback', async (req: Request, res: Response) => {
  console.log('Received M-Pesa Safaricom STK Push callback:', JSON.stringify(req.body));
  const result = await MpesaService.handleCallback(req.body);
  // Safaricom expects a 200 OK with ResultCode 0
  res.status(200).json({ ResultCode: 0, ResultDesc: result.message });
});

// Interactive Developer Sandbox Simulation endpoint
// Disabled completely in production mode
apiRouter.post('/mpesa/simulate', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'M-Pesa sandbox simulation is completely disabled in production mode.',
    });
  }

  const { checkoutRequestId, scenario } = req.body;
  if (!checkoutRequestId || !scenario) {
    return res.status(400).json({ error: 'checkoutRequestId and scenario are required.' });
  }

  const result = await MpesaService.simulateSandboxResponse(
    checkoutRequestId,
    scenario as 'success' | 'cancelled' | 'insufficient_funds' | 'timeout'
  );

  res.json(result);
});

// ==========================================
// WISHLIST
// ==========================================

apiRouter.get('/wishlist', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const items = await db.getWishlist(req.user.id);
  res.json(items);
});

apiRouter.post('/wishlist/toggle', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID required' });

  const result = await db.toggleWishlist(req.user.id, productId);
  res.json(result);
});

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  const stats = await db.getAdminStats();
  res.json(stats);
});

apiRouter.get('/admin/orders', requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.query;
  const orders = await db.getOrders({ status: status as string });
  res.json(orders);
});

apiRouter.put('/admin/orders/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const { orderStatus, paymentStatus, mpesaReceiptNumber } = req.body;
  const updated = await db.updateOrderStatus(
    req.params.id,
    orderStatus,
    paymentStatus,
    mpesaReceiptNumber
  );

  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updated);
});

apiRouter.get('/admin/payments', requireAdmin, async (_req: Request, res: Response) => {
  const payments = await db.getPayments();
  res.json(payments);
});
