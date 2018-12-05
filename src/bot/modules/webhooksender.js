const webhookCache = require('./webhookcache')
const guildWebhookCacher = require('./guildWebhookCacher')

module.exports = async (package) => {
    if (!package.guildID) return global.logger.error('No guildID was provided in an embed!')
    
    let guildSettings = global.bot.guildSettingsCache[package.guildID]
    let webhook = await webhookCache.getWebhook(guildSettings.getEventByName(package.eventName))
    let webhookID, webhookToken
    if (webhook) {
        let split = webhook.split('|')
        webhookID = split[0]
        webhookToken = split[1]
    }
    if (!webhook && guildSettings.getEventByName(package.eventName)) {
        console.log('supposed to have a hook my guy')
        await guildWebhookCacher(package.guildID)
        return await setTimeout(() => {
            module.exports(package)
        }, 2000)
    } else if (webhook && !guildSettings.eventIsDisabled(package.eventName)) {
        console.log('already cached >:)')
        if (!package.embed.footer) {
            package.embed.footer = {
                text: global.bot.user.username + '#' + global.bot.user.discriminator,
                icon_url: global.bot.user.avatarURL
            }
        }
        if (!package.embed.timestamp) package.embed.timestamp = new Date()
        global.bot.executeWebhook(webhookID, webhookToken, {
            file: package.file ? package.file : '',
            username: global.bot.user.username,
            avatarURL: global.bot.user.avatarURL,
            embeds: [package.embed]
        }).catch(async (e) => {
            if (e.code === 10015) { // Webhook doesn't exist anymore.
                await global.redis.del(`webhook-${guildSettings.getEventByName(package.eventName)}`)
                return await guildWebhookCacher(package.guildID)
            } else {
                console.error(e)
            }
        })
    } else console.log('nothing but spooks here!')
}