import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.ts';
import { MpesaService } from './mpesa.ts';
import {
  authenticateToken,
  requireAdmin,
  generateToken,
  AuthenticatedRequest,
} from './auth.ts';
import { Product, Service, Order, SupportedLanguage } from '../types/index.ts';

export const apiRouter = express.Router();

// ==========================================
// AI CHATBOT ASSISTANCE ROUTE (JITU ASSISTANT)
// ==========================================

const JITU_SYSTEM_INSTRUCTION = `You are "Simba AI", the intelligent customer concierge and support assistant for JITU STOREs (Kenya's premier multilingual e-commerce marketplace for authentic Kenyan goods and professional trade services).

Key Knowledge Base:
- Store Name: JITU STOREs (formerly Zawadi Kenya). Motto: Authentic Kenyan Goods & Professional Services.
- Location: Kimathi Street, Nairobi CBD, Kenya. Support: support@jitustores.co.ke, Phone: +254 700 123 456.
- Currencies: All prices are in Kenyan Shillings (KES).
- Payment Method: Official Safaricom Lipa na M-Pesa Daraja STK Push. Customers enter their Safaricom phone number, receive a prompt on their handset, and enter their 4-digit PIN to pay instantly.
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
    const { message, history, language } = req.body;

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
            systemInstruction: JITU_SYSTEM_INSTRUCTION,
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

    // Intelligent Fallback Knowledge Engine (if API key not set or quota reached)
    const lower = message.toLowerCase();
    let reply = '';

    if (lower.includes('mpesa') || lower.includes('m-pesa') || lower.includes('pay') || lower.includes('lipa')) {
      reply = `At JITU STOREs, paying with Safaricom M-Pesa is instant and secure:
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
      reply = `JITU STOREs delivers across all 47 counties in Kenya! Nairobi same-day courier is KES 250 (FREE for orders over KES 10,000 or service bookings). Countrywide delivery takes 24-48 hours via secure courier, and international freight is handled via DHL Express.`;
    } else if (lower.includes('habari') || lower.includes('jambo') || lower.includes('mambo') || lower.includes('asante')) {
      reply = `Jambo sana na karibu JITU STOREs! Mimi ni Simba AI, msaidizi wako wa huduma. Unaweza kuuliza kuhusu bidhaa zetu halisi za Kenya, huduma za kitaalamu, au jinsi ya kulipa kwa urahisi kupitia Safaricom M-Pesa. Je, nikusaidie na nini leo?`;
    } else if (lower.includes('kiondo') || lower.includes('basket') || lower.includes('craft') || lower.includes('art') || lower.includes('soapstone')) {
      reply = `Our handcrafted treasures include authentic Maasai Sisal Kiondo Bags woven by women cooperatives (KES 3,400) and hand-carved Kisii Soapstone sculptures from Tabaka (KES 2,750). Each piece directly supports Kenyan artisans!`;
    } else {
      reply = `Hello and welcome to JITU STOREs! I am Simba AI, your dedicated customer assistant. I can assist you with product recommendations (Kenyan AA coffee, Maasai crafts, organic honey), booking safari or green energy services, tracking your orders, or guiding you through Safaricom M-Pesa STK Push payment. How can I help you today?`;
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

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, preferredLanguage, deliveryAddress, county, town } =
      req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Full name, email, phone, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName,
      email,
      phone: MpesaService.formatPhoneNumber(phone),
      role: 'customer' as const,
      preferredLanguage: (preferredLanguage as SupportedLanguage) || 'en',
      deliveryAddress: deliveryAddress || '',
      county: county || 'Nairobi',
      town: town || 'Nairobi',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    db.createUser(newUser);

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

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
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

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email address.' });
  }

  res.json({
    message: `Password reset instructions have been dispatched to ${email}. Check your inbox.`,
  });
});

