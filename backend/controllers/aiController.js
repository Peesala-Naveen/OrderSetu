const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const generateMenuDescription = async (req, res) => {
    try {
        const { name, cost } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Item name is required" });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: "You are a professional food app copywriter."
                },
                {
                    role: "user",
                    content: `Write a short, attractive restaurant menu description (1–2 lines).

Item: ${name}
Price: ₹${cost || "N/A"}`
                }
            ],
            temperature: 0.7,
        });

        return res.status(200).json({
            description: completion.choices[0].message.content.trim()
        });

    } catch (error) {
        console.error("Groq AI Error:", error);
        res.status(500).json({
            message: "AI generation failed",
            error: error.message
        });
    }
};

module.exports = { generateMenuDescription };