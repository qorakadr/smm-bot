const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const fs = require('fs');
const axios = require('axios');

// Ma'lumotlar
let users = [];
let referrals = {};
let userStep = {};
let orders = {};
let balances = {};
let stats = { users: 0, orders: 0, income: 0 };

// ⚙️ ASOSIY SOZLAMALAR
const CARD_NUMBER = '9860350144650842';
const CARD_NAME = 'ODILJON OCHILOV';
const ADMIN_USERNAME = 'SMM_adminMAX';
const ADMIN_ID = 123456789; // ⚠️ O'zingizning ID raqamingizni yozing
const REQUIRED_CHANNEL = '@xabarlar24uzbekiston

// 💳 TO'LOV TIZIMLARI SOZLAMALARI
const PAYMENT_SYSTEMS = {
    click: {
        name: "Click",
        merchant_id: "12345",
        service_id: "67890",
        secret_key: "maxfiy_kalit",
        enabled: true
    },
    payme: {
        name: "Payme",
        merchant_id: "555555",
        secret_key: "payme_maxfiy_kalit",
        enabled: true
    },
    uzum: {
        name: "Uzum Bank",
        merchant_id: "uzum_merchant",
        secret_key: "uzum_kalit",
        enabled: true
    },
    paynet: {
        name: "Paynet",
        merchant_id: "paynet_merchant",
        secret_key: "paynet_kalit",
        enabled: true
    }
};

// ⚡️ KIRISH MATNI
const WELCOME_TEXT = `⚡️ ASSALOM ALAYKUM!

Eng yaxshi xizmatlarini taqdim etuvchi bot.
Ushbu xizmatlarning barchasini «SMM.ADMIN» botida ko'rishingiz mumkin.

Har qanday vaqtda muammolaringizni hal qilish uchun:
✅ Eng ko'p xizmatlar soni
✅ Eng past bozor narxi
✅ Eng yaxshi yordam jamoasi

👨‍💻 ADMIN: @SMM_adminMAX
📞 Tel: +998(93)409-06-06

Quyidagi bo'limlardan birini tanlang 👇`;

// 📱 SMS-MAN API
const SMS_MAN_API = {
  KEY: 'hmmw3m9sWZmcmpnVGnW6Wo42lf7rrvs6',
  URL: 'https://sms-man.com/api/v1'
};

// 💰 NARXLAR
const PRICE = 5000;

// 🌍 DAVLATLAR — RAQAMLAR BILAN
const COUNTRIES = [
    { id: '1', code: 'romania', name: 'Romania', flag: '🇷🇴' },
    { id: '2', code: 'zambia', name: 'Zambia', flag: '🇿🇲' },
    { id: '3', code: 'kyrgyzstan', name: 'Kyrgyzstan', flag: '🇰🇬' },
    { id: '4', code: 'ireland', name: 'Ireland', flag: '🇮🇪' },
    { id: '5', code: 'uzbekistan', name: 'Oʻzbekiston', flag: '🇺🇿' },
    { id: '6', code: 'germany', name: 'Germany', flag: '🇩🇪' },
    { id: '7', code: 'chad', name: 'Chad', flag: '🇹🇩' },
    { id: '8', code: 'thailand', name: 'Thailand', flag: '🇹🇭' },
    { id: '9', code: 'senegal', name: 'Senegal', flag: '🇸🇳' },
    { id: '10', code: 'kazakhstan', name: 'Kazakhstan', flag: '🇰🇿' },
    { id: '11', code: 'united_kingdom', name: 'United Kingdom', flag: '🇬🇧' },
    { id: '12', code: 'serbia', name: 'Serbia', flag: '🇷🇸' },
    { id: '13', code: 'yemen', name: 'Yemen', flag: '🇾🇪' },
    { id: '14', code: 'cote_d_ivoire', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { id: '15', code: 'iraq', name: 'Iraq', flag: '🇮🇶' },
    { id: '16', code: 'honduras', name: 'Honduras', flag: '🇭🇳' },
    { id: '17', code: 'bahrain', name: 'Bahrain', flag: '🇧🇭' },
    { id: '18', code: 'benin', name: 'Benin', flag: '🇧🇯' },
    { id: '19', code: 'ecuador', name: 'Ecuador', flag: '🇪🇨' },
    { id: '20', code: 'lesotho', name: 'Lesotho', flag: '🇱🇸' },
    { id: '21', code: 'jamaica', name: 'Jamaica', flag: '🇯🇲' }
];

// 🛒 SMM XIZMATLARI
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

// 📂 Fayllarni yuklash
if (fs.existsSync('orders.json')) try { orders = JSON.parse(fs.readFileSync('orders.json', 'utf8')); } catch(e){}
if (fs.existsSync('users.json')) try { users = JSON.parse(fs.readFileSync('users.json', 'utf8')); } catch(e){}
if (fs.existsSync('referrals.json')) try { referrals = JSON.parse(fs.readFileSync('referrals.json', 'utf8')); } catch(e){}
if (fs.existsSync('balances.json')) try { balances = JSON.parse(fs.readFileSync('balances.json', 'utf8')); } catch(e){}
if (fs.existsSync('stats.json')) try { stats = JSON.parse(fs.readFileSync('stats.json', 'utf8')); } catch(e){}

// 🤖 Bot ishga tushirish
const token = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';
const bot = new TelegramBot(token, { polling: true });

// 🔍 Kanalga a'zolikni tekshirish
async function checkSubscription(userId) {
    try {
        const m = await bot.getChatMember(REQUIRED_CHANNEL, userId);
        return ['creator','administrator','member'].includes(m.status);
    } catch { return false; }
}

// 📋 Asosiy menyu
function sendMainMenu(chatId) {
    bot.sendMessage(chatId, WELCOME_TEXT, {
        reply_markup: {
            keyboard: [
                ['📱 Raqam olish', '🛒 SMM Xizmatlar'],
                ['💳 Mening hisobim', '📦 Buyurtmalarim'],
                ['💰 Hisobni to‘ldirish', '🔗 Referal havola'],
                ['👤 Admin panel']
            ],
            resize_keyboard: true
        }
    });
    delete userStep[chatId];
}

// 🚀 /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const refId = msg.text.split(' ')[1];

    if (!await checkSubscription(userId))
        return bot.sendMessage(chatId, `❌ Botdan foydalanish uchun avval kanalimizga a'zo bo'ling!\n👉 ${REQUIRED_CHANNEL}\n✅ Keyin /start ni qayta bosing`);

    if (!users.includes(userId)) {
        users.push(userId);
        balances[userId] = balances[userId] || 0;
        stats.users += 1;
        fs.writeFileSync('users.json', JSON.stringify(users,null,2));
        fs.writeFileSync('balances.json', JSON.stringify(balances,null,2));
        fs.writeFileSync('stats.json', JSON.stringify(stats,null,2));
        if (refId && refId!=userId) { referrals[refId]=(referrals[refId]||0)+1; fs.writeFileSync('referrals.json', JSON.stringify(referrals,null,2)); }
    }
    sendMainMenu(chatId);
});

