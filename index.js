import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const prompt = (q = "") => rl.question(q);

const client = new Anthropic({
  apiKey: process.env.Claude_KEY,
});

function add_user_message(messages, text) {
  let user_message = { role: "user", content: text };
  messages.push(user_message);
}

function add_assistant_message(messages, content) {
  let assistant_message = { role: "assistant", content };
  messages.push(assistant_message);
}

// make a request to the API
async function chat(messages) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: messages,
  });
  //   console.log(message.content[0].text);
  return message.content[0].text;
}

// create a while True loop to keep the conversation going until the user types "exit"
const messages = [];
while (true) {
  let user_input = await prompt(">");
  if (user_input.toLowerCase() === "exit") {
    rl.close();
    break;
  }
  add_user_message(messages, user_input);
  const answer = await chat(messages);
  console.log(answer);
  console.log(messages);
  add_assistant_message(messages, answer);
}
