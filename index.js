const PORT = process.env.PORT || 5000;
const TOKEN = process.env.TOKEN || 'b8406554a1a53e323621e448a8bb0834f3a50b15a0820804602a35754d1d845ebfe1c593eaea91c51d6e8';
const CONFIRMATION = process.env.CONFIRMATION || 'bbab41d1';
const DIR = "funds"

// https://nameless-badlands-65161.herokuapp.com/

const frases = require('./frases')
const database = require('./database')

const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const schedule = require('node-schedule'); // !!!

const {Botact} = require('botact');

const bot = new Botact({
    confirmation: CONFIRMATION,
    token: TOKEN
});


// var cache = require('memory-cache');
// var newCache = new cache.Cache();
//=====================INIT==================================

function sendState(ctx, thisState, nextState, about) {
    console.log(thisState)
    database.updateData(`${DIR}/users/vk/${ctx.user_id}`, {state: nextState});
    frases[thisState](ctx.user_id, function (link) {
        bot.reply(+ctx.user_id, link)
    });
    if (about) {
        setTimeout(function () {
            console.log("about")
            bot.reply(+ctx.user_id, frases.homeTrigger)
        }, 900000)//900000)
    }
}

function sendTimeoutState(ctx, thisState, nextState, timeout, about) {
    console.log(thisState + " timeout " + (timeout / 1000))
    return setTimeout(function () {
        database.getData(DIR + "/" + `users/vk/${ctx.user_id}/state`, function (state, error) {
            if (!error && state === thisState) {
                sendState(ctx, thisState, nextState, about);
            }
        })
        return true
    }, timeout)
}

bot.hears(/(Начать|start|Start|Старт|старт|Поехали!|поехали|Поехали|поехали!|Начинаем|Го|Go|go|го|Он сказал поехали и махнул рукой)/, function (ctx) {
    sendState(ctx, 'video3_1', 'video3_2', true);
})

bot.hears(/(привет|Привет|Добрый день|Здравствуйте)/, function (ctx) {
    ctx.reply('Здравствуйте!\n Напишите start')
})

bot.event('group_join', ({reply}) => reply(frases.start))


//=====================TEST==================================

bot.command('getMyId', ctx => {
    ctx.reply(ctx.user_id)
})

bot.command('test', function (ctx) {
    ctx.sendMessage(ctx.user_id, frases.homeTrigger)
})


//=====================7am==================================

schedule.scheduleJob('7 * * *', function () {
    database.getData(DIR + "/" + `users/vk/`, function (users, error) {
        if (users && !error) {
            for (var temp in users) {
                var ctx = {user_id: temp}
                console.log(ctx)
                var data = users[temp]
                if (!error && data.state !== undefined) {
                    if (data.state === 'video3_2') {
                        sendState(ctx, "video3_2", "video3_3")

                    } else if (data.state === 'video3_3') {
                        sendState(ctx, "video3_3", "video5_pay")

                    } else if (data.state === 'video5_pay') {
                        sendState(ctx, "video5_pay", "video4_1")
                        sendTimeoutState(ctx, "video4_1", "video4_2", 129600000, true)//129600000

                    } else if (data.state === 'video4_2') {
                        sendState(ctx, "video4_2", "video4_3")

                    } else if (data.state === 'video4_3') {
                        sendState(ctx, "video4_3", "video5_1_pay")

                    } else if (data.state === 'video5_1_pay') {
                        sendState(ctx, "video5_1_pay", "watch1")

                    } else if (data.state === 'video1_2') {
                        sendState(ctx, "video1_2", "video6_1_pay")

                    } else if (data.state === 'video6_1_pay') {
                        sendState(ctx, 'video6_1_pay', 'video2_1');
                        sendTimeoutState(ctx, "video2_1", "video6_2_pay", 3600000, true)//3600000
                        sendTimeoutState(ctx, "video6_2_pay", "watch2", 3600000+3600000)//3600000+3600000

                    }
                } else {
                    console.log(error)
                }
            }
        }
    })
})


bot.command('1', function (ctx) {
    ctx.reply(frases.aboutAuthor);
})
bot.command('2', function (ctx) {
    ctx.reply(frases.aboutCompany);
})

bot.command('3', function (ctx) {
    ctx.reply('Напишите команду call и свой номер телефона в формате (call 89001112233)');
    bot.use(ctx => ctx.phone = true)
})

bot.hears(/(call)/, function (ctx) {
    if (ctx.body.split("call ")[1]) {
        var date = new Date()
        console.log(date.getTimezoneOffset())

        ctx.reply("Вам перезвонят!");
        database.pushData('backCalls/', {
            url: `https://vk.com/id${ctx.user_id}`,
            time: date.getTime(),
            phone: (ctx.body.split("call ")[1] || "-")
        })
    } else {
        ctx.reply("Попробуйте еще раз :c");

    }
})


bot.command('Stop', function (ctx) {
    ctx.sendMessage(ctx.user_id, 'Бот был остановлен');
    database.updateData(`${DIR}/users/vk/${ctx.user_id}`, {state: 'none'});
})

bot.command('stop', function (ctx) {
    ctx.sendMessage(ctx.user_id, 'Бот был остановлен');
    database.updateData(`${DIR}/users/vk/${ctx.user_id}`, {state: 'none'});
})

//===============================================
// bot.command('onpay1', function (ctx) {
//     bot.reply(ctx.user_id, frases.video5);
// })
// bot.command('onwatch1', function (ctx) {
//     sendState(ctx, "video6_pay", "video1_1")
//     sendTimeoutState(ctx, "video1_1", "video1_2", 172800000, true)//172800000
//     console.log('========')
// })
// bot.command('onpay2', function (ctx) {
//     bot.reply(ctx.user_id, frases.video6);
// })
// bot.command('onwatch2', function (ctx) {
//     bot.reply(ctx.user_id, frases.video7_about);
// })
//===============================================


bot.on(({reply}) => reply(frases.error))


app.use(bodyParser.json());
app.post("/", function (req, res) {
    try {
        // console.log(req.body);
        if (!req.body || req.body === {}) return res.sendStatus(400);
        else if (req.body.salesjet_request) {
            var ctx = req.body.data;
            ctx.user_id = +ctx.user_id;
            switch (req.body.data.event) {
                case 'pay1':
                    bot.reply(ctx.user_id, frases.video5);
                    break;
                case 'pay2':
                    bot.reply(ctx.user_id, frases.video6);
                    break;
                case 'watch1':
                    sendState(ctx, "video6_pay", "video1_1")
                    sendTimeoutState(ctx, "video1_1", "video1_2", 172800000, true)//172800000
                    break;
                case 'watch2':
                    bot.reply(ctx.user_id, frases.video7_about);
                    break;
            }
            return res.sendStatus(200)
        }
        else {
            bot.listen(req, res)
        }

    }
    catch (e) {
        bot.reply('394439978', e.toString())
    }

});


app.listen(PORT);
console.log('\nbot has been started');





