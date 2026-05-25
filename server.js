const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// ======================
// TOKEN
// ======================

const token = '8846788193:AAFmm2yAzhS4KCdNr_pkl8ikq9ObCGkGFPI';

// ======================
// KANAL
// ======================

const CHANNEL_USERNAME = '@xabarlar24uzbekiston';

// ======================
// BOT
// ======================

const bot = new TelegramBot(token, {
    polling: true
});

// ======================
// USER DATA
// ======================

let userStep = {};
let userData = {};
// ORDERLAR

let orders = [];
// REFERAL

let referrals = {};

if(fs.existsSync('referrals.json')) {

    referrals = JSON.parse(
        fs.readFileSync('referrals.json')
    );

}

if(fs.existsSync('orders.json')) {

    orders = JSON.parse(
        fs.readFileSync('orders.json')
    );

}
// USERLAR
let users = [];

// FILEDAN O'QISH

if(fs.existsSync('users.json')) {

    users = JSON.parse(
        fs.readFileSync('users.json')
    );

}
// TO'LOV
const CARD_NUMBER = '9860350144650842';
const CARD_NAME = 'ODILJON OCHILOV';
// ======================
// START
// ======================

bot.onText(/\/start/, async function(msg) {

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    // REFERAL ID

const refId = msg.text.split(' ')[1];
    // USER SAQLASH

if(!users.includes(userId)) {
    users.push(userId);
    // REFERAL SAQLASH

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
    // FILEGA SAQLASH

fs.writeFileSync(
    'users.json',
    JSON.stringify(users)
);
}

    try {

        const member = await bot.getChatMember(
            CHANNEL_USERNAME,
            userId
        );

        // ======================
        // AGAR OBUNA BO'LMAGAN BO'LSA
        // ======================

        if (
            member.status === 'left' ||
            member.status === 'kicked'
        ) {

            bot.sendPhoto(

    chatId,

    'logo.jpg',

    {

        caption: '🔥 SMM ADMIN BOT',

        reply_markup: {

            keyboard: [

                ['🎵 TikTok', '📸 Instagram']

            ],

            resize_keyboard: true

        }

    }

);
                

                chatId,

                '❗ Botdan foydalanish uchun kanalga obuna bo‘ling!',

                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '📢 Kanalga kirish',
                                    url: 'https://t.me/xabarlar24uzbekiston'
                                }
                            ],
                            [
                                {
                                    text: '✅ Tekshirish',
                                    callback_data: 'check_sub'
                                }
                            ]
                        ]
                    }
                }

            );

        }

        // ======================
        // MENU
        // ======================

        bot.sendMessage(

            chatId,

            '🔥 ASSALOMU ALAYKUM!\n\n' +

            'SMM ADMIN BOT ga xush kelibsiz 🚀\n\n' +

            '👨‍💻 ADMIN:\n' +
            '@SMM_adminMAX\n\n' +

            '📞 TEL:\n' +
            '+998(93)409-06-06\n\n' +

            '👇 PLATFORMANI TANLANG:',

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

    } catch(err) {

        console.log(err);

        bot.sendMessage(
            chatId,
            '❌ Xatolik yuz berdi'
        );

    }

});

// ======================
// CHECK SUB
// ======================

bot.on('callback_query', async function(query) {

    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if(query.data === 'check_sub') {

        try {

            const member = await bot.getChatMember(
                CHANNEL_USERNAME,
                userId
            );

          if (
    member.status === 'left' ||
    member.status === 'kicked'
) {

    return bot.sendMessage(

        chatId,

        '❗ Botdan foydalanish uchun kanalga obuna bo‘ling!',

        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📢 Kanalga kirish',
                            url: 'https://t.me/xabarlar24uzbekiston'
                        }
                    ],
                    [
                        {
                            text: '✅ Tekshirish',
                            callback_data: 'check_sub'
                        }
                    ]
                ]
            }
        }

    );

}

                return bot.answerCallbackQuery(
                    query.id,
                    {
                        text: '❌ Kanalga obuna bo‘ling!',
                        show_alert: true
                    }
                );

            }

            bot.sendMessage(

                chatId,

                '✅ Obuna tasdiqlandi!',

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

        } catch(err) {

            console.log(err);

        }

    }

});

// ======================
// TIKTOK MENU
// ======================

