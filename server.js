const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const fs = require('fs');

let users = [];
let referrals = {};
let userStep = {};
let orders = [];
if(fs.existsSync('orders.json')) {

    orders = JSON.parse(
        fs.readFileSync('orders.json')
    );

}
if(fs.existsSync('users.json')) {

    users = JSON.parse(
        fs.readFileSync('users.json')
    );

}

if(fs.existsSync('referrals.json')) {

    referrals = JSON.parse(
        fs.readFileSync('referrals.json')
    );

}

// ======================
// TOKEN
// ======================

const token = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';

// ======================
// BOT
// ======================

const bot = new TelegramBot(token, {
    polling: true
});

// ======================
// START
// ======================

bot.onText(/\/start/, function(msg) {

    const chatId = msg.chat.id;
    const userId = msg.from.id;

const refId = msg.text.split(' ')[1];

if(!users.includes(userId)) {

    users.push(userId);

    fs.writeFileSync(
        'users.json',
        JSON.stringify(users)
    );

    if(refId && refId != userId) {

        if(!referrals[refId]) {
            referrals[refId] = 0;
        }

        referrals[refId]++;

        fs.writeFileSync(
            'referrals.json',
            JSON.stringify(referrals)
        );

    }

}

    bot.sendMessage(

        chatId,

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
                    ['👨‍💻 Admin']
                ],

                resize_keyboard: true
            }
        }

    );

});

// ======================
// ADMIN
// ======================

bot.on('message', function(msg) {

    if(msg.text === '👨‍💻 Admin') {

        bot.sendMessage(

            msg.chat.id,

            '👨‍💻 ADMIN:\n\n' +
            '@SMM_adminMAX\n\n' +
            '📞 +998(93)409-06-06'

        );

    }

});

// ======================
// TIKTOK
// ======================

bot.on('message', function(msg) {

    if(msg.text === '🎵 TikTok') {

        bot.sendMessage(

            msg.chat.id,

            '🎵 TikTok xizmatlari tez orada qo‘shiladi 🚀'

        );

    }

});

// ======================
// INSTAGRAM
// ======================

bot.on('message', function(msg) {

    if(msg.text === '📸 Instagram') {

        bot.sendMessage(

            msg.chat.id,

            '📸 Instagram xizmatlari tez orada qo‘shiladi 🚀'

        );

    }

});

// ======================
// TELEGRAM
// ======================

bot.on('message', function(msg) {

    if(msg.text === '📢 Telegram') {

        bot.sendMessage(

            msg.chat.id,

            '📢 Telegram xizmatlari tez orada qo‘shiladi 🚀'

        );

    }

});

// ======================
// YOUTUBE
// ======================

bot.on('message', function(msg) {

    if(msg.text === '▶️ YouTube') {

        bot.sendMessage(

            msg.chat.id,

            '▶️ YouTube xizmatlari tez orada qo‘shiladi 🚀'

        );

    }

});

console.log('🔥 SMM ADMIN BOT ISHLADI ✅');

// ======================
// RENDER PORT
// ======================

http.createServer(function(req, res) {

    res.write('SMM BOT ISHLADI');
    res.end();

}).listen(process.env.PORT || 3000);
bot.onText(/\/ref/, function(msg) {

    const userId = msg.from.id;

    let count = 0;

    if(referrals[userId]) {
        count = referrals[userId];
    }

    const link =
    'https://t.me/SMM_adminMAX_bot?start=' +
    userId;

    bot.sendMessage(

        msg.chat.id,

        '👥 REFERAL SYSTEM\n\n' +

        '🔗 Linkingiz:\n' +
        link +

        '\n\n👤 Taklif qilganlar:\n' +
        count

    );

});
bot.on('message', function(msg) {

    if(msg.text === '🎵 TikTok') {

        userStep[msg.chat.id] = 'tiktok_link';

        bot.sendMessage(

            msg.chat.id,

            '🔗 TikTok link yuboring'

        );

    }

});
bot.on('message', function(msg) {

    if(userStep[msg.chat.id] === 'tiktok_link') {

        userStep[msg.chat.id] = 'tiktok_count';

        orders[msg.chat.id] = {
            link: msg.text
        };

        bot.sendMessage(

            msg.chat.id,

            '📦 Miqdorni kiriting'

        );

    }

});
bot.on('message', function(msg) {

    if(userStep[msg.chat.id] === 'tiktok_count') {

        const count = msg.text;

        orders[msg.chat.id].count = count;

        fs.writeFileSync(
            'orders.json',
            JSON.stringify(orders)
        );

        userStep[msg.chat.id] = null;

        bot.sendMessage(

            msg.chat.id,

            '✅ Buyurtma qabul qilindi!\n\n' +

            '🔗 Link:\n' +
            orders[msg.chat.id].link +

            '\n\n📦 Miqdor:\n' +
            count

        );

    }

});