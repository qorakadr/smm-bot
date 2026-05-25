const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const fs = require('fs');

// Ma'lumotlarni saqlash uchun o'zgaruvchilar
let users = [];
let referrals = {};
let userStep = {};
let orders = {};
let balances = {}; // Balans tizimi

// ⚙️ ASOSIY SOZLAMALAR
const CARD_NUMBER = '9860350144650842';
const CARD_NAME = 'ODILJON OCHILOV';
const ADMIN_USERNAME = 'SMM_adminMAX'; // @ siz yozing
const WELCOME_IMAGE = 'https://i.imgur.com/7ZbXQ8L.jpg'; // Xush kelibsiz rasmi

// 👇 MAJBURIY KANAL SOZLAMASI
// Bu yerga o'z kanalingizni usernameni yozing (masalan: @smm_uz)
const REQUIRED_CHANNEL = '@xabarlar24uzbekiston'; 

// 👇 XIZMATLAR RO'YXATI (Siz keyin to'ldirasiz, hozircha namuna)
const SERVICES = {
    tiktok: {
        title: "🎵 TikTok Xizmatlari",
        list: [
            { id: 1, name: "1. Ko'rishlar", price: 2000 },
            { id: 2, name: "2. Layklar", price: 3000 },
            { id: 3, name: "3. Obunachilar", price: 8000 },
            { id: 4, name: "4. Jonli efir tomoshabin", price: 15000 }
        ]
    },
    instagram: {
        title: "📸 Instagram Xizmatlari",
        list: [
            { id: 5, name: "1. Obunachilar", price: 10000 },
            { id: 6, name: "2. Layklar", price: 2500 }
        ]
    },
    telegram: {
        title: "📢 Telegram Xizmatlari",
        list: [
            { id: 7, name: "1. Kanal a'zolari", price: 7000 },
            { id: 8, name: "2. Guruh a'zolari", price: 8000 }
        ]
    },
    youtube: {
        title: "▶️ YouTube Xizmatlari",
        list: [
            { id: 9, name: "1. Ko'rishlar", price: 5000 },
            { id: 10, name: "2. Obunachilar", price: 20000 }
        ]
    }
};

// Fayllardan ma'lumotlarni yuklash
if (fs.existsSync('orders.json')) {
    try { orders = JSON.parse(fs.readFileSync('orders.json', 'utf8')); } catch (e) { orders = {}; }
}
if (fs.existsSync('users.json')) {
    try { users = JSON.parse(fs.readFileSync('users.json', 'utf8')); } catch (e) { users = []; }
}
if (fs.existsSync('referrals.json')) {
    try { referrals = JSON.parse(fs.readFileSync('referrals.json', 'utf8')); } catch (e) { referrals = {}; }
}
if (fs.existsSync('balances.json')) {
    try { balances = JSON.parse(fs.readFileSync('balances.json', 'utf8')); } catch (e) { balances = {}; }
}

// Bot tokeni
const token = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const bot = new TelegramBot(token, { polling: true });

// -------------------- FUNKSIYALAR --------------------

// Kanalga a'zo bo'lganligini tekshirish funksiyasi
async function checkSubscription(userId) {
    try {
        const chatMember = await bot.getChatMember(REQUIRED_CHANNEL, userId);
        // Agar a'zo bo'lsa true qaytaradi
        return ['creator', 'administrator', 'member'].includes(chatMember.status);
    } catch (e) {
        console.log("Kanal tekshiruvida xatolik:", e.message);
        return false;
    }
}

// ASOSIY MENYU - SIZ AYTGAN TUGMALAR BILAN
function sendMainMenu(chatId) {
    bot.sendPhoto(chatId, WELCOME_IMAGE, {
        caption: '🔥 ASSALOMU ALAYKUM!\n\n🚀 SMM ADMIN BOTGA XUSH KELIBSIZ\n\nQuyidagi bo\'limlardan foydalaning:',
        reply_markup: {
            keyboard: [
                ['📱 Nomer olish'],
                ['🛒 SMM Xizmatlar'],
                ['💳 Mening hisobim'],
                ['📦 Buyurtmalarim'],
                ['💰 Hisobni to‘ldirish'],
                ['🔗 Referal havola']
            ],
            resize_keyboard: true
        }
    });
    // Eski qadamlarni o'chirish
    delete userStep[chatId];
}

// -------------------- BUYRUQLAR QISMI --------------------

// /start buyrug'i
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const refId = msg.text.split(' ')[1];

    // 🔴 1-QADAM: Kanalga a'zolikni tekshirish
    const isSubscribed = await checkSubscription(userId);
    if (!isSubscribed) {
        return bot.sendMessage(chatId, 
            `❌ Botdan to'liq foydalanish uchun avval kanalimizga a'zo bo'lishingiz shart!\n\n👉 ${REQUIRED_CHANNEL}\n\n✅ A'zo bo'lgandan so'ng /start buyrug'ini qayta bosing.`
        );
    }

    // 🔵 2-QADAM: Foydalanuvchini ro'yxatga olish
    if (!users.includes(userId)) {
        users.push(userId);
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
        balances[userId] = balances[userId] || 0; // Balansni 0 ga tenglash
        fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));

        // Referal tizimi
        if (refId && refId != userId) {
            if (!referrals[refId]) referrals[refId] = 0;
            referrals[refId]++;
            fs.writeFileSync('referrals.json', JSON.stringify(referrals, null, 2));
        }
    }

    // 🟢 3-QADAM: Asosiy menyuni chiqarish
    sendMainMenu(chatId);
});