apiRouter.put('/auth/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { fullName, phone, deliveryAddress, county, town } = req.body;

  const updated = db.updateUserProfile(req.user.id, {
    fullName: fullName || req.user.fullName,
    phone: phone ? MpesaService.formatPhoneNumber(phone) : req.user.phone,
    deliveryAddress,
    county,
    town,
  });

  res.json({ user: updated, message: 'Profile updated successfully.' });
});

apiRouter.put('/auth/language', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { language } = req.body;

  if (!language || !['en', 'sw', 'lg', 'zh', 'es', 'pt'].includes(language)) {
    return res.status(400).json({ error: 'Valid language code is required.' });
  }

  const updated = db.updateUserLanguage(req.user.id, language as SupportedLanguage);
  res.json({ user: updated, message: 'Language preference saved.' });
});

// ==========================================
// CATEGORIES & PRODUCTS
// ==========================================

apiRouter.get('/categories', (_req: Request, res: Response) => {
  res.json(db.getCategories());
});

apiRouter.get('/products', (req: Request, res: Response) => {
  const { categoryId, search, featured, minPrice, maxPrice, sortBy, language } = req.query;

  const products = db.getProducts({
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

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(product);
});

apiRouter.post('/products', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, description, price, discountPrice, categoryId, stockQuantity, origin, weight, images } =
      req.body;

    if (!name?.en || !price || !categoryId) {
      return res.status(400).json({ error: 'Product name in English, price, and category are required.' });
    }

    const category = db.getCategoryById(categoryId);
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

    const saved = db.createProduct(newProduct);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

apiRouter.put('/products/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(updated);
});

apiRouter.delete('/products/:id', requireAdmin, (req: Request, res: Response) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ message: 'Product deleted successfully', id: req.params.id });
});

// ==========================================
// SERVICES
// ==========================================

apiRouter.get('/services', (req: Request, res: Response) => {
  const { categoryId, search, featured } = req.query;
  const services = db.getServices({
    categoryId: categoryId as string,
    search: search as string,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  });
  res.json(services);
});

apiRouter.get('/services/:id', (req: Request, res: Response) => {
  const service = db.getServiceById(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  res.json(service);
});

apiRouter.post('/services', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, description, price, duration, provider, location, categoryId, images } = req.body;
    if (!name?.en || !price || !categoryId) {
      return res.status(400).json({ error: 'Service name in English, price, and category are required.' });
    }

    const category = db.getCategoryById(categoryId);
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

    const saved = db.createService(newService);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'Failed to create service.' });
  }
});

apiRouter.put('/services/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateService(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  res.json(updated);
});

apiRouter.delete('/services/:id', requireAdmin, (req: Request, res: Response) => {
  const deleted = db.deleteService(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  res.json({ message: 'Service deleted successfully', id: req.params.id });
});

// ==========================================
// ORDERS & CHECKOUT
// ==========================================

apiRouter.post('/orders', (req: Request, res: Response) => {
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

    const orderItems = items.map((i: any, idx: number) => {
      let unitPrice = Number(i.price);
      if (i.itemType === 'product') {
        hasPhysicalItems = true;
        const prod = db.getProductById(i.itemId);
        if (prod) {
          unitPrice = prod.discountPrice || prod.price;
          // Check stock
          if (prod.stockQuantity < i.quantity) {
            throw new Error(`Insufficient stock for product ${prod.name.en}. Only ${prod.stockQuantity} remaining.`);
          }
        }
      } else if (i.itemType === 'service') {
        const serv = db.getServiceById(i.itemId);
        if (serv) {
          unitPrice = serv.price;
        }
      }

      const itemTotal = unitPrice * Number(i.quantity);
      subtotal += itemTotal;

      return {
        id: `oi_${Date.now()}_${idx}`,
        orderId: '',
        itemId: i.itemId,
        itemType: i.itemType,
        name: i.name,
        quantity: Number(i.quantity),
        unitPrice,
        totalPrice: itemTotal,
        image: i.image,
      };
    });

    // Delivery fee: KES 250 for physical products within Kenya, free for services only or over KES 10,000
    const deliveryFee = hasPhysicalItems && subtotal < 10000 ? 250 : 0;
    const discount = 0;
    const totalAmount = subtotal + deliveryFee - discount;

    const orderNumber = `ZWD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord_${Date.now()}`;

    // Update orderId on items
    orderItems.forEach((it: any) => (it.orderId = orderId));

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: userId || 'guest',
      customerName,
      customerEmail: customerEmail || 'guest@zawadi.co.ke',
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
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createOrder(newOrder);

    // Deduct stock for physical items
    orderItems.forEach((it: any) => {
      if (it.itemType === 'product') {
        const prod = db.getProductById(it.itemId);
        if (prod) {
          db.updateProduct(prod.id, {
            stockQuantity: Math.max(0, prod.stockQuantity - it.quantity),
          });
        }
      }
    });

    res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(400).json({ error: err.message || 'Failed to create order.' });
  }
});

