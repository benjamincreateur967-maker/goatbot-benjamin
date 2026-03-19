const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Variables d'environnement (Render)
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const HF_API_KEY = process.env.HF_API_KEY;

// Vérification du webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook vérifié !");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Réception des messages
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;
        let botMessage = "";

        // Réponse personnalisée
        if (
          userMessage.toLowerCase().includes("qui t'a créé") ||
          userMessage.toLowerCase().includes("qui ta créé")
        ) {
          botMessage = "Mon créateur s'appelle Benjamin Créator 🤖🔥";
        } else {
          try {
            const hfResponse = await axios.post(
              "https://api-inference.huggingface.co/models/gpt2",
              { inputs: userMessage },
              { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
            );
            botMessage = hfResponse.data[0].generated_text;
          } catch (error) {
            botMessage = "Erreur, réessaie plus tard.";
          }
        }

        await axios.post(
          `https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
          {
            recipient: { id: sender_psid },
            message: { text: botMessage }
          }
        );
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("GOATBOT actif 🚀"));
