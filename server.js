const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const fs = require('fs');

// Ma'lumotlarni saqlash uchun o'zgaruvchilar
let users = [];
let referrals = {};
let userStep = {};
let orders = {};

// To'lov ma'lumotlari
const CARD_NUMBER = '9860350144650842';
const CARD_NAME = 'ODILJON OCHILOV';

// Fayllardan ma'lumotlarni yuklash
if (fs.existsSync('orders.json')) {
    try {
        orders = JSON.parse(fs.readFileSync('orders.json', 'utf8'));
    } catch (e) {
        orders = {};
    }
}

if (fs.existsSync('users.json')) {
    try {
        users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    } catch (e) {
        users = [];
    }
}

if (fs.existsSync('referrals.json')) {
    try {
        referrals = JSON.parse(fs.readFileSync('referrals.json', 'utf8'));
    } catch (e) {
        referrals = {};
    }
}

// 👇 FAQAT O'ZINGIZNING BOT TOKENINGIZNI YOZING
const token = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// /start buyrug'i
bot.onText(/\/start/, function (msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const refId = msg.text.split(' ')[1];

    if (!users.includes(userId)) {
        users.push(userId);
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

        if (refId && refId != userId) {
            if (!referrals[refId]) {
                referrals[refId] = 0;
            }
            referrals[refId]++;
            fs.writeFileSync('referrals.json', JSON.stringify(referrals, null, 2));
        }
    }

    bot.sendMessage(chatId,
        '🔥 ASSALOMU ALAYKUM!\n\n' +
        '🚀 SMM ADMIN BOTGA XUSH KELIBSIZ\n\n' +
        '📈 XIZMATLAR:\n' +
        '• TikTok\n' +
        '• Instagram\n' +
        '• Telegram\n' +
        '• YouTube\n\n' +
        '👨‍💻 ADMIN:\n' +
        '@SMM_adminMAX\n\n' +
        '📞 +998(93)409-06-06',
        {
            reply_markup: {
                keyboard: [
                    ['🎵 TikTok', '📸 Instagram'],
                    ['📢 Telegram', '▶️ YouTube'],
                    ['👨‍💻 Admin', '👥 Referal']
                ],
                resize_keyboard: true
            }
        }
    );
});

// /ref buyrug'i
bot.onText(/\/ref/, function (msg) {
    const userId = msg.from.id;
    const count = referrals[userId] || 0;
    const link = `https://t.me/SMM_adminMAX_bot?start=${userId}`;

    bot.sendMessage(msg.chat.id,
        '👥 REFERAL SYSTEM\n\n' +
        '🔗 Linkingiz:\n' + link +
        '\n\n👤 Taklif qilganlar soni:\n' + count
    );
});

// /stats buyrug'i (faqat admin)
bot.onText(/\/stats/, function (msg) {
    if (msg.from.username !== '@SMM_adminMAX') {
        return bot.sendMessage(msg.chat.id, '❌ Siz admin emassiz');
    }

    bot.sendMessage(msg.chat.id,
        '📊 BOT STATISTIKASI\n\n' +
        '👥 Foydalanuvchilar soni:\n' + users.length + '\n\n' +
        '📦 Buyurtmalar soni:\n' + Object.keys(orders).length
    );
});

// /users buyrug'i
bot.onText(/\/users/, function (msg) {
    if (msg.from.username !== 'SMM_adminMAX') {
        return bot.sendMessage(msg.chat.id, '❌ Siz admin emassiz');
    }

    bot.sendMessage(msg.chat.id, '👥 Foydalanuvchilar soni:\n' + users.length);
});

// /orders buyrug'i
bot.onText(/\/orders/, function (msg) {
    if (msg.from.username !== 'SMM_adminMAX') {
        return bot.sendMessage(msg.chat.id, '❌ Siz admin emassiz');
    }

    let text = '📦 BARCHA BUYURTMALAR\n\n';
    for (let id in orders) {
        text += `🔗 Havola: ${orders[id].link}\n📦 Miqdor: ${orders[id].count}\n\n`;
    }

    bot.sendMessage(msg.chat.id, text || '❌ Hozircha buyurtmalar yo\'q');
});

// Barcha xabarlarni qayta ishlash
bot.on('message', function (msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Admin ma'lumotlari
    if (text === '👨‍💻 Admin') {
        return bot.sendMessage(chatId,
            '👨‍💻 ADMIN:\n\n' +
            '@SMM_adminMAX\n\n' +
            '📞 +998(93)409-06-06'
        );
    }

    // TikTok bo'limi
    if (text === '🎵 TikTok') {
        userStep[chatId] = 'tiktok_link';
        return bot.sendMessage(chatId, '🔗 TikTok link yuboring');
    }

    if (userStep[chatId] === 'tiktok_link') {
        userStep[chatId] = 'tiktok_count';
        orders[chatId] = { link: text };
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
        return bot.sendMessage(chatId, '📦 Miqdorni kiriting');
    }

    if (userStep[chatId] === 'tiktok_count') {
        const count = text;
        orders[chatId].count = count;
        fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
        userStep[chatId] = null;

        return bot.sendMessage(chatId,
            '✅ Buyurtma qabul qilindi!\n\n' +
            '🔗 Link:\n' + orders[chatId].link + '\n\n' +
            '📦 Miqdor:\n' + count + '\n\n' +
            '💳 TO‘LOV UCHUN:\n' + CARD_NUMBER + '\n\n' +
            '👤 ' + CARD_NAME + '\n\n' +
            '📸 To‘lov screenshot yuboring'
        );
    }

    // Instagram bo'limi
    if (text === '📸 Instagram') {
        return bot.sendMessage(chatId, '📸 Instagram xizmatlari tez orada qo‘shiladi 🚀');
    }

    // Telegram bo'limi
    if (text === '📢 Telegram') {
        return bot.sendMessage(chatId, '📢 Telegram xizmatlari tez orada qo‘shiladi 🚀');
    }

    // YouTube bo'limi
    if (text === '▶️ YouTube') {
        return bot.sendMessage(chatId, '▶️ YouTube xizmatlari tez orada qo‘shiladi 🚀');
    }

    // Referal tugmasi
    if (text === '👥 Referal') {
        const userId = msg.from.id;
        const count = referrals[userId] || 0;
        const link = `https://t.me/SMM_adminMAX_bot?start=${userId}`;
        return bot.sendMessage(chatId,
            '👥 REFERAL SYSTEM\n\n' +
            '🔗 Linkingiz:\n' + link +
            '\n\n👤 Taklif qilganlar soni:\n' + count
        );
    }
});

// Server ishga tushirish
http.createServer(function (req, res) {
    res.write('SMM BOT ISHLADI ✅');
    res.end();
}).listen(process.env.PORT || 3000);

console.log('🔥 SMM ADMIN BOT ISHLADI ✅');