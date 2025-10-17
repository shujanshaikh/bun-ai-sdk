import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useCallback, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { WebsocketChatTransport } from '@/lib/transport-ws';
import { lastAssistantMessageIsCompleteWithToolCalls, tool } from 'ai';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './ai-elements/reasoning';
import { Loader } from './ai-elements/loader';

const Chat = () => {
  const [text, setText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);

  // I need to specify the tool call result what type of tool call is this 

  const handleToolCall = useCallback((result: any) => {
    return result
  }, []);

 const transport = new WebsocketChatTransport({
    agent: 'agent',
    toolCallCallback: handleToolCall,
    url: 'ws://localhost:8787/agents/agent/agent',
  });

  const { messages, sendMessage, status } = useChat({
    onFinish: () => setLoading(false),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport,
  });
  //console.log('messages', messages);
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
    );
    setText('');
  };



  return (
    <div className="max-w-4xl mx-2 p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                    }
                  })}
                
                </MessageContent>
              </Message>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              ref={textareaRef}
              value={text}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !loading} status={loading ? 'submitted' : undefined} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default Chat;