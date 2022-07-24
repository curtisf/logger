module.exports.replyToInteraction = async (id, token, content, ephemeral = false) => {
  try {
    if (content.description || content.title || content.fields) content = { embeds: Array.isArray(content) ? content : [content] }
    return global.bot.requestHandler.request('POST', `/interactions/${id}/${token}/callback`, true, {
      type: 4,
      data: {
        ...(content),
        allowed_mentions: {
          everyone: false,
          roles: false,
          users: false
        },
        ...(ephemeral ? { flags: 64 } : { })
      }
    })
  } catch (err) {
    console.error(err)
  }
}

module.exports.editInteractionMessage = async (interactionToken, content) => {
  if (Array.isArray(content)) content = { embeds: content }
  else if (content.description || content.title || content.fields) content = { embeds: content }
  return global.bot.requestHandler.request('PATCH', `/webhooks/${global.bot.user.id}/${interactionToken}/messages/@original`, true, {
    ...(content)
  }).catch((e) => { console.error(e) })
}

module.exports.deleteInteractionMessage = async (interactionToken, id) => {
  return global.bot.requestHandler.request('DELETE', `/webhooks/${global.bot.user.id}/${interactionToken}/messages/${id || '@original'}`, true)
}