// /ref buyrug'i
bot.onText(/\/ref/, (msg) => {
    const userId = msg.from.id;
    const count = referrals[userId] || 0;
    const link = `https://t.me/SMM_adminMAX_bot?start=${userId}`;
    bot.sendMessage(msg.chat.id, 
        '🔗 REFERAL HAVOLA\n\n' +
        'Do\'stlaringizni taklif qiling va balansingizga pul ishlang!\n\n' +
        '👉 Sizning havolangiz:\n' + link + '\n\n' +
        '👤 Taklif qilinganlar soni: ' + count
    );
});

// /stats buyrug'i (Admin uchun)
bot.onText(/\/stats/, (msg) => {
    if (msg.from.username !== ADMIN_USERNAME) return bot.sendMessage(msg.chatId, '❌ Siz admin emassiz');
    bot.sendMessage(msg.chat.id, 
        '📊 BOT STATISTIKASI\n\n' +
        '👥 Foydalanuvchilar: ' + users.length + '\n' +
        '📦 Buyurtmalar: ' + Object.keys(orders).length + '\n' +
        '🔗 Takliflar: ' + Object.values(referrals).reduce((a,b) => a+b, 0)
    );
});

// -------------------- TUGMALARNI QAYTA ISHLASH --------------------

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Buyruqlarni o'tkazib yuborish
    if (!text || text.startsWith('/')) return;

    // Har qanday amaldan oldin yana tekshirish (agar foydalanuvchi kanaldan chiqib ketgan bo'lsa)
    const isSubscribed = await checkSubscription(userId);
    if (!isSubscribed) {
        return bot.sendMessage(chatId, 
            `❌ Botdan foydalanish uchun avval kanalimizga a'zo bo'ling!\n\n👉 ${REQUIRED_CHANNEL}\n\n✅ /start`
        );
    }

    // 👇 BU YERDA SIZ AYGAN YANGI TUGMALAR ISHLAYDI

    // 📱 1. Nomer olish
    if (text === '📱 Nomer olish') {
        return bot.sendMessage(chatId, 
            '📱 Nomer olish bo\'limi\n\n' +
            'Bu bo\'limning ichki qismini va qanday ishlashini menga yozib bering, men kodga qo\'shaman!\n' +
            'Masalan: Mamlakat tanlash, Kod olish va h.k.'
        );
    }

    // 🛒 2. SMM Xizmatlar
    if (text === '🛒 SMM Xizmatlar') {
        return bot.sendMessage(chatId, '👇 Quyidagi platformalardan birini tanlang:', {
            reply_markup: {
                keyboard: [
                    ['🎵 TikTok', '📸 Instagram'],
                    ['📢 Telegram', '▶️ YouTube'],
                    ['🔙 Asosiy menyu']
                ],
                resize_keyboard: true
            }
        });
    }

    // 💳 3. Mening hisobim
    if (text === '💳 Mening hisobim') {
        const balans = balances[userId] || 0;
        return bot.sendMessage(chatId, 
            '💳 SIZNING HISOBINGIZ\n\n' +
            `🆔 ID: ${userId}\n` +
            `💰 Mavjud balans: ${balans} so'm\n\n` +
            'Hisobni to\'ldirish uchun "Hisobni to\'ldirish" tugmasini bosing.'
        );
    }

    // 📦 4. Buyurtmalarim
    if (text === '📦 Buyurtmalarim') {
        let myOrdersText = '📦 SIZNING BUYURTMALARINGIZ\n\n';
        let hasOrders = false;

        for (let orderId in orders) {
            if (orders[orderId].userId === userId) {
                myOrdersText += `🔹 ID: ${orderId}\n`;
                myOrdersText += `📋 Xizmat: ${orders[orderId].serviceName}\n`;
                myOrdersText += `📦 Miqdor: ${orders[orderId].count}\n`;
                myOrdersText += `💸 Summa: ${orders[orderId].summa} so'm\n`;
                myOrdersText += `📌 Holat: ${orders[orderId].status || 'Kutilmoqda'}\n\n`;
                hasOrders = true;
            }
        }
        return bot.sendMessage(chatId, hasOrders ? myOrdersText : '❌ Sizda hozircha buyurtmalar yo\'q');
    }

    // 💰 5. Hisobni to‘ldirish
    if (text === '💰 Hisobni to‘ldirish') {
        return bot.sendMessage(chatId, 
            '💰 HISOBNI TO‘LDIRISH\n\n' +
            'To\'lov quyidagi karta orqali amalga oshiring:\n\n' +
            `💳 Karta: ${CARD_NUMBER}\n` +
            `👤 Ism: ${CARD_NAME}\n\n` +
            '📑 To\'lovdan so\'ng chekni yuboring yoki summani kiriting...\n' +
            '(Bu qismni siz aytganingizcha to\'liq sozlaymiz)'
        );
    }

    // 🔗 6. Referal havola
    if (text === '🔗 Referal havola') {
        const count = referrals[userId] || 0;
        const link = `https://t.me/SMM_adminMAX_bot?start=${userId}`;
        return bot.sendMessage(chatId,
            '🔗 REFERAL HAVOLA\n\n' +
            '🔗 Havola: ' + link + '\n' +
            '👤 Taklif qilinganlar: ' + count + ' ta'
        );
    }

    // 🔙 ORQAGA QAYTISH TUGMASI
    if (text === '🔙 Asosiy menyu') {
        sendMainMenu(chatId);
        return;
    }

    // -------------------- SMM XIZMATLARI ICHKI QISMI --------------------

    // TikTok
    if (text === '🎵 TikTok') {
        userStep[chatId] = { step: 'select_service', category: 'tiktok' };
        let list = SERVICES.tiktok.list.map(s => s.name).join('\n');
        return bot.sendMessage(chatId, `📋 ${SERVICES.tiktok.title}\n\n${list}\n\n✍️ Xizmat raqamini yozing:`);
    }
    // Instagram
    if (text === '📸 Instagram') {
        userStep[chatId] = { step: 'select_service', category: 'instagram' };
        let list = SERVICES.instagram.list.map(s => s.name).join('\n');
        return bot.sendMessage(chatId, `📋 ${SERVICES.instagram.title}\n\n${list}\n\n✍️ Xizmat raqamini yozing:`);
    }
    // Telegram
    if (text === '📢 Telegram') {
        userStep[chatId] = { step: 'select_service', category: 'telegram' };
        let list = SERVICES.telegram.list.map(s => s.name).join('\n');
        return bot.sendMessage(chatId, `📋 ${SERVICES.telegram.title}\n\n${list}\n\n✍️ Xizmat raqamini yozing:`);
    }
    // YouTube
    if (text === '▶️ YouTube') {
        userStep[chatId] = { step: 'select_service', category: 'youtube' };
        let list = SERVICES.youtube.list.map(s => s.name).join('\n');
        return bot.sendMessage(chatId, `📋 ${SERVICES.youtube.title}\n\n${list}\n\n✍️ Xizmat raqamini yozing:`);
    }

    // Xizmat tanlash -> Link -> Miqdor jarayoni
    const step = userStep[chatId];
    if (!step) return;

    // 1. Xizmatni tanlash
    if (step.step === 'select_service') {
        const cat = SERVICES[step.category];
        const num = parseInt(text) - 1;
        if (isNaN(num) || !cat.list[num]) return bot.sendMessage(chatId, '❌ Bunday raqam yo\'q!');
        
        step.service = cat.list[num];
        step.step = 'send_link';
        return bot.sendMessage(chatId, `✅ Tanlandi: ${step.service.name}\n\n🔗 Havolani yuboring:`);
    }

    // 2. Linkni qabul qilish
    if (step.step === 'send_link') {
        step.link = text;
        step.step = 'send_count';
        return bot.sendMessage(chatId, `🔗 Qabul qilindi.\n\n📦 Nechta kerak? Miqdorni kiriting:\n💳 Narx: 1000 = ${step.service.price} so'm`);
    }

    // 3. Miqdorni qabul qilish va buyurtma yaratish
    if (step.step === 'send_count') {
        const cnt = parseInt(text);
        if (isNaN(cnt) || cnt < 1) return bot.sendMessage(chatId, '❌ Faqat raqam kiriting!');
        
        const sum = Math.ceil(cnt / 1000) * step.service.price;
        const orderId = Date.now();

        orders[orderId] = {
            userId: userId,
            serviceName: step.service.name,
            serviceId: step.service.id,
            link: step.link,
            count: cnt,
            summa: sum,
            status: 'Kutilmoqda',
            date: new Date().toLocaleString()
        };
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));

        delete userStep[chatId];
        return bot.sendMessage(chatId, 
            `✅ Buyurtma qabul qilindi!\n\n` +
            `📋 Xizmat: ${step.service.name}\n📦 Miqdor: ${cnt}\n💸 Jami: ${sum} so'm\n\n` +
            `To'lov usulini tanlang:`,
            { reply_markup: { keyboard: [ [ '💳 Kartaga to‘lov' ], [ '💰 Balansdan yechish' ], [ '🔙 Asosiy menyu' ] ], resize_keyboard: true } }
        );
    }

});

// Server ishga tushirish
http.createServer((req, res) => {
    res.write('SMM BOT ISHLADI ✅');
    res.end();
}).listen(process.env.PORT || 3000);

console.log('🔥 SMM ADMIN BOT ISHLADI ✅');