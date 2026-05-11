import { normalizeInterviewText } from "./vapiInterviewTurnGuard.mjs"

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
    .map(item => item.content.trim())

const isOpeningGreeting = content => {
  const normalized = normalizeInterviewText(content)
  return normalized.startsWith("xin chao") && normalized.length < 80
}

const isOpeningContinuation = content => {
  const normalized = normalizeInterviewText(content)
  return (
    normalized.includes("nguoi phong van tri tue nhan tao") ||
    normalized.includes("buoi phong van") ||
    (
      normalized.includes("san sang") &&
      normalized.includes("bat dau")
    )
  )
}

const isEarlierPartial = (content, laterContents) => {
  const normalized = normalizeInterviewText(content)
  if (!normalized) return true

  return laterContents.some(laterContent => {
    const laterNormalized = normalizeInterviewText(laterContent)
    return (
      laterNormalized !== normalized &&
      (
        laterNormalized.startsWith(normalized) ||
        laterNormalized.includes(normalized)
      )
    )
  })
}

const compactAssistantContents = contents => {
  const compacted = []

  contents.forEach((content, index) => {
    const laterContents = contents.slice(index + 1)
    if (isEarlierPartial(content, laterContents)) return

    const previous = compacted.at(-1)
    if (
      previous &&
      isOpeningGreeting(previous) &&
      isOpeningContinuation(content)
    ) {
      compacted[compacted.length - 1] = `${previous} ${content}`
      return
    }

    if (
      previous &&
      normalizeInterviewText(previous) === normalizeInterviewText(content)
    ) {
      return
    }

    compacted.push(content)
  })

  return compacted
}

export const syncAssistantMessagesFromConversation = (
  previousMessages,
  conversation,
) => {
  const assistantContents = compactAssistantContents(
    getAssistantContents(conversation),
  )
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