// 🛡️ ADMIN BUYRUQLARI
bot.onText(/\/addbalans (\d+) (\d+)/, (msg, match) => {
    if (msg.from.username !== ADMIN_USERNAME) return;
    const uid = parseInt(match[1]);
    const sum = parseInt(match[2]);
    balances[uid] = (balances[uid]||0)+sum;
    fs.writeFileSync('balances.json', JSON.stringify(balances,null,2));
    bot.sendMessage(msg.chat.id, `✅ ${uid} ga ${sum} so'm qo'shildi. Yangi balans: ${balances[uid]}`);
    bot.sendMessage(uid, `✅ Hisobingizga ${sum} so'm qo'shildi!\n💳 Jami: ${balances[uid]} so'm`).catch(()=>{});
});
bot.onText(/\/subbalans (\d+) (\d+)/, (msg, match) => {
    if (msg.from.username !== ADMIN_USERNAME) return;
    const uid = parseInt(match[1]);
    const sum = parseInt(match[2]);
    balances[uid] = Math.max(0, (balances[uid]||0)-sum);
    fs.writeFileSync('balances.json', JSON.stringify(balances,null,2));
    bot.sendMessage(msg.chat.id, `➖ ${uid} dan ${sum} so'm yechildi. Qoldi: ${balances[uid]}`);
});
bot.onText(/\/narx (.+) (.+)/, (msg, match) => {
    if (msg.from.username !== ADMIN_USERNAME) return;
    const tur = match[1];
    const yangiNarx = parseInt(match[2]);
    if(tur === 'raqam') { PRICE = yangiNarx; fs.writeFileSync('narx.json', JSON.stringify({price:PRICE})); bot.sendMessage(msg.chat.id, `✅ Raqam narxi ${yangiNarx} so'm qilib o'zgartirildi!`); }
});
bot.onText(/\/xabar (.+)/, (msg, match) => {
    if (msg.from.username !== ADMIN_USERNAME) return;
    const xabar = match[1];
    users.forEach(u => bot.sendMessage(u, `📢 YANGILIK:\n\n${xabar}`).catch(()=>{}));
    bot.sendMessage(msg.chat.id, `✅ Xabar barchaga yuborildi!`);
});
bot.onText(/\/statistika/, (msg) => {
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(msg.chat.id, `📊 BOT STATISTIKASI:\n\n👤 Foydalanuvchilar: ${stats.users}\n📦 Buyurtmalar: ${stats.orders}\n💸 Jami tushum: ${stats.income} so'm`);
});
bot.onText(/\/getid/, msg => bot.sendMessage(msg.chat.id, `🆔 Sizning ID: ${msg.from.id}`));

// 💳 TO'LOV TIZIMLARI FUNKSIYALARI
async function createPayment(type, amount, userId) {
    try {
        let link = '';
        if(type === 'click') {
            link = `https://click.uz/pay?service_id=${PAYMENT_SYSTEMS.click.service_id}&merchant_id=${PAYMENT_SYSTEMS.click.merchant_id}&amount=${amount}&transaction_id=${userId}_${Date.now()}`;
        }
        if(type === 'payme') {
            link = `https://payme.uz/merchant/${PAYMENT_SYSTEMS.payme.merchant_id}/pay?amount=${amount*100}&account[user_id]=${userId}`;
        }
        if(type === 'uzum') {
            link = `https://uzumbank.uz/pay/${PAYMENT_SYSTEMS.uzum.merchant_id}?amount=${amount}&user=${userId}`;
        }
        if(type === 'paynet') {
            link = `https://paynet.uz/pay?service=${PAYMENT_SYSTEMS.paynet.merchant_id}&amount=${amount}&user=${userId}`;
        }
        return link;
    } catch (e) { return null; }
}

