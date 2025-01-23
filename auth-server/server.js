import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to accept requests from any origin in development
// In production, you should configure this more strictly
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    return callback(null, origin);
  },
  credentials: true
}));

app.use(express.json());

// Endpoint to get an ephemeral session key
app.post("/session", async (req, res) => {
  try {
    const { model, voice } = req.body;

    if (!model || !voice) {
      return res.status(400).json({
        error: "Missing required parameters: model and voice"
      });
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, voice }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    const data = await response.json();

    // Return the Session Object
    res.send(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`To close the server, press Ctrl+C`);
}); 