bot.sendPhoto(

    chatId,

    'logo.jpg',

    {

        caption:

'🔥 ASSALOMU ALAYKUM!\n\n' +

'🚀 SMM ADMIN BOTGA XUSH KELIBSIZ\n\n' +

'📈 ENG SIFATLI XIZMATLAR:\n' +

'• TikTok\n' +
'• Instagram\n' +
'• Telegram\n' +
'• YouTube\n\n' +

'👨‍💻 ADMIN:\n@SMM_adminMAX\n\n' +

'📞 +998934090606',

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

// ======================
// FOLLOWERS
// ======================

bot.on('message', function(msg) {

    if(msg.text === '👥 Followers') {

        userStep[msg.chat.id] = 'followers_link';

        bot.sendMessage(

            msg.chat.id,

            '🔗 TikTok link yuboring'

        );

    }

});

// ======================
// LINK
// ======================

bot.on('message', function(msg) {

    if(userStep[msg.chat.id] === 'followers_link') {

        userData[msg.chat.id] = {
            link: msg.text
        };

        userStep[msg.chat.id] = 'followers_count';

        bot.sendMessage(

            msg.chat.id,

            '📦 Miqdorni kiriting'

        );

    }

});

// ======================
// COUNT
// ======================

bot.on('message', function(msg) {

    if(userStep[msg.chat.id] === 'followers_count') {

        const count = msg.text;

        const link = userData[msg.chat.id].link;

        const price = Number(count) * 10;
        // ORDER SAQLASH

orders.push({

    user: msg.from.username,
    id: msg.from.id,
    link: link,
    count: count,
    price: price

});

// FILEGA YOZISH

fs.writeFileSync(
    'orders.json',
    JSON.stringify(orders)
);

        userStep[msg.chat.id] = null;

        // USERGA

        bot.sendMessage(

            msg.chat.id,

            '✅ Buyurtma qabul qilindi!\n\n' +

            '🔗 Link:\n' + link + '\n\n' +

            '📦 Miqdor:\n' + count + '\n\n' +

            '💰 Narx:\n' + price + ' so‘m'
            + '\n\n💳 To‘lov uchun:\n' +
CARD_NUMBER +
'\n\n👤 ' + CARD_NAME +
'\n\n📸 To‘lov screenshot yuboring'

        );

        // ADMINGA

        bot.sendMessage(

            msg.chat.id,

            '📥 YANGI BUYURTMA\n\n' +

            '👤 User:\n@' + msg.from.username + '\n\n' +

            '🔗 Link:\n' + link + '\n\n' +

            '📦 Miqdor:\n' + count + '\n\n' +

            '💰 Narx:\n' + price + ' so‘m'

        );

    }

});

// ======================
// ADMIN
// ======================

bot.on('message', function(msg) {

    if(msg.text === '👨‍💻 Admin') {

        bot.sendMessage(

            msg.chat.id,

            '👨‍💻 ADMIN\n\n' +

            '@SMM_adminMAX\n\n' +

            '+998(93)409-06-06'

        );

    }

});

// ======================
// ORQAGA
// ======================

bot.on('message', function(msg) {

    if(msg.text === '⬅️ Orqaga') {

        bot.sendMessage(

            msg.chat.id,

            '👇 PLATFORMANI TANLANG:',

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

    }

});
// ======================
// REKLAMA YUBORISH
// ======================

bot.onText(/\/send (.+)/, function(msg, match) {

    // FAQAT ADMIN
    if(msg.from.username !== 'SMM_adminMAX') {

        return bot.sendMessage(
            msg.chat.id,
            '❌ Siz admin emassiz'
        );

    }

    const text = match[1];

    users.forEach(function(userId) {

        bot.sendMessage(
            userId,
            '📢 REKLAMA\n\n' + text
        );

    });

    bot.sendMessage(
        msg.chat.id,
        '✅ Reklama yuborildi'
    );

});
// ======================
// STATS
// ======================

bot.onText(/\/stats/, function(msg) {

    // FAQAT ADMIN
    if(msg.from.username !== 'SMM_adminMAX') {

        return bot.sendMessage(
            msg.chat.id,
            '❌ Siz admin emassiz'
        );

    }

    bot.sendMessage(

        msg.chat.id,

        '📊 BOT STATISTIKASI\n\n' +

        '👥 Userlar soni: ' + users.length + '\n\n' +

        '🤖 Bot holati: ONLINE ✅'

    );

});
// ======================
// SCREENSHOT
// ======================

bot.on('photo', function(msg) {

    bot.sendMessage(

        msg.chat.id,

        '✅ Screenshot qabul qilindi!\n\n' +
        '⏳ Admin tekshiradi.'

    );

    // ADMINGA YUBORISH

bot.on('photo', function(msg) {

    bot.sendMessage(

        msg.chat.id,

        '✅ Screenshot qabul qilindi!\n\n' +
        '⏳ Admin tekshiradi.'

    );

    bot.sendPhoto(

        msg.chat.id,

        msg.photo[msg.photo.length - 1].file_id,

        {

            caption:
            '💳 YANGI TO‘LOV\n\n' +

            '👤 User:\n@' +
            msg.from.username +

            '\n\n🆔 ID:\n' +
            msg.from.id

        }

    );

});
// ======================
// ACCEPT PAYMENT
// ======================

bot.onText(/\/accept (.+)/, function(msg, match) {

    // FAQAT ADMIN
    if(msg.from.username !== 'SMM_adminMAX') {

        return bot.sendMessage(
            msg.chat.id,
            '❌ Siz admin emassiz'
        );

    }

    const userId = match[1];

    // USERGA YUBORISH

    bot.sendMessage(

        userId,

        '✅ To‘lov tasdiqlandi!\n\n' +

        '🚀 Buyurtmangiz ishga tushirildi.'

    );

    // ADMINGA

    bot.sendMessage(

        msg.chat.id,

        '✅ To‘lov tasdiqlandi'

    );

});
// ======================
// ORDERS
// ======================

bot.onText(/\/orders/, function(msg) {

    // FAQAT ADMIN
    if(msg.from.username !== 'SMM_adminMAX') {

        return bot.sendMessage(
            msg.chat.id,
            '❌ Siz admin emassiz'
        );

    }

    if(orders.length === 0) {

        return bot.sendMessage(
            msg.chat.id,
            '📭 Orderlar yo‘q'
        );

    }

    let text = '📦 ORDERLAR\n\n';

    orders.forEach(function(order, index) {

        text +=
        (index + 1) + '. @' + order.user +
        '\n📦 ' + order.count +
        '\n💰 ' + order.price +
        ' so‘m\n\n';

    });

    bot.sendMessage(
        msg.chat.id,
        text
    );

});
// ======================
// REFERAL
// ======================

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

        '🔗 Sizning linkingiz:\n' +
        link +

        '\n\n👤 Taklif qilgan odamlar:\n' +
        count

    );

});
console.log('🔥 SMM ADMIN BOT ISHLADI ✅');
// ======================
// RENDER PORT
// ======================

const http = require('http');

http.createServer(function(req, res) {

    res.write('SMM BOT ISHLADI');
    res.end();

}).listen(process.env.PORT || 3000);