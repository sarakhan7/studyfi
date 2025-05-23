document.addEventListener("DOMContentLoaded", async () => {
  let vocabList = [];
  let current = 0;

  const vocabWord = document.getElementById("vocab-word");
  const vocabInput = document.getElementById("vocab-input");
  const vocabFeedback = document.getElementById("vocab-feedback");

  const submitBtn = document.getElementById("submit-btn");
  const skipBtn = document.getElementById("skip-btn");
  const knownBtn = document.getElementById("known-btn");
  const unknownBtn = document.getElementById("unknown-btn");

  const userNotes = localStorage.getItem("userNotes");

  if (userNotes) {
    try {
      const apiKey = "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"; // OpenRouter

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Extract exactly 5 vocabulary terms and their definitions from the following notes. Return ONLY valid JSON in this format: 
[{"word": "Term", "definition": "Definition"}, ...]
Do not include any explanation or markdown formatting. Notes:\n${userNotes}`
            }
          ]
        })
      });

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? null;
      console.log("OpenRouter raw response:", text);

      if (!text) throw new Error("OpenRouter returned empty response");

      // 🧼 Strip markdown fences if present
      const cleanText = text
        .replace(/```json/i, "")
        .replace(/```/, "")
        .trim();

      vocabList = JSON.parse(cleanText);
    } catch (err) {
      console.error("❌ Error loading vocab from OpenRouter:", err);
      vocabList = getFallbackList();
    }
  } else {
    vocabList = getFallbackList();
  }

  if (!vocabList.length) {
    vocabWord.textContent = "No vocab found.";
    return;
  }

  function loadWord() {
    vocabFeedback.textContent = "";
    vocabInput.value = "";
    vocabWord.textContent = vocabList[current].word;
  }

  function checkDefinition() {
    const input = vocabInput.value.trim().toLowerCase();
    const correct = vocabList[current].definition.toLowerCase();

    if (input && (correct.includes(input) || input.includes(correct))) {
      vocabFeedback.textContent = "✅ Correct!";
      vocabFeedback.style.color = "green";
    } else {
      vocabFeedback.textContent = `❌ Nope. It was: ${vocabList[current].definition}`;
      vocabFeedback.style.color = "red";
    }
  }

  function skipWord() {
    current = (current + 1) % vocabList.length;
    loadWord();
  }

  function markKnown() {
    skipWord(); // optional tracking
  }

  function markUnknown() {
    skipWord();
  }

  submitBtn.addEventListener("click", checkDefinition);
  skipBtn.addEventListener("click", skipWord);
  knownBtn.addEventListener("click", markKnown);
  unknownBtn.addEventListener("click", markUnknown);

  loadWord();

  function getFallbackList() {
    return [
      { word: "Atom", definition: "The smallest unit of matter." },
      { word: "Evaporation", definition: "Liquid turning into vapor." },
      { word: "Osmosis", definition: "Water movement through a membrane." },
      { word: "Photosynthesis", definition: "How plants make food from light." },
      { word: "Mitosis", definition: "Cell division into two identical cells." }
    ];
  }
});
