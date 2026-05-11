import {
  buildInterviewFirstMessage,
  buildInterviewSystemPrompt,
  getRandomMaleInterviewerName,
} from "./vapiInterviewPrompt.mjs"

const userDoneRegex =
  "(^|\\s)(xong|done|finished|het|hết|hết ý|trả lời xong|tra loi xong|em trả lời xong|em tra loi xong|tôi trả lời xong|toi tra loi xong|mình xin dừng tại đây|minh xin dung tai day)(\\.|!|\\?)?$"

const regexIgnoreCase = [{ type: "ignore-case", enabled: true }]

const acknowledgementPhrases = [
  "i understand",
  "i see",
  "i got it",
  "i hear you",
  "im listening",
  "right",
  "okay",
  "ok",
  "sure",
  "alright",
  "got it",
  "understood",
  "yeah",
  "yes",
  "uh-huh",
  "mm-hmm",
  "ừ",
  "ừm",
  "ờ",
  "à",
  "vâng",
  "dạ",
  "rồi",
  "đúng rồi",
  "được",
]

const interruptionPhrases = [
  "stop",
  "wait",
  "hold",
  "pause",
  "actually",
  "no",
  "dừng",
  "dừng lại",
  "chờ đã",
  "đợi đã",
  "khoan",
  "từ từ",
  "không",
]

export const buildVapiStartCallArgs = ({
  assistantId,
  jobInfo,
  interviewerName = getRandomMaleInterviewerName(),
}) => {
  const interviewPromptOptions = { interviewerName }
  const firstMessage = buildInterviewFirstMessage(jobInfo, interviewPromptOptions)

  return [
    assistantId,
    {
    firstMessageInterruptionsEnabled: false,
    silenceTimeoutSeconds: 90,
    modelOutputInMessagesEnabled: true,
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: buildInterviewSystemPrompt(jobInfo, interviewPromptOptions),
        },
        {
          role: "system",
          content: `Vapi sẽ phát firstMessage riêng cho ứng viên trước khi model trả lời. Nội dung firstMessage: "${firstMessage}". Không lặp lại lời chào, tên interviewer, thời lượng phỏng vấn, hoặc câu "khi bạn sẵn sàng" trong các lượt tiếp theo. Khi ứng viên xác nhận đã sẵn sàng, hãy hỏi câu hỏi phỏng vấn chính đầu tiên ngay.`,
        },
      ],
      temperature: 0.3,
      maxTokens: 200,
    },
    firstMessage,
    backgroundSpeechDenoisingPlan: {
      smartDenoisingPlan: {
        enabled: true,
      },
    },
    startSpeakingPlan: {
      waitSeconds: 1.1,
      customEndpointingRules: [
        {
          type: "customer",
          regex: userDoneRegex,
          regexOptions: regexIgnoreCase,
          timeoutSeconds: 0.7,
        },
        {
          type: "customer",
          regex: ".+",
          timeoutSeconds: 2.3,
        },
      ],
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 1.2,
        onNoPunctuationSeconds: 2.6,
        onNumberSeconds: 2.4,
      },
    },
    stopSpeakingPlan: {
      numWords: 3,
      voiceSeconds: 0.35,
      backoffSeconds: 1.5,
      acknowledgementPhrases,
      interruptionPhrases,
    },
  },
  ]
}