apiRouter.get('/orders/user', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const orders = db.getOrders({ userId: req.user.id });
  res.json(orders);
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json(order);
});

// ==========================================
// SAFARICOM M-PESA DARAJA PAYMENTS
// ==========================================

apiRouter.get('/mpesa/config', (_req: Request, res: Response) => {
  res.json(MpesaService.getConfigStatus());
});

apiRouter.post('/mpesa/stk-push', async (req: Request, res: Response) => {
  try {
    const { orderId, orderNumber, amount, phoneNumber } = req.body;

    if (!orderId || !phoneNumber || !amount) {
      return res.status(400).json({
        error: 'Order ID, phone number, and amount are required to initiate M-Pesa payment.',
      });
    }

    const result = await MpesaService.initiateStkPush({
      orderId,
      orderNumber: orderNumber || orderId,
      amount: Number(amount),
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

apiRouter.get('/mpesa/query/:checkoutRequestId', (req: Request, res: Response) => {
  const status = MpesaService.queryTransactionStatus(req.params.checkoutRequestId);
  res.json(status);
});

// Webhook endpoint called by Safaricom
apiRouter.post('/mpesa/callback', (req: Request, res: Response) => {
  console.log('Received M-Pesa Safaricom STK Push callback:', JSON.stringify(req.body));
  const result = MpesaService.handleCallback(req.body);
  // Safaricom expects a 200 OK with ResultCode 0
  res.status(200).json({ ResultCode: 0, ResultDesc: result.message });
});

// Interactive Developer Sandbox Simulation endpoint
apiRouter.post('/mpesa/simulate', (req: Request, res: Response) => {
  const { checkoutRequestId, scenario } = req.body;
  if (!checkoutRequestId || !scenario) {
    return res.status(400).json({ error: 'checkoutRequestId and scenario are required.' });
  }

  const result = MpesaService.simulateSandboxResponse(
    checkoutRequestId,
    scenario as 'success' | 'cancelled' | 'insufficient_funds' | 'timeout'
  );

  res.json(result);
});

// ==========================================
// WISHLIST
// ==========================================

apiRouter.get('/wishlist', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const items = db.getWishlist(req.user.id);
  res.json(items);
});

apiRouter.post('/wishlist/toggle', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID required' });

  const result = db.toggleWishlist(req.user.id, productId);
  res.json(result);
});

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  res.json(db.getAdminStats());
});

apiRouter.get('/admin/orders', requireAdmin, (req: Request, res: Response) => {
  const { status } = req.query;
  const orders = db.getOrders({ status: status as string });
  res.json(orders);
});

apiRouter.put('/admin/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { orderStatus, paymentStatus, mpesaReceiptNumber } = req.body;
  const updated = db.updateOrderStatus(
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

apiRouter.get('/admin/payments', requireAdmin, (_req: Request, res: Response) => {
  res.json(db.getPayments());
});
