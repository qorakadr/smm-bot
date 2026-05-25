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

// ⚙️ ASOSIY SOZLAMALAR
const CARD_NUMBER = '9860350144650842';
const CARD_NAME = 'ODILJON OCHILOV';
const ADMIN_USERNAME = 'SMM_adminMAX';
const REQUIRED_CHANNEL = '@xabarlar24uzbekiston';

// ⚡️ KIRISH MATNI (Siz yozgan)
const WELCOME_TEXT = `⚡️ ASSALOM ALAYKUM!

Eng yaxshi xizmatlarini taqdim etuvchi bot.
Ushbu xizmatlarning barchasini «SMM.ADMIN» botida ko'rishingiz mumkin.

Har qanday vaqtda muammolaringizni hal qilish uchun:
✅ Eng ko'p xizmatlar soni
✅ Eng past bozor narxi
✅ Eng yaxshi yordam jamoasi

👨‍💻 ADMIN: @SMM_adminMAX
📞 Tel: +998(93)409-06-06

Quyidagi tugmalardan kerakli bo'limni tanlang 👇`;

// 📱 SMS-MAN API (Sizning kalitingiz)
const SMS_MAN_API = {
  KEY: 'hmmw3m9sWZmcmpnVGnW6Wo42lf7rrvs6',
  URL: 'https://sms-man.com/api/v1'
};

// 💰 NARXLAR (Hammasi 5000 so'm, keyin o'zgartirasiz)
const PRICE = 5000;

// 🌍 DAVLATLAR RO'YXATI (Rasmdagilarning hammasi, bayrog'i + nomi)
const COUNTRIES = [
    { id: 'romania', name: 'Romania', flag: '🇷🇴' },
    { id: 'zambia', name: 'Zambia', flag: '🇿🇲' },
    { id: 'kyrgyzstan', name: 'Kyrgyzstan', flag: '🇰🇬' },
    { id: 'ireland', name: 'Ireland', flag: '🇮🇪' },
    { id: 'uzbekistan', name: 'Oʻzbekiston', flag: '🇺🇿' },
    { id: 'germany', name: 'Germany', flag: '🇩🇪' },
    { id: 'chad', name: 'Chad', flag: '🇹🇩' },
    { id: 'thailand', name: 'Thailand', flag: '🇹🇭' },
    { id: 'senegal', name: 'Senegal', flag: '🇸🇳' },
    { id: 'kazakhstan', name: 'Kazakhstan', flag: '🇰🇿' },
    { id: 'united_kingdom', name: 'United Kingdom', flag: '🇬🇧' },
    { id: 'serbia', name: 'Serbia', flag: '🇷🇸' },
    { id: 'yemen', name: 'Yemen', flag: '🇾🇪' },
    { id: 'cote_d_ivoire', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { id: 'iraq', name: 'Iraq', flag: '🇮🇶' },
    { id: 'honduras', name: 'Honduras', flag: '🇭🇳' },
    { id: 'bahrain', name: 'Bahrain', flag: '🇧🇭' },
    { id: 'benin', name: 'Benin', flag: '🇧🇯' },
    { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨' },
    { id: 'lesotho', name: 'Lesotho', flag: '🇱🇸' },
    { id: 'jamaica', name: 'Jamaica', flag: '🇯🇲' }
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
                ['📱 Raqam olish'],
                ['🛒 SMM Xizmatlar'],
                ['💳 Mening hisobim'],
                ['📦 Buyurtmalarim'],
                ['💰 Hisobni to‘ldirish'],
                ['🔗 Referal havola']
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
        fs.writeFileSync('users.json', JSON.stringify(users,null,2));
        fs.writeFileSync('balances.json', JSON.stringify(balances,null,2));
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
bot.onText(/\/getid/, msg => bot.sendMessage(msg.chat.id, `🆔 Sizning ID: ${msg.from.id}`));

// 📩 XABARLARNI QAYTA ISHLASH
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    if (!await checkSubscription(userId))
        return bot.sendMessage(chatId, `❌ Avval kanalga a'zo bo'ling: ${REQUIRED_CHANNEL}`);

    // 📱 RAQAM OLISH — DAVLATLAR RO'YXATI
    if (text === '📱 Raqam olish') {
        let list = `🌍 DAVLATLAR RO'YXATI\n\n`;
        COUNTRIES.forEach(c => {
            list += `${c.flag} ${c.name} — ${PRICE} so'm\n`;
        });
        list += `\n✍️ Davlat nomini yozing (masalan: Oʻzbekiston)`;
        
        userStep[chatId] = { step: 'select_country' };
        return bot.sendMessage(chatId, list);
    }

    // ✅ DAVLAT TANLANDI — DARHOL TO'LOVGA O'TISH
    if (userStep[chatId]?.step === 'select_country') {
        const selectedCountry = COUNTRIES.find(c => c.name.toLowerCase() === text.toLowerCase().trim());
        if (!selectedCountry) return bot.sendMessage(chatId, `❌ Bunday davlat topilmadi! Ro'yxatdan tanlang.`);

        // Balansni tekshirish
        if ((balances[userId] || 0) < PRICE) 
            return bot.sendMessage(chatId, `❌ Hisobingizda mablag' yetarli emas!\n💳 Balans: ${balances[userId] || 0} so'm\n💸 Narx: ${PRICE} so'm`);

        // Pulni yechish
        balances[userId] -= PRICE;
        fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));

        bot.sendMessage(chatId, `✅ Davlat tanlandi: ${selectedCountry.flag} ${selectedCountry.name}\n⏳ Raqam olinmoqda...`);

        // API orqali raqam olish
        try {
            const res = await axios.get(`${SMS_MAN_API.URL}/get-number`, {
                params: {
                    api_key: SMS_MAN_API.KEY,
                    country: selectedCountry.id,
                    service: 'tg' // Telegram uchun, saytdagi kabi ajratish kerak bo'lsa o'zgartirasiz
                }
            });

            if(res.data.status === 'success') {
                const num = res.data.number;
                const orderId = res.data.id;

                userStep[chatId] = { step: 'wait_code', orderId: orderId };

                return bot.sendMessage(chatId, `✅ RAQAM MUVAFFAQIYATLI OLINDI!\n\n📱 Raqam: +${num}\n⏳ Kod kelishini kuting (20 daqiqa)\n\n🔄 Kod kelganda shu yerda ko'rinadi:`);
            } else {
                balances[userId] += PRICE;
                fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));
                return bot.sendMessage(chatId, `❌ Xatolik: ${res.data.message || 'Noma\'lum xato'}\n💰 Pul hisobingizga qaytarildi.`);
            }

        } catch (err) {
            balances[userId] += PRICE;
            fs.writeFileSync('balances.json', JSON.stringify(balances, null, 2));
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

    // 🛒 SMM XIZMATLAR
    if (text === '🛒 SMM Xizmatlar') 
        return bot.sendMessage(chatId, '👇 Quyidagi platformalardan birini tanlang:', { 
            reply_markup:{keyboard:[['🎵 TikTok','📸 Instagram'],['📢 Telegram','▶️ YouTube'],['🔙 Asosiy menyu']],resize_keyboard:true}
        });

    if (text === '🎵 TikTok') { 
        userStep[chatId]={step:'sel_serv',cat:'tiktok'}; 
        let l=SERVICES.tiktok.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.tiktok.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing:`); 
    }
    if (text === '📸 Instagram') { 
        userStep[chatId]={step:'sel_serv',cat:'instagram'}; 
        let l=SERVICES.instagram.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.instagram.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing:`); 
    }
    if (text === '📢 Telegram') { 
        userStep[chatId]={step:'sel_serv',cat:'telegram'}; 
        let l=SERVICES.telegram.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.telegram.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing:`); 
    }
    if (text === '▶️ YouTube') { 
        userStep[chatId]={step:'sel_serv',cat:'youtube'}; 
        let l=SERVICES.youtube.list.map(x=>x.name).join('\n'); 
        return bot.sendMessage(chatId,`📋 ${SERVICES.youtube.title}\n\n${l}\n\n✍️ Xizmat raqamini yozing:`); 
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
        return bot.sendMessage(chatId, `✅ Tanlandi: ${step.service.name}\n\n🔗 Havolani yuboring:`);
    }

    if (step.step === 'send_link') {
        step.link = text;
        step.step = 'send_count';
        return bot.sendMessage(chatId, `🔗 Qabul qilindi.\n\n📦 Nechta kerak? Miqdorni kiriting:\n💳 Narx: 1000 = ${step.service.price} so'm`);
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
            { reply_markup: { keyboard: [ [ '💳 Kartaga to‘lov' ], [ '💰 Balansdan yechish' ], [ '🔙 Asosiy menyu' ] ], resize_keyboard: true } }
        );
    }

    // Boshqa tugmalar
    if (text === '💳 Mening hisobim') {
        const balans = balances[userId] || 0;
        return bot.sendMessage(chatId, 
            '💳 SIZNING HISOBINGIZ\n\n' +
            `🆔 ID: ${userId}\n` +
            `💰 Mavjud balans: ${balans} so'm\n\n` +
            'Hisobni to\'ldirish uchun "Hisobni to\'ldirish" tugmasini bosing.'
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
        return bot.sendMessage(chatId, hasOrders ? myOrdersText : '❌ Sizda hozircha buyurtmalar yo\'q');
    }

    if (text === '💰 Hisobni to‘ldirish') {
        return bot.sendMessage(chatId, 
            '💰 HISOBNI TO‘LDIRISH\n\n' +
            'To\'lov quyidagi karta orqali amalga oshiring:\n\n' +
            `💳 Karta: ${CARD_NUMBER}\n` +
            `👤 Ism: ${CARD_NAME}\n\n` +
            '📑 To\'lovdan so\'ng chekni yuboring.\n' +
            '✅ Admin tasdiqlagach, pul hisobingizga tushadi.'
        );
    }

    if (text === '🔗 Referal havola') {
        const count = referrals[userId] || 0;
        const link = `https://t.me/SMM_adminMAX_bot?start=${userId}`;
        return bot.sendMessage(chatId,
            '🔗 REFERAL HAVOLA\n\n' +
            '🔗 Havola: ' + link + '\n' +
            '👤 Taklif qilinganlar: ' + count + ' ta'
        );
    }

    if (text === '🔙 Asosiy menyu') {
        sendMainMenu(chatId);
        return;
    }
});

// Server ishga tushirish
http.createServer((req, res) => {
    res.write('SMM BOT ISHLADI ✅');
    res.end();
}).listen(process.env.PORT || 3000);

console.log('🔥 SMM ADMIN BOT ISHLADI ✅');