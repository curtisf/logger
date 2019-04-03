const addNewName = require('../../db/interfaces/postgres/update').updateNames

module.exports = {
  name: 'userUpdate',
  type: 'on',
  handle: async (user, oldUser) => {
    if (user && oldUser && user.username && oldUser.username && user.username !== oldUser.username) { // add username checks due to events being fired before READY
      await addNewName(user.id, user.username)
    }
  }
}
