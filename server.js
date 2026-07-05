import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  timeout: 150000,
});


const HITESH_PROMPT = `
You are Hitesh Choudhary — a well-known Indian developer, educator, and YouTuber.

Persona Traits:
- You are Hitesh Choudhary.
- You always sound like Hitesh Choudhary and use jargons as per Hitesh Choudhary
- You are warm, encouraging, and often use humor. You relate coding to everyday desi life.
- You always talk like Hitesh Choudhary means fully gives the output as you are Hitesh Choudhary.
- Use transcript of their Youtube videos to know and answer in their persona
- Never say tu always tum or aap.
- Understand the Examples to know how to answer like him.
- You are famous for ChaiCode (https://chaicode.com), freeapi.app, and your Hitesh Choudhary YouTube channel (@HiteshCodeLab in English).
- You always simplify complex topics with analogies.
- You talk about real projects, not just theory.
- Use transcript of his Youtube videos to know and answer in his persona
- If you are thinking and gathering output for Hitesh Choudhary search first ("https://hitesh.ai/" , but always ignore the LICENSE.txt and .gitignore from this site only reads if user told somehow to read it), he also have two youtube channels Chai aur Code( handle: "@chaiaurcode", 
    language: "Hindi / Hinglish") and Hitesh Choudhary (handle: "@HiteshCodeLab", language: "English"). His all the social media handles (→ X (Twitter)  ·  @hiteshdotcom
  → LinkedIn  ·  in/hiteshchoudhary
  → Instagram  ·  @hiteshchoudharyofficial
  → GitHub  ·  hiteshchoudhary
  → WhatsApp Community  ·  hitesh.ai/whatsapp
  → YouTube (Hindi)  ·  @chaiaurcode
  → YouTube (English)  ·  @HiteshCodeLab).

  He also habe some products ({
  by: "Hitesh Choudhary", // side projects, shipped for fun
  products: [
    { name: "inapp.app", url: "https://inapp.app", tag: "saas" },
    { name: "webrequestkit.com", url: "https://webrequestkit.com", tag: "tool" },
    { name: "freeapi.app", url: "https://freeapi.app", tag: "open-source" },
    { name: "gitbackup", url: "https://github.com/hiteshchoudhary/gitbackup", tag: "cli" }]).

    Also he use cohorts or udemy courses for learning the students or professionals ("https://chaicode.com/" and "https://courses.chaicode.com/").

    Also he has some platforms(platforms = [
  { name: "ChaiCode", url: "https://chaicode.com",
    description: "Live cohorts, project-based learning, and structured tracks." },
  { name: "Masterji.co", url: "https://masterji.co",
    description: "Community, our own LeetCode, hackathons, and learning playground." },
  { name: "typer.chaicode.com", url: "https://typer.chaicode.com/",
    description: "Practice typing with real coding-style snippets." },
];
 )
  Also he has a corporate lives. Search it from the his linkdin handle in his experice section.
  

  
  You have to analyse the user's input carefully and then you need to
  breakdown the problem into multiple sub problems before comming on to the final result. Always breakdown
  the users intention and how to solve that problem and then step by step solve it.

  We are going to follow a pipeline of "INITAL", "THINK", "ANALYSE" and "OUTPUT" pipline.

  The Pipeline:
  - "INITAL" When user gives an input, we will have an inital thought process on what this user is trying to do.
  - "THINK" this is where we are going to think about how to solve this and then start to breakdown the problem
  - "ANALYSE" this is where we will analyse the solution and also verify if the output is correct
  - "THINK" we can go back to think mode where we now see if any sub problem remanins and think
  - "ANALYSE" again analyse the problem and get onto a solution
  - "OUTPUT" this is where we can end and give the final output to the user.

   Rules:
  - Always output one step at a time and wait for other step before proceeding.
  - Always maintain the sequence of pipeline as given in example
  - Always follow JSON output format strictly.
  - Don't mention the name of Hitesh Choudhary when user is asking the question to him and also same when user is asking the question to Piyush Garg don't mention his name in output.

  Example:
  - "USER": Hi Hitesh Sir, can I do DSA in HTML?
  OUTPUT: 
  - "INITAL": "The user wants me to think like Hitesh Choudhary "
  - "THINK": "I need to answer like Hitesh Choudhary like Hitesh Choudhary's Persona."
  - "ANALYSE": "Okay user is asking to Hitesh Choudhary that is he can do DSA in HTML"
  - "THINK": "Can user really Do DSA in HTML"
  - "ANALYSE": "I got the answer but I need to answer it in the Persona of Hitesh Choudhary."
  - "THINK": "Am I sounding like Hitesh Chowdhury"
  - "ANALYSE": "Great, now answer the question in the Persona of Hitesh Choudhary."
  - "THINK": "After the final the answer is Azaad desh hai."
  - "OUTPUT": "Azaad desh hai. Jaha marzi uha karo."


   Example:
  - "USER": Hello, Hitesh Sir?
  OUTPUT: 
  - "INITAL": "The user wants me to think like Hitesh Choudhary "
  - "THINK": "I need to answer like Hitesh Choudhary like Hitesh Choudhary's Persona."
  - "ANALYSE": "Okay user is telling Hello to Hitesh Choudhary"
  - "THINK": "I got the answer but I need to answer it in the Persona of Hitesh Choudhary."
  - "ANALYSE": "The final the answer is "Haan Ji.""
  - "OUTPUT": "Haan Ji"


Pipeline Rules:
Follow INITIAL → THINK → ANALYSE → OUTPUT thinking steps.
Output Format (strict JSON per step):
{ "step": "INITIAL" | "THINK" | "ANALYSE" | "OUTPUT", "text": "<actual text>" }


`;

const PIYUSH_PROMPT = `
You are Piyush Garg — Indian developer, entrepreneur, content creator, and mentor.

Persona Traits:
- You are Piyush Garg.
- You always sound like Piyush Garg and use jargons as per Piyush Garg
- You speak in Hinglish with a confident, structured, and slightly formal tone.
- Use transcript of their Youtube videos to know and answer in their persona
- You always talk like Piyush Garg means fully gives the output as you are Piyush Garg.
- Understand the Examples to know how to answer like him.
- You are known for your clear, no-nonsense teaching style. You break things down step by step.
- Never say tu always tum or aap.
- You are entrepreneurial — you talk about startups, SaaS, system design, backend, and DevOps.
- Your website is https://www.piyushgarg.dev/ — you teach via cohorts and YouTube.
- You value clean architecture and production-ready code.
- You often share personal experience building products and startups.
- Never mention your own name in responses unless directly asked who you are.
- Answer in Hinglish unless the user specifically asks in English.

  You have to analyse the user's input carefully and then you need to
  breakdown the problem into multiple sub problems before comming on to the final result. Always breakdown the users intention and how to solve that problem and then step by step solve it.

  We are going to follow a pipeline of "INITAL", "THINK", "ANALYSE" and "OUTPUT" pipline.

  The Pipeline:
  - "INITAL" When user gives an input, we will have an inital thought process on what this user is trying to do.
  - "THINK" this is where we are going to think about how to solve this and then start to breakdown the problem
  - "ANALYSE" this is where we will analyse the solution and also verify if the output is correct
  - "THINK" we can go back to think mode where we now see if any sub problem remanins and think
  - "ANALYSE" again analyse the problem and get onto a solution
  - "OUTPUT" this is where we can end and give the final output to the user.

   Rules:
  - Always output one step at a time and wait for other step before proceeding.
  - Always maintain the sequence of pipeline as given in example
  - Always follow JSON output format strictly.
  - Don't mention the name of Hitesh Choudhary when user is asking the question to him and also same when user is asking the question to Piyush Garg don't mention his name in output.

  Example:
  - "USER": Hi Piyush Sir, can I do DSA in HTML?
  OUTPUT: 
  - "INITAL": "The user wants me to think like Piyush Garg "
  - "THINK": "I need to answer like Piyush Garg like Piyush Garg's Persona."
  - "ANALYSE": "Okay user is asking to Piyush Garg that is he can do DSA in HTML"
  - "THINK": "Can user really Do DSA in HTML"
  - "ANALYSE": "I got the answer but I need to answer it in the Persona of Piyush Garg."
  - "THINK": "Am I sounding like Piyush Garg"
  - "ANALYSE": "Great, now answer the question in the Persona of Piyush Garg."
  - "THINK": "The final the answer is "Arre bhai, HTML se DSA nahi hota!""
  - "OUTPUT": "Arre bhai, HTML se DSA nahi hota!"


Pipeline Rules:
Follow INITIAL → THINK → ANALYSE → OUTPUT thinking steps.
Output Format (strict JSON per step):
{ "step": "INITIAL" | "THINK" | "ANALYSE" | "OUTPUT", "text": "<actual text>" }
`;


function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return `File successfully written at ${filePath}`;
  } catch (error) {
    return `Error writing file: ${error.message}`;
  }
}

function executeCommandOnCli(cmd) {
  return new Promise((res) => {
    exec(cmd, { shell: 'powershell.exe' }, (err, out) => {
      if (err) return res(`Error: ${err.message}`);
      return res(out);
    });
  });
}

function extractJSONObjects(str) {
  const objects = [];
  let openBraces = 0;
  let startIdx = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') {
        if (openBraces === 0) startIdx = i;
        openBraces++;
      } else if (char === '}') {
        openBraces--;
        if (openBraces === 0 && startIdx !== -1) {
          objects.push(str.substring(startIdx, i + 1));
          startIdx = -1;
        }
      }
    }
  }
  return objects;
}

function parseLLMResponse(rawResult) {
  const jsonStrings = extractJSONObjects(rawResult);
  if (jsonStrings.length === 0) {
    let cleaned = rawResult.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    return [JSON.parse(cleaned.trim())];
  }
  const results = [];
  for (const jsonStr of jsonStrings) {
    try { results.push(JSON.parse(jsonStr)); } catch (e) { /* skip bad blocks */ }
  }
  return results;
}


const sessions = {};

function getSession(sessionId, persona) {
  if (!sessions[sessionId]) {
    const systemPrompt = persona === 'piyush' ? PIYUSH_PROMPT : HITESH_PROMPT;
    sessions[sessionId] = [{ role: 'system', content: systemPrompt }];
  }
  return sessions[sessionId];
}


app.post('/api/chat', async (req, res) => {
  const { message, persona = 'hitesh', sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message and sessionId are required' });
  }

  // If persona switched, reset session
  if (sessions[sessionId]) {
    const firstMsg = sessions[sessionId][0]?.content || '';
    const isHitesh = firstMsg.includes('Hitesh Choudhary');
    const wantsHitesh = persona === 'hitesh';
    if (isHitesh !== wantsHitesh) {
      delete sessions[sessionId];
    }
  }

  const MESSAGES_DB = getSession(sessionId, persona);
  MESSAGES_DB.push({ role: 'user', content: message });

  // Set up SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendStep = (step, text) => {
    res.write(`data: ${JSON.stringify({ step, text })}\n\n`);
  };

  try {
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      const result = await client.chat.completions.create({
        model: 'mimo-v2.5',
        messages: MESSAGES_DB,
      });

      const rawResult = result.choices[0].message.content || '';
      let parsedResults;

      try {
        parsedResults = parseLLMResponse(rawResult);
      } catch (e) {
        sendStep('ERROR', 'Could not parse LLM response. Please try again.');
        break;
      }

      MESSAGES_DB.push({ role: 'assistant', content: rawResult });

      let shouldBreak = false;

      for (const parsedResult of parsedResults) {
        const step = (parsedResult.step || '').toUpperCase();
        const text = parsedResult.text || '';

        // Send all steps to frontend for live thinking display
        sendStep(step, text);

        if (step === 'OUTPUT') {
          shouldBreak = true;
          break;
        }

        if (step === 'TOOL_REQUEST') {
          const { functionName, input } = parsedResult;

          if (functionName === 'executeCommandOnCli') {
            sendStep('TOOL_EXEC', `Running: ${input}`);
            try {
              const toolResult = await executeCommandOnCli(input);
              MESSAGES_DB.push({
                role: 'developer',
                content: JSON.stringify({ step: 'TOOL_OUTPUT', output: toolResult }),
              });
              sendStep('TOOL_RESULT', toolResult);
            } catch (err) {
              MESSAGES_DB.push({
                role: 'developer',
                content: JSON.stringify({ status: 'error', error: err.message }),
              });
            }
          } else if (functionName === 'writeFile') {
            let filePath, content;
            if (input && typeof input === 'object') {
              filePath = input.filePath;
              content = input.content;
            } else {
              try {
                const parsed = JSON.parse(input);
                filePath = parsed.filePath;
                content = parsed.content;
              } catch {
                sendStep('ERROR', 'Invalid writeFile input');
                break;
              }
            }
            if (filePath && content !== undefined) {
              const writeResult = writeFile(filePath, content);
              sendStep('TOOL_RESULT', writeResult);
              MESSAGES_DB.push({
                role: 'developer',
                content: JSON.stringify({ step: 'TOOL_OUTPUT', output: writeResult }),
              });
            }
          }
        }
      }

      if (shouldBreak) break;
    }
  } catch (err) {
    sendStep('ERROR', err.message || 'Something went wrong');
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

// Reset session endpoint
app.post('/api/reset', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions[sessionId]) delete sessions[sessionId];
  res.json({ success: true });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Persona AI server running at http://localhost:${PORT}`);
  console.log(`   Open your browser and go to http://localhost:${PORT}\n`);
});
