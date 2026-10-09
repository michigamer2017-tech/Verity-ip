import { WebSocketServer } from 'ws';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const wss = new WebSocketServer({ port: process.env.PORT || 3000 });

console.log("Verity WSS corriendo...");

wss.on('connection', ws => {
  console.log("Jugador conectado");
  ws.on('message', async (data) => {
    try {
      let msg = data.toString();
      // El addon manda JSON, sacamos el texto
      let text = msg;
      try { text = JSON.parse(msg).body?.properties?.message || msg; } catch {}

      console.log("Minecraft dice:", text);

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Sos Verity, una bolita amarilla amigable pero creepy. Responde corto, en español, misterioso." },
          { role: "user", content: text }
        ]
      });

      const reply = completion.choices[0].message.content;

      // Respuesta para Bedrock
      ws.send(JSON.stringify({
        header: { messagePurpose: "commandResponse" },
        body: { statusMessage: reply }
      }));

      // También como chat
      ws.send(JSON.stringify({
        header: { messagePurpose: "commandRequest" },
        body: { commandLine: `tellraw @a {"rawtext":[{"text":"§e[Verity] §f${reply}"}]}` }
      }));

    } catch(e){ console.error(e); }
  });
});
