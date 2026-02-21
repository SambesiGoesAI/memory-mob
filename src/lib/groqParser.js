const STORAGE_KEY = 'groq_api_key'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are a reminder parser. Extract from Finnish (or any language) text:
- message: the reminder topic only (concise, strip date/time words), in the same language as input
- date: ISO date YYYY-MM-DD or null if not mentioned. Use todayDate for relative terms: "huomenna"/"tomorrow" = +1 day, "ylihuomenna"/"day after tomorrow" = +2 days, "ensi viikolla"/"next week" = +7 days, "tänään"/"today" = same day
- time: HH:MM 24h format or null if not mentioned. "puolipäivä" = 12:00, "puoli" before hour means :30 (e.g. "puoli kaksi" = 13:30), "iltapäivällä" hint PM, "aamulla" hint AM
Respond ONLY with valid JSON: {"message":"...","date":"...or null","time":"...or null"}`

const groqParser = {
  setApiKey(key) {
    localStorage.setItem(STORAGE_KEY, key)
  },

  getApiKey() {
    return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_GROQ_API_KEY || ''
  },

  hasApiKey() {
    return Boolean(this.getApiKey())
  },

  async parse(transcript, todayDateStr) {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('No Groq API key configured.')
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Today is ${todayDateStr}.\n\nText: "${transcript}"` },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Groq API error ${response.status}: ${errorText || response.statusText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Groq API returned an empty response.')
    }

    let parsed
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error(`Failed to parse JSON from Groq response: ${content}`)
    }

    return {
      message: parsed.message || '',
      date: parsed.date && parsed.date !== 'null' ? parsed.date : null,
      time: parsed.time && parsed.time !== 'null' ? parsed.time : null,
    }
  },
}

export default groqParser
