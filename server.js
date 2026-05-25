const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

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