// 📩 XABARLARNI QAYTA ISHLASH
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    if (!await checkSubscription(userId))
        return bot.sendMessage(chatId, `❌ Avval kanalga a'zo bo'ling: ${REQUIRED_CHANNEL}`);

    // 🔙 ORQAGA QAYTISH
    if (text === '🔙 Orqaga') {
        sendMainMenu(chatId);
        return;
    }

    // 👤 ADMIN PANEL
    if (text === '👤 Admin panel' && msg.from.username === ADMIN_USERNAME) {
        return bot.sendMessage(chatId, `👨‍💻 ADMIN BOSHQARUVI\n\nBuyruqlar:\n/addbalans [id] [sum] - Balans qo'shish\n/subbalans [id] [sum] - Balansdan yechish\n/narx raqam [sum] - Raqam narxini o'zgartirish\n/xabar [matn] - Hammaga xabar yuborish\n/statistika - Bot hisoboti`, {reply_markup:{keyboard:[['🔙 Orqaga']],resize_keyboard:true}});
    }

    // 📱 RAQAM OLISH — DAVLATLAR RAQAM BILAN
    if (text === '📱 Raqam olish') {
        let list = `🌍 DAVLATLAR RO'YXATI\nHar bir davlatning yonidagi raqamni yozib tanlang\nNarxi: barchasi ${PRICE} so'm\n\n`;
        COUNTRIES.forEach(c => {
            list += `${c.id}. ${c.flag} ${c.name}\n`;
        });
        list += `\n✍️ Kerakli davlat raqamini yozing\n🔙 Orqaga qaytish uchun "🔙 Orqaga" deb yozing`;
        
        userStep[chatId] = { step: 'select_country' };
        return bot.sendMessage(chatId, list, {
            reply_markup: { keyboard: [['🔙 Orqaga']], resize_keyboard: true }
        });
    }

    // ✅ DAVLAT RAQAMI KIRITILDI
    if (userStep[chatId]?.step === 'select_country') {
        const selectedCountry = COUNTRIES.find(c => c.id === text.trim());
        if (!selectedCountry) return bot.sendMessage(chatId, `❌ Bunday raqam yo'q! Ro'yxatdan tanlang yoki "🔙 Orqaga" deb yozing`);

        // Balansni tekshirish
        if ((balances[userId] || 0) < PRICE) 
            return bot.sendMessage(chatId, `❌ Hisobingizda mablag' yetarli emas!\n💳 Balans: ${balances[userId] || 0} so'm\n💸 Narx: ${PRICE} so'm\n\n💰 Avval hisobni to'ldiring`);

        // Pulni yechish
        balances[userId] -= PRICE;
        stats.income += PRICE;
        stats.orders += 1;
        fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));
        fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));

        bot.sendMessage(chatId, `✅ Davlat tanlandi: ${selectedCountry.flag} ${selectedCountry.name}\n⏳ Raqam olinmoqda...`);

        // API orqali raqam olish
        try {
            const res = await axios.get(`${SMS_MAN_API.URL}/get-number`, {
                params: {
                    api_key: SMS_MAN_API.KEY,
                    country: selectedCountry.code,
                    service: 'tg'
                }
            });

            if(res.data.status === 'success') {
                const num = res.data.number;
                const orderId = res.data.id;

                userStep[chatId] = { step: 'wait_code', orderId: orderId };

                return bot.sendMessage(chatId, `✅ RAQAM MUVAFFAQIYATLI OLINDI!\n\n📱 Raqam: +${num}\n⏳ Kod kelishini kuting (20 daqiqa)\n\n🔄 Kod kelganda shu yerda ko'rinadi:\n🔙 Orqaga qaytish uchun "🔙 Orqaga" deb yozing`);
            } else {
                balances[userId] += PRICE;
                stats.income -= PRICE;
                stats.orders -= 1;
                fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));
                fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
                return bot.sendMessage(chatId, `❌ Xatolik: ${res.data.message || 'Noma\'lum xato'}\n💰 Pul hisobingizga qaytarildi.`);
            }

        } catch (err) {
            balances[userId] += PRICE;
            stats.income -= PRICE;
            stats.orders -= 1;
            fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));
            fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
            return bot.sendMessage(chatId, `❌ Ulanishda xatolik: ${err.response?.data?.message || 'Sayt javob bermayapti'}\n💰 Pul qaytarildi.`);
        }
    }

    // 📩 KODNI TEKSHIRISH
    if (userStep[chatId]?.step === 'wait_code') {
        try {
            const res = await axios.get(`${SMS_MAN_API.URL}/get-status`, {
                params: {
                    api_key: SMS_MAN_API.KEY,
                    id: userStep[chatId].orderId
                }
            });

            if(res.data.status === 'success' && res.data.code) {
                bot.sendMessage(chatId, `📩 KOD KELDI!\n\n🔑 Kod: ${res.data.code}\n\n✅ Ishlatib bo'lgach tugatiling.`);
                delete userStep[chatId];
            }
        } catch {}
        return;
    }

    // 💰 HISOBNI TO'LDIRISH
    if (text === '💰 Hisobni to‘ldirish') {
        userStep[chatId] = { step: 'summa_kiritish' };
        return bot.sendMessage(chatId, `💰 HISOBNI TO'LDIRISH\n\nQancha so'm kiritmoqchisiz?\nMasalan: 10000, 20000, 50000\n\n✍️ Faqat raqam yozing\n🔙 Orqaga: "🔙 Orqaga"`);
    }

    if(userStep[chatId]?.step === 'summa_kiritish') {
        const summa = parseInt(text);
        if(isNaN(summa) || summa < 1000) return bot.sendMessage(chatId, `❌ Noto'g'ri summa! Eng kamida 1000 so'm kiriting`);
        
        userStep[chatId] = { step: 'tolov_tanlash', summa: summa };
        return bot.sendMessage(chatId, `💳 TO'LOV TIZIMINI TANLANG\n\nSumma: ${summa} so'm\n\nQuyidagilardan birini tanlang:`, {
            reply_markup: {
                keyboard: [
                    ['💳 Click', '🟢 Payme'],
                    ['🟡 Uzum Bank', '🔵 Paynet'],
                    ['💧 Kartaga o'tkazish', '🔙 Orqaga']
                ],
                resize_keyboard: true
            }
        });
    }

    if(userStep[chatId]?.step === 'tolov_tanlash') {
        const summa = userStep[chatId].summa;
        if(text === '💳 Click') {
            const link = await createPayment('click', summa, userId);
            return bot.sendMessage(chatId, `✅ Click orqali to'lov\n\nSumma: ${summa} so'm\n👉 To'lov uchun: ${link}\n\n✅ To'lov qilingach, hisobingiz avtomatik to'ldiriladi!`);
        }
        if(text === '🟢 Payme') {
            const link = await createPayment('payme', summa, userId);
            return bot.sendMessage(chatId, `✅ Payme orqali to'lov\n\nSumma: ${summa} so'm\n👉 To'lov uchun: ${link}\n\n✅ To'lov qilingach, hisobingiz avtomatik to'ldiriladi!`);
        }
        if(text === '🟡 Uzum Bank') {
            const link = await createPayment('uzum', summa, userId);
            return bot.sendMessage(chatId, `✅ Uzum Bank orqali to'lov\n\nSumma: ${summa} so'm\n👉 To'lov uchun: ${link}\n\n✅ To'lov qilingach, hisobingiz avtomatik to'ldiriladi!`);
        }
        if(text === '🔵 Paynet') {
            const link = await createPayment('paynet', summa, userId);
            return bot.sendMessage(chatId, `✅ Paynet orqali to'lov\n\nSumma: ${summa} so'm\n👉 To'lov uchun: ${link}\n\n✅ To'lov qilingach, hisobingiz avtomatik to'ldiriladi!`);
        }
        if(text === '💧 Kartaga o'tkazish') {
            return bot.sendMessage(chatId, `💳 KARTA ORQALI TO'LOV\n\nSumma: ${summa} so'm\n\n💳 Karta: ${CARD_NUMBER}\n👤 Ism: ${CARD_NAME}\n\n📑 To'lovdan so'ng chekni shu yerga yuboring\n✅ Admin tasdiqlagach pul tushadi`);
        }
    }

    // 🛒 SMM XIZMATLAR
    if (text === '🛒 SMM Xizmatlar') 
        return bot.sendMessage(chatId, '👇 Quyidagi platformalardan birini tanlang:', { 
            reply_markup:{keyboard:[
                ['🎵 TikTok', '📸 Instagram'],
                ['📢 Telegram', '▶️ YouTube'],
                ['🔙 Orqaga']
            ],resize_keyboard:true}
        });

    if (text === '🎵 TikTok') { 
        userStep[chatId]={step:'sel_serv',cat:'tiktok'}; 
        let l=SERVICES.tiktok.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.tiktok.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing\n🔙 Orqaga qaytish uchun "🔙 Orqaga"`); 
    }
    if (text === '📸 Instagram') { 
        userStep[chatId]={step:'sel_serv',cat:'instagram'}; 
        let l=SERVICES.instagram.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.instagram.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing\n🔙 Orqaga qaytish uchun "🔙 Orqaga"`); 
    }
    if (text === '📢 Telegram') { 
        userStep[chatId]={step:'sel_serv',cat:'telegram'}; 
        let l=SERVICES.telegram.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.telegram.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing\n🔙 Orqaga qaytish uchun "🔙 Orqaga"`); 
    }
    if (text === '▶️ YouTube') { 
        userStep[chatId]={step:'sel_serv',cat:'youtube'}; 
        let l=SERVICES.youtube.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.youtube.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing\n🔙 Orqaga qaytish uchun "🔙 Orqaga"`); 
    }

    // Xizmat tanlash -> Link -> Miqdor
    const step = userStep[chatId];
    if (!step) return;

    if (step.step === 'sel_serv') {
        const cat = SERVICES[step.cat];
        const num = parseInt(text) - 1;
        if (isNaN(num) || !cat.list[num]) return bot.sendMessage(chatId, '❌ Bunday raqam yo\'q!');
        
        step.service = cat.list[num];
        step.step = 'send_link';
        return bot.sendMessage(chatId, `✅ Tanlandi: ${step.service.name}\n\n🔗 Havolani yuboring\n🔙 Orqaga: "🔙 Orqaga"`);
    }

    if (step.step === 'send_link') {
        step.link = text;
        step.step = 'send_count';
        return bot.sendMessage(chatId, `🔗 Qabul qilindi.\n\n📦 Nechta kerak? Miqdorni kiriting:\n💳 Narx: 1000 = ${step.service.price} so'm\n🔙 Orqaga: "🔙 Orqaga"`);
    }

    if (step.step === 'send_count') {
        const cnt = parseInt(text);
        if (isNaN(cnt) || cnt < 1) return bot.sendMessage(chatId, '❌ Faqat raqam kiriting!');
        
        const sum = Math.ceil(cnt / 1000) * step.service.price;
        const orderId = Date.now();

        orders[orderId] = {
            userId: userId,
            serviceName: step.service.name,
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
            { reply_markup: { keyboard: [ [ '💳 Kartaga to‘lov' ], [ '💰 Balansdan yechish' ], [ '🔙 Orqaga' ] ], resize_keyboard: true } }
        );
    }

    // Boshqa tugmalar
    if (text === '💳 Mening hisobim') {
        const balans = balances[userId] || 0;
        return bot.sendMessage(chatId, 
            '💳 SIZNING HISOBINGIZ\n\n' +
            `🆔 ID: ${userId}\n` +
            `💰 Mavjud balans: ${balans} so'm\n\n` +
            '🔙 Orqaga qaytish uchun "🔙 Orqaga"'
        );
    }

    if (text === '📦 Buyurtmalarim') {
        let myOrdersText = '📦 SIZNING BUYURTMALARINGIZ\n\n';
        let hasOrders = false;
        for (let orderId in orders) {
            if (orders[orderId].userId === userId) {
                myOrdersText += `🔹 ID: ${orderId}\n📋 Xizmat: ${orders[orderId].serviceName}\n📦 Miqdor: ${orders[orderId].count}\n💸 Summa: ${orders[orderId].summa} so'm\n📌 Holat: ${orders[orderId].status || 'Kutilmoqda'}\n\n`;
                hasOrders = true;
            }
        }
        return bot.sendMessage(chatId, hasOrders ? myOrdersText + '🔙 Orqaga: "🔙 Orqaga"' : '❌ Sizda hozircha buyurtmalar yo\'q\n🔙 Orqaga: "🔙 Orqaga"');
    }

    if (text === '🔗 Referal havola') {
        const count = referrals[userId] || 0;
        const link = `https://t.me/SMM_adminMAX_bot?start=${userId}`;
        return bot.sendMessage(chatId,
            '🔗 REFERAL HAVOLA\n\n' +
            '🔗 Havola: ' + link + '\n' +
            '👤 Taklif qilinganlar: ' + count + ' ta\n' +
            '🔙 Orqaga qaytish uchun "🔙 Orqaga"'
        );
    }
});

// ✅ Render.com uchun server
http.createServer((req, res) => {
    res.write('Bot ishlamoqda ✅');
    res.end();
}).listen(process.env.PORT || 3000, () => {
    console.log('🔥 Bot Render.com da ishga tushdi ✅');
});