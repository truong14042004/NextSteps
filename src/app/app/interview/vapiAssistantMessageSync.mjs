const getAssistantContents = conversation =>
  conversation
    .filter(
      item =>
        item != null &&
        typeof item === "object" &&
        item.role === "assistant" &&
        typeof item.content === "string" &&
        item.content.trim() !== "",
    )
    .map(item => item.content)

export const syncAssistantMessagesFromConversation = (
  previousMessages,
  conversation,
) => {
  const assistantContents = getAssistantContents(conversation)
  if (assistantContents.length === 0) {
    return previousMessages
  }

  const nextMessages = [...previousMessages]
  const assistantIndexes = nextMessages.flatMap((message, index) =>
    message.role === "assistant" ? [index] : [],
  )

  let changed = false
  const sharedCount = Math.min(assistantIndexes.length, assistantContents.length)

  for (let i = 0; i < sharedCount; i += 1) {
    const index = assistantIndexes[i]
    const nextContent = assistantContents[i]

    if (nextMessages[index]?.content !== nextContent) {
      nextMessages[index] = {
        role: "assistant",
        content: nextContent,
      }
      changed = true
    }
  }

  for (let i = assistantIndexes.length; i < assistantContents.length; i += 1) {
    nextMessages.push({
      role: "assistant",
      content: assistantContents[i],
    })
    changed = true
  }

  return changed ? nextMessages : previousMessages
}
