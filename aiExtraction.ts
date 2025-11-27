import OpenAI from "openai";
import { ExtractedCardData } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
});

export async function extractCardData(
  base64Image: string
): Promise<ExtractedCardData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this business card image and extract the following information. Return ONLY a valid JSON object with these exact fields (use empty string if not found):
{
  "name": "person's name",
  "businessName": "company or business name",
  "mobile": "phone/mobile number",
  "email": "email address",
  "address": "physical address",
  "businessType": "type of business (e.g., Retail, Manufacturing, Services, Wholesale, etc.)"
}

Be thorough in extracting all visible information. For business type, infer from the business name or any other clues if not explicitly stated.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || "",
        businessName: parsed.businessName || "",
        mobile: parsed.mobile || "",
        email: parsed.email || "",
        address: parsed.address || "",
        businessType: parsed.businessType || "",
      };
    }

    return {
      name: "",
      businessName: "",
      mobile: "",
      email: "",
      address: "",
      businessType: "",
    };
  } catch (error) {
    console.error("AI extraction error:", error);
    return {
      name: "",
      businessName: "",
      mobile: "",
      email: "",
      address: "",
      businessType: "",
    };
  }
}
