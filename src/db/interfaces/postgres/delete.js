const pool = require('../../clients/postgres')

exports.deleteGuild = async function (guildID) {
    return await pool.query('DELETE FROM guilds WHERE id=$1', [guildID])
}

exports.deleteUser = async function (userID) {
    return await pool.query('DELETE FROM users WHERE id=$1', [userID])
}
