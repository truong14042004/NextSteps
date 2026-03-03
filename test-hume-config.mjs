// Test script to verify Hume API configuration
import { fetchAccessToken } from "hume"

const HUME_API_KEY = process.env.HUME_API_KEY
const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY
const CONFIG_ID = process.env.NEXT_PUBLIC_HUME_CONFIG_ID

console.log("🔍 Testing Hume Configuration...\n")

// 1. Check environment variables
console.log("1️⃣ Environment Variables:")
console.log("   HUME_API_KEY:", HUME_API_KEY ? "✅ Set" : "❌ Missing")
console.log("   HUME_SECRET_KEY:", HUME_SECRET_KEY ? "✅ Set" : "❌ Missing")
console.log("   CONFIG_ID:", CONFIG_ID || "❌ Missing")
console.log()

if (!HUME_API_KEY || !HUME_SECRET_KEY) {
  console.error("❌ Missing API keys. Please check .env.local")
  process.exit(1)
}

// 2. Test access token generation
console.log("2️⃣ Testing Access Token Generation...")
try {
  const accessToken = await fetchAccessToken({
    apiKey: HUME_API_KEY,
    secretKey: HUME_SECRET_KEY,
  })
  
  if (!accessToken) {
    console.error("❌ No access token returned")
    process.exit(1)
  }
  
  console.log("   ✅ Access token generated successfully")
  console.log("   Length:", accessToken.length, "characters")
  console.log("   First 30 chars:", accessToken.substring(0, 30) + "...")
  console.log()
  
  // 3. Test config existence
  console.log("3️⃣ Testing Config ID...")
  console.log("   Attempting to verify config:", CONFIG_ID)
  
  // Try to list configs
  const response = await fetch("https://api.hume.ai/v0/evi/configs", {
    headers: {
      "X-Hume-Api-Key": HUME_API_KEY,
    },
  })
  
  if (!response.ok) {
    console.error("   ❌ Failed to fetch configs:", response.status, response.statusText)
    const text = await response.text()
    console.error("   Response:", text)
  } else {
    const data = await response.json()
    console.log("   ✅ Configs fetched successfully")
    
    if (data.configs_page && Array.isArray(data.configs_page)) {
      console.log("   Total configs:", data.configs_page.length)
      
      const configExists = data.configs_page.some(c => c.id === CONFIG_ID)
      
      if (configExists) {
        console.log("   ✅ Config ID exists!")
        const config = data.configs_page.find(c => c.id === CONFIG_ID)
        console.log("   Config name:", config.name)
        console.log("   Voice ID:", config.voice?.provider, config.voice?.name)
      } else {
        console.error("   ❌ Config ID NOT FOUND in your account")
        console.log("\n   Available configs:")
        data.configs_page.forEach(c => {
          console.log(`      - ${c.id} (${c.name})`)
        })
      }
    } else {
      console.log("   Response data:", JSON.stringify(data, null, 2))
    }
  }
  
  console.log("\n✅ Test completed!")
  
} catch (error) {
  console.error("❌ Error during testing:")
  console.error(error)
  process.exit(1)
}
