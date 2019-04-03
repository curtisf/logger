const pool = require('./src/db/clients/postgres')
const getAllMessages = require('./src/db/interfaces/postgres/read').getAllMessages

async function test() {
    const messages = await getAllMessages()
    const m = await messages[0]
    console.log(new Date().getTime() - new Date(m.ts).getTime())
}

test()