const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildMemberUpdate',
  type: 'on',
  handle: async (guild, member, oldMember) => {
      
  }
}

function arrayCompare(base, toCompare) {
  let baseArr = base.filter(i => {return toCompare.indexOf(i) < 0;})
  let comparedArr = toCompare.filter(i => {return base.indexOf(i) < 0;})
  return baseArr.concat(comparedArr)
}