import {
  buildInterviewFirstMessage,
  buildInterviewSystemPrompt,
} from "./vapiInterviewPrompt.mjs"

export const buildVapiStartCallArgs = ({
  assistantId,
  jobInfo,
}) => [
  assistantId,
  {
    modelOutputInMessagesEnabled: true,
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: buildInterviewSystemPrompt(jobInfo),
        },
      ],
      temperature: 0.3,
      maxTokens: 200,
    },
    firstMessage: buildInterviewFirstMessage(jobInfo),
  },
]
