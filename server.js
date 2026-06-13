const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Sizning ma'lumotlaringiz
const TOKEN = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const API_URL = 'https://topsmm.uz/api/v2';
const API_KEY = 'f1152704a5c99b2877ec57ad6b53f892';
const PROFIT = 1.25; // 25% ustama

// Botni ishga tushirish
const bot = new TelegramBot(TOKEN, { 
    polling: true,
    filepath: false // Fayl yuklashda xatolarni oldini olish
});

// Foydalanuvchi ma'lumotlarini vaqtincha saqlash (link va xizmat ID uchun)
const userData = {};

// -------------------- API SO'ROVLARI --------------------
// Barcha xizmatlarni olish
async function getServices() {
    try {
        const response = await axios.post(API_URL, {
            key: API_KEY,
            action: 'services'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 soniyada javob bo'lmasa to'xtatish
        });

        // API javobi to'g'ri bo'lsa ma'lumotni qaytarish
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        } else {
            console.error('Xizmatlarni olishda xato:', response.data);
            return [];
        }
    } catch (e) {
        console.error('API xatosi (xizmatlar):', e.message);
        return [];
    }
}

// Balansni olish
async function getBalance() {
    try {
        const response = await axios.post(API_URL, {
            key: API_KEY,
            action: 'balance'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        if (response.data && response.data.balance !== undefined) {
            return response.data;
        } else {
            return { balance: 'Noma’lum', currency: 'USD' };
        }
    } catch (e) {
        console.error('API xatosi (balans):', e.message);
        return { balance: 'Xato', currency: '' };
    }
}

// Buyurtma yaratish
async function createOrder(serviceId, link, quantity) {
    try {
        const response = await axios.post(API_URL, {
            key: API_KEY,
            action: 'add',
            service: serviceId,
            link: link,
            quantity: quantity
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        return response.data;
    } catch (e) {
        console.error('API xatosi (buyurtma):', e.message);
        return { error: e.response?.data?.error || 'Buyurtma yaratishda xato yuz berdi' };
    }
}

// -------------------- BOT ISHLASH QISMI --------------------
// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "👋 SMM botga xush kelibsiz!\nQuyidagi menyudan kerakli bo'limni tanlang:", {
        reply_markup: {
            keyboard: [['📦 Buyurtma berish', '💰 Balansim'], ['📋 Buyurtmalarim']],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

// Xabarlarni qayta ishlash
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Buyurtma berish
    if (text === '📦 Buyurtma berish') {
        const services = await getServices();
        
        if (services.length === 0) {
            return bot.sendMessage(chatId, "❌ Hozircha xizmatlar ro'yxati yuklanmadi yoki serverda xato bor. Keyinroq urinib ko'ring.");
        }

        // Xizmatlarni tugmalarga aylantirish (cheklov yo'q, barchasini chiqaradi)
        const buttons = services.map(s => [{
            text: `${s.name} | ${(s.rate * PROFIT).toFixed(2)} $ / 1000`,
            callback_data: `service_${s.service}`
        }]);

        // Tugmalarni 2 qatorga joylashtirish
        const inlineKeyboard = [];
        for (let i = 0; i < buttons.length; i += 2) {
            inlineKeyboard.push(buttons.slice(i, i + 2).map(b => b[0]));
        }

        bot.sendMessage(chatId, "📋 Mavjud xizmatlar:\nXizmat turini tanlang:", {
            reply_markup: { inline_keyboard: inlineKeyboard }
        });
    }

    // Balansni ko'rish
    else if (text === '💰 Balansim') {
        const balanceData = await getBalance();
        bot.sendMessage(chatId, `💳 Sizning balansingiz: <b>${balanceData.balance} ${balanceData.currency}</b>`, {
            parse_mode: 'HTML'
        });
    }

    // Foydalanuvchidan link yoki son qabul qilish
    else if (userData[chatId]) {
        const data = userData[chatId];

        // 1-qadam: Linkni qabul qilish
        if (data.step === 'awaiting_link') {
            data.link = text.trim();
            data.step = 'awaiting_quantity';
            bot.sendMessage(chatId, "🔢 Buyurtma sonini kiriting (masalan: 100, 500, 1000):");
        }

        // 2-qadam: Sonni qabul qilish va buyurtma yaratish
        else if (data.step === 'awaiting_quantity') {
            const quantity = parseInt(text.trim());
            
            if (isNaN(quantity) || quantity < 1) {
                return bot.sendMessage(chatId, "❌ Noto'g'ri son! Faqat raqam kiriting (masalan: 100). Qaytadan urinib ko'ring:");
            }

            // Buyurtma yaratish
            bot.sendMessage(chatId, "⏳ Buyurtma yaratilmoqda...");
            const result = await createOrder(data.serviceId, data.link, quantity);

            // Natijani chiqarish
            if (result.order) {
                const pricePer1k = data.rate * PROFIT;
                const totalPrice = (pricePer1k * quantity / 1000).toFixed(4);
                
                bot.sendMessage(chatId, `✅ Buyurtma muvaffaqiyatli yaratildi!\n\n🔢 Buyurtma ID: <b>${result.order}</b>\n📌 Xizmat ID: ${data.serviceId}\n🔗 Link: ${data.link}\n📊 Son: ${quantity}\n💸 Umumiy narx: <b>${totalPrice} $</b>`, {
                    parse_mode: 'HTML'
                });
            } else {
                bot.sendMessage(chatId, `❌ Xato: ${result.error || 'Noma’lum xato yuz berdi'}`);
            }

            // Vaqtincha ma'lumotlarni o'chirish
            delete userData[chatId];
        }
    }
});

// Callback so'rovlarini qayta ishlash (xizmat tanlash)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Tanlangan xizmatni saqlash
    if (data.startsWith('service_')) {
        const serviceId = data.split('_')[1];
        const services = await getServices();
        const selectedService = services.find(s => s.service == serviceId);

        if (!selectedService) {
            return bot.sendMessage(chatId, "❌ Tanlangan xizmat topilmadi!");
        }

        // Foydalanuvchi ma'lumotlarini saqlash
        userData[chatId] = {
            serviceId: serviceId,
            rate: selectedService.rate,
            step: 'awaiting_link'
        };

        // Javob berish
        bot.answerCallbackQuery(query.id);
        bot.sendMessage(chatId, `✅ Tanlandi: <b>${selectedService.name}</b>\n💸 Narx: ${(selectedService.rate * PROFIT).toFixed(2)} $ / 1000\n\n🔗 Endi linkni yuboring:`, {
            parse_mode: 'HTML'
        });
    }
});

// Bot xatolarini nazorat qilish
bot.on('polling_error', (error) => {
    console.error('Polling xatosi:', error.code);
});

console.log('✅ Bot muvaffaqiyatli ishga tushdi!');
