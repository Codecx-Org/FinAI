import { ChatbotAgent } from "./agent.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const agent = new ChatbotAgent();
  
  console.log("Initializing Fin-AI Chatbot...");
  await agent.initialize();
  console.log("Fin-AI Chatbot ready! Type 'exit' to quit.");

  const chatHistory: any[] = [];

  const ask = () => {
    rl.question("You: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        process.exit(0);
      }

      try {
        const response = await agent.chat(input, chatHistory);
        console.log(`Fin-AI: ${response}`);
        chatHistory.push(["human", input]);
        chatHistory.push(["ai", response]);
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
      }

      ask();
    });
  };

  ask();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
