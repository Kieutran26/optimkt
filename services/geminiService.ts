import { GoogleGenAI } from "@google/genai";
import { ContentPillar, AdsHealthInput, AdsHealthResult, BrandPositioningInput, BrandPositioningResult, PricingAnalyzerInput, PricingAnalyzerResult, AudienceEmotionMapInput, AudienceEmotionMapResult } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// NOTE: These settings are critical for local usage where default filters are stricter.
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
] as any; // Type assertion to bypass strict typing

export const translateText = async (text: string, from: 'en' | 'vi', to: 'en' | 'vi'): Promise<string> => {
    const sourceLang = from === 'en' ? 'English' : 'Vietnamese';
    const targetLang = to === 'en' ? 'English' : 'Vietnamese';

    const systemPrompt = `You are a professional translator. 
  Your task is to translate the user's text from ${sourceLang} to ${targetLang}.
IMPORTANT: Return ONLY the translated text.Do not add any explanations, notes, pronunciation guides, or extra punctuation that is not in the original text.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.1, // Low temperature for deterministic translations
                safetySettings: SAFETY_SETTINGS,
            },
        });

        return response.text?.trim() || "Translation error.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error: Could not translate. Check API Key.";
    }
};

export const generateMultiPlatformContent = async (
    sampleContent: string,
    platforms: string[]
): Promise<Record<string, any>> => {
    if (!sampleContent.trim() || platforms.length === 0) return {};

    const systemPrompt = `You are an expert social media content creator and SEO specialist.
  Your task is to take the provided "Sample Content" and rewrite / optimize it for each of the requested platforms.
  
  Guidelines per platform:
- Facebook: Engaging, conversational, encourage sharing / comments.Use moderate emojis.
  - Instagram: Visual - oriented caption, use spacing, engaging hook, and 10 - 15 relevant hashtags at the bottom.
  - LinkedIn: Professional tone, industry insights, business value focus.Minimal emojis.
  - Threads: Short, punchy, Twitter - style conversation starter.
  - TikTok: A script or caption concept.Very short, trendy, use popular hashtags.
  - SEO Web: Title tag, Meta Description, and a short SEO - optimized paragraph(100 - 150 words) focusing on keywords.

    IMPORTANT: Return the response strictly as a valid JSON object where keys are the platform names(lower case: facebook, instagram, linkedin, threads, tiktok, seo).
  For most platforms, the value should be a simple string.
    However, for 'seo', the value MUST be an object with keys: "title_tag", "meta_description", and "paragraph".
  Do not wrap in markdown code blocks.`;

    const prompt = `Sample Content: "${sampleContent}"\n\nTarget Platforms: ${platforms.join(', ')} `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Content Gen Error:", error);
        return {};
    }
};

export const generateKeyVisual = async (
    params: {
        description: string;
        style: string;
        aspectRatio: string;
        numberOfImages: number;

        // New Fields
        concept?: string;
        mood?: string;
        referenceImage?: string;
        productAssets?: string[];
        placementInstructions?: string;

        mainHeading?: string;
        mainHeadingStyle?: string;
        mainHeadingEffect?: string;
        subHeading?: string;
        subHeadingEffect?: string;
        contentText?: string;
        contentTextEffect?: string;
        cta?: string;
        ctaEffect?: string;

        productImage?: string; // Base64 Main
        productNote?: string;
        refinement?: string; // If regenerating with changes
    }
): Promise<{ imageUrl: string; promptUsed: string }[]> => { // Return array

    // --- 1. Construct Prompt for Gemini 2.5 Flash Image ---
    let promptParts: any[] = [];

    // 1. Initial Context & Role
    let introPrompt = `You are an expert Senior Art Director and CGI Artist. 
    Your goal is to create a high - end, commercial Key Visual advertisement.
    
    ** CRITICAL INSTRUCTION - COMPOSITION:**
    You will be provided with a ** MAIN PRODUCT IMAGE **.You MUST feature the product from this image as the central hero object. 
    - DO NOT hallucinate a new product. 
    - DO NOT use the object from the Reference Style image.
    - YOU MUST composite the Main Product into a scene defined by the Style Reference.
    `;
    promptParts.push({ text: introPrompt });

    // 2. Reference Image (Style Only)
    if (params.referenceImage) {
        promptParts.push({ text: "**INPUT 1: STYLE REFERENCE IMAGE**\nUse this image ONLY for lighting, color palette, mood, and compositional structure. Do NOT copy the specific object or person in this image." });
        const base64Data = params.referenceImage.split(',')[1] || params.referenceImage;
        promptParts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/png'
            }
        });
    }

    // 3. Main Product Image (Hero Subject)
    if (params.productImage) {
        promptParts.push({ text: "**INPUT 2: MAIN PRODUCT IMAGE (HERO)**\nThis is the actual product being advertised. You MUST extract this object and place it prominently in the final design. Ensure the product looks realistic and retains its key identity features." });
        const base64Data = params.productImage.split(',')[1] || params.productImage;
        promptParts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/png'
            }
        });
    }

    // 4. Product Assets (Supplementary Elements)
    if (params.productAssets && params.productAssets.length > 0) {
        promptParts.push({ text: "**INPUT 3: VISUAL ASSETS**\nUse these additional elements (icons, decorations, secondary items) to enhance the background or surrounding composition. Do not make them the main focus." });
        for (const asset of params.productAssets) {
            const base64Data = asset.split(',')[1] || asset;
            promptParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png'
                }
            });
        }
    }

    // 5. Detailed Design Brief
    let brief = `
    ** DESIGN SPECIFICATIONS:**
    - ** Concept:** ${params.concept || 'N/A'}
    - ** Mood & Tone:** ${params.mood || 'N/A'}
    - ** Visual Style:** ${params.style}
    - ** Description:** ${params.description}
    - ** Aspect Ratio:** ${params.aspectRatio}
`;

    if (params.placementInstructions) {
        brief += `\n - ** Layout / Placement:** ${params.placementInstructions} `;
    }

    if (params.productNote) {
        brief += `\n - ** Product Handling:** ${params.productNote} (Apply these notes to the Main Product Image provided)`;
    }

    // --- Typography Section ---
    brief += `\n\n ** TYPOGRAPHY & TEXT:** `;

    if (params.mainHeading) {
        brief += `\n - ** Main Headline:** "${params.mainHeading}"`;
        brief += `\n - Font Style: ${params.mainHeadingStyle || 'Modern'} `;
        if (params.mainHeadingEffect) {
            brief += `\n - Text Effect: ${params.mainHeadingEffect} `;
        }
    }

    if (params.subHeading) {
        brief += `\n - ** Sub - Headline:** "${params.subHeading}"`;
        if (params.subHeadingEffect) {
            brief += ` (Effect / Style: ${params.subHeadingEffect})`;
        }
    }

    if (params.contentText) {
        brief += `\n - ** Body Copy / Content Text:** "${params.contentText}"(Small text)`;
        if (params.contentTextEffect) {
            brief += ` (Effect / Style: ${params.contentTextEffect})`;
        }
    }

    if (params.cta) {
        brief += `\n - ** Call To Action(CTA) Button:** "${params.cta}"`;
        if (params.ctaEffect) {
            brief += ` (Effect / Shape: ${params.ctaEffect})`;
        }
    }
    // --------------------------

    if (params.refinement) {
        brief += `\n\n ** REFINEMENT REQUEST:** ${params.refinement}. Modify the previous logic to satisfy this request while keeping the Main Product intact.`;
    }

    brief += `\n\n ** FINAL EXECUTION COMMAND:**
    Generate a photorealistic or stylized(based on style) final image. 
    The Main Product must be the clear focal point. 
    The Reference Image's aesthetic should surround the product. 
    Ensure text elements(Headline, CTA) are legible if rendered, or leave clear negative space for them.`;

    promptParts.push({ text: brief });

    const results: { imageUrl: string; promptUsed: string }[] = [];

    // --- 2. Attempt Generation with Gemini 2.5 Flash Image ---
    try {
        // Execute parallel requests to get multiple images if requested.
        const requests = [];
        for (let i = 0; i < params.numberOfImages; i++) {
            requests.push(ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: promptParts },
                config: {
                    imageConfig: {
                        aspectRatio: params.aspectRatio as any,
                    },
                    // CRITICAL: Set safety settings to BLOCK_NONE for local development
                    safetySettings: SAFETY_SETTINGS,
                }
            }));
        }

        const responses = await Promise.all(requests);

        for (const response of responses) {
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        results.push({
                            imageUrl: `data: image / png; base64, ${part.inlineData.data} `,
                            promptUsed: brief
                        });
                    }
                }
            }
        }

        return results;

    } catch (error: any) {
        console.error("Gemini 2.5 Flash Image failed.", error);
        return [];
    }
};

export const generateStoryboardFrame = async (
    script: string,
    style: string
): Promise<string | null> => {
    // Prompt specifically designed for storyboard consistency
    const prompt = `Cinematic storyboard frame.Style: ${style}. Script description: "${script}". 
    High quality, detailed, 16: 9 aspect ratio, visual storytelling, concept art.`;

    // Use Gemini 2.5 Flash Image directly
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
                imageConfig: { aspectRatio: '16:9' },
                safetySettings: SAFETY_SETTINGS
            }
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        // Check all parts for image data, just in case text comes first
        if (response.candidates?.[0]?.content?.parts) {
            for (const p of response.candidates[0].content.parts) {
                if (p.inlineData && p.inlineData.data) {
                    return `data: image / png; base64, ${p.inlineData.data} `;
                }
            }
        }
    } catch (e) {
        console.error("Gemini 2.5 Flash Image failed for storyboard.", e);
    }

    return null;
}

// --- MINDMAP GENERATOR ---
export interface MindmapData {
    nodes: { id: string; label: string; type: 'root' | 'branch' | 'leaf' }[];
    edges: { id: string; source: string; target: string }[];
}

export const generateMindmapData = async (keyword: string): Promise<MindmapData> => {
    const systemPrompt = `You are a creative brainstorming expert.
    Your task is to create a structured Mindmap for the keyword provided by the user.
    
    Structure Requirements:
1. ** Root Node:** The central keyword.
    2. ** Branches(Pillars):** Generate exactly 4 main conceptual pillars related to the keyword.
    3. ** Leaves(Sub - ideas):** For each pillar, generate exactly 3 specific, actionable sub - ideas.

    Output Format(JSON ONLY):
    Return a single JSON object with two arrays: "nodes" and "edges".
    - ** nodes **: Array of objects { "id": string, "label": string, "type": "root" | "branch" | "leaf" }.
    - ** edges **: Array of objects { "id": string, "source": string, "target": string }.

    IDs should be unique(e.g., "root", "b1", "b2", "b1-l1", etc.).
    Do not include layout positions(x, y), just the structure.
    Do not wrap in markdown code blocks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Keyword: "${keyword}"`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Mindmap Gen Error:", error);
        return { nodes: [], edges: [] };
    }
};

export interface DeepDiveResult {
    angles: string[];
    headlines: string[];
    keywords: string[];
}

export const brainstormNodeDetails = async (nodeLabel: string): Promise<DeepDiveResult> => {
    const systemPrompt = `You are a content strategist. 
    The user wants to deep dive into a specific topic idea: "${nodeLabel}".

    Provide:
1. 5 unique Content Angles(different perspectives to approach this topic).
    2. 3 catchy Headlines / Titles for articles or posts.
    3. 5 related Keywords or Tags.

    Output JSON format ONLY:
{
    "angles": ["angle 1", "angle 2", ...],
        "headlines": ["title 1", ...],
            "keywords": ["kw1", ...]
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Deep dive topic: "${nodeLabel}"`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Deep dive error:", error);
        return { angles: [], headlines: [], keywords: [] };
    }
};

// --- SCAMPER TOOL ---

export const generateScamperIdeas = async (topic: string, context: string, method?: string): Promise<Record<string, string[]>> => {
    const systemPrompt = `You are a creative innovation expert using the SCAMPER technique.

    Analyze the user's topic/product and generate actionable, creative ideas for each SCAMPER category:
        - Substitute: Replace parts / materials / rules ?
            - Combine : Combine with other products / purposes ?
                - Adapt : What else is like this ? Copy ideas ?
                    - Modify : Change shape, form, size ?
                        - Put to another use: New ways to use it ?
                            - Eliminate : Remove non - essentials ?
                                - Reverse / Rearrange : Change order or layout ?

                                    ${method ? `FOCUS ONLY ON: ${method}` : 'Generate ideas for ALL 7 categories.'}
    
    Context provided: ${context}

    ** CRITICAL:** All output MUST be in ** VIETNAMESE ** language.

    OUTPUT FORMAT(JSON):
{
    "substitute": ["ý tưởng 1", "ý tưởng 2", ...],
        "combine": ["ý tưởng 1", ...],
            "adapt": [...],
                "modify": [...],
                    "putToAnotherUse": [...],
                        "eliminate": [...],
                            "reverse": [...]
}
    
    Provide 3 - 4 concrete, actionable ideas per category. 
    Do NOT explain the theory, just give the ideas.
    Response must be valid JSON.No markdown wrapping.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Topic: "${topic}"`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("SCAMPER Gen Error:", error);
        return {};
    }
};

// --- STRATEGIC MODEL GENERATOR ---
export interface StrategicModelData {
    model_type: string;
    data: Record<string, string[] | string>;
    summary: string;
}

export const generateStrategicModel = async (productInfo: string, modelType: string, context?: string): Promise<StrategicModelData> => {
    const systemPrompt = `You are a senior marketing strategist. 
    Your task is to generate a ${modelType} analysis for the user's product/service.
    
    Context: ${context || 'No specific context'}
Product / Service: ${productInfo}
    
    ** CRITICAL:** Output MUST be valid JSON.All content MUST be in ** VIETNAMESE **.

    ** MODEL STRUCTURES:**

    1. ** SWOT **:
- data keys: "strengths"(array), "weaknesses"(array), "opportunities"(array), "threats"(array).
    
    2. ** AIDA **:
- data keys: "attention"(string / array), "interest"(string / array), "desire"(string / array), "action"(string / array).
    
    3. ** 4P ** (Marketing Mix):
- data keys: "product"(array), "price"(array), "place"(array), "promotion"(array).

    4. ** 5W1H **:
- data keys: "who", "what", "where", "when", "why", "how". (All arrays of strings).

    5. ** SMART **:
- data keys: "specific", "measurable", "achievable", "relevant", "time_bound". (All strings describing the goal).

    ** OUTPUT FORMAT:**
    {
        "model_type": "${modelType}",
        "data": { ...specific keys based on model ... },
        "summary": "A short strategic summary in Vietnamese."
    }
        `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate ${modelType} model`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Strategic Model Gen Error:", error);
        return { model_type: modelType, data: {}, summary: "Lỗi khi tạo mô hình." };
    }
};

export const generateAllStrategicModels = async (productInfo: string, context?: string): Promise<Record<string, StrategicModelData>> => {
    const systemPrompt = `You are a senior marketing strategist. 
    The user wants a COMPLETE strategic analysis covering 5 models: SWOT, AIDA, 4P, 5W1H, and SMART Goals.

    Context: ${context || 'No specific context'}
Product / Service: ${productInfo}
    
    ** CRITICAL:** Output MUST be valid JSON.All content MUST be in ** VIETNAMESE **.

    ** OUTPUT FORMAT:**
    {
        "SWOT": {
            "model_type": "SWOT",
            "data": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
            "summary": "..."
        },
        "AIDA": {
            "model_type": "AIDA",
            "data": { "attention": "...", "interest": "...", "desire": "...", "action": "..." },
            "summary": "..."
        },
        "4P": {
            "model_type": "4P",
            "data": { "product": [], "price": [], "place": [], "promotion": [] },
            "summary": "..."
        },
        "5W1H": {
            "model_type": "5W1H",
            "data": { "who": [], "what": [], "where": [], "when": [], "why": [], "how": [] },
            "summary": "..."
        },
        "SMART": {
            "model_type": "SMART",
            "data": { "specific": "...", "measurable": "...", "achievable": "...", "relevant": "...", "time_bound": "..." },
            "summary": "..."
        }
    }
        `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate ALL models`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("All Strategic Models Gen Error:", error);
        return {};
    }
};

// --- SMART CONTENT CALENDAR ---
export const suggestPillarsFromStrategy = async (strategy: string, context: string): Promise<ContentPillar[]> => {
    const systemPrompt = `You are a content strategist.
    Based on the user's "Overall Content Strategy", suggest 4 distinct Content Pillars (Topics).

Strategy: "${strategy}"
Context: ${context}
    
    ** CRITICAL:** Output MUST be valid JSON.Content in ** VIETNAMESE **.
    
    ** OUTPUT FORMAT(JSON Array):**
    [
        { "name": "Topic 1", "weight": 40, "color": "#3b82f6" },
        { "name": "Topic 2", "weight": 20, "color": "#ef4444" },
        { "name": "Topic 3", "weight": 20, "color": "#eab308" },
        { "name": "Topic 4", "weight": 20, "color": "#22c55e" }
    ]
        (Ensure weights sum to 100. Use hex colors provided in example as base, vary if needed.)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest Pillars`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "[]";
        return JSON.parse(text);
    } catch (error) {
        console.error("Pillar Suggestion Error:", error);
        return [];
    }
};

export const generateContentCalendar = async (
    brandContext: string,
    personaContext: string,
    pillars: ContentPillar[],
    angles: string[],
    month: string,
    year: number,
    isShuffle: boolean = false,
    overallStrategy: string = ""
): Promise<any[]> => {
    // ... (Keep existing implementation)
    return [];
};

// --- MASTERMIND STRATEGY ---

export const generateMastermindStrategy = async (
    brandInfo: string,
    audienceInfo: string,
    objective: string,
    perception: string,
    tone: string
): Promise<any> => {
    const systemPrompt = `Role: World - class Chief Marketing Officer(CMO).

    Task: Create a Holistic Content Strategy based on the "Human Connection" model.
    
    ** INPUTS:**
    - Brand: ${brandInfo}
- Audience: ${audienceInfo}
- Objective: ${objective}
- Desired Perception: ${perception}
- Tone / Style: ${tone}

    ** REQUIRED OUTPUT STRUCTURE(JSON ONLY):**
    {
        "insight": "The intersection of Brand Truth and Audience Pain Point.",
        "coreMessage": "One powerful sentence summarizing the campaign.",
        "keyMessages": ["Message 1", "Message 2", "Message 3"],
        "contentAngles": {
            "text": ["Slogan ideas", "Headline ideas"],
            "visual": ["Moodboard description", "Color palette suggestion"],
            "story": ["Brand story angle", "Customer success story angle"],
            "data": ["Key statistic to prove authority"],
            "action": ["Activation campaign idea", "Minigame idea"]
        },
        "channelStrategy": {
            "Facebook": 40,
            "TikTok": 30,
            "Website": 20,
            "Email": 10
        }
    }

    ** CRITICAL:** All content must be in ** VIETNAMESE **.
    Return ONLY valid JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate Mastermind Strategy`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.7
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Mastermind Gen Error:", error);
        return null;
    }
};

// --- AUTO BRIEF GENERATOR ---
import { BriefData } from "../types";

export interface AutoBriefInput {
    productBrand: string;
    industry: string;
    goal: string;
    targetAudience: string;
    usp?: string;
    budget?: string;
    duration?: string;
}

export const generateAutoBrief = async (
    input: AutoBriefInput,
    onProgress?: (step: string) => void
): Promise<BriefData | null> => {
    // Senior Strategic Planner - Enhanced System Prompt
    const systemPrompt = `### ROLE & OBJECTIVE
Bạn là một Senior Strategic Planner (Chuyên gia Hoạch định Chiến lược) với 10 năm kinh nghiệm tại các Agency quảng cáo hàng đầu (Ogilvy, Dentsu). Nhiệm vụ của bạn là lập một bản kế hoạch Marketing tổng thể (Auto Brief) chi tiết, khả thi và sáng tạo.

### CLIENT INPUT
- Product/Brand: ${input.productBrand}
- Industry: ${input.industry}
- Campaign Goal: ${input.goal}
- Target Audience: ${input.targetAudience}
${input.usp ? `- USP (Điểm khác biệt): ${input.usp}` : ''}
${input.budget ? `- Budget/Scale: ${input.budget}` : ''}
${input.duration ? `- Duration: ${input.duration}` : ''}

### THINKING PROCESS (MANDATORY - Execute before output)
Trước khi đưa ra kết quả, hãy tư duy theo luồng sau:

**1. Phân tích bối cảnh (Context Analysis):**
- Với ngành hàng ${input.industry}${input.budget ? ` và ngân sách ${input.budget}` : ''}, đối thủ đang làm gì?
- Đâu là cơ hội (gap) cho thương hiệu này?
- Trend hiện tại trong ngành là gì?

**2. Phân rã mục tiêu (Goal Breakdown):**
Từ mục tiêu tổng quát "${input.goal}", hãy tách nhỏ thành:
- Business Goal: Doanh số/Thị phần cụ thể với con số
- Marketing Goal: Traffic/Leads/Engagement với metrics rõ ràng
- Communication Goal: Nhận diện/Yêu thích thương hiệu (Brand Love, Top of Mind)

**3. Thấu hiểu khách hàng (Deep Insight):**
Dựa trên "${input.targetAudience}", hãy tìm ra:
- Demographic: Nhân khẩu học cơ bản
- Psychographic: Sở thích, hành vi, lối sống
- **Core Insight**: Sự thật ngầm hiểu sâu sắc (nỗi đau hoặc khát khao thầm kín) - KHÔNG phải chỉ là đặc điểm nhân khẩu học

**4. Chiến lược tiếp cận (Strategic Approach):**
${input.usp ? `- USP "${input.usp}" sẽ giải quyết Insight đó như thế nào?` : '- Tìm ra điểm khác biệt từ thông tin đã cho'}
- Big Idea xuyên suốt là gì?
- Key Hook để thu hút sự chú ý ngay lập tức?

### BUDGET-AWARE CHANNEL STRATEGY
${input.budget ? `
Với ngân sách ${input.budget}, hãy đề xuất kênh phù hợp:
- < 10M: Focus on Organic/Social/Viral (TikTok, Facebook Groups, UGC)
- 10-50M: Mix of Organic + Paid Social (Facebook Ads, TikTok Ads, Influencer Micro)
- 50-100M: Full Paid Media + KOLs (Google Ads, Meta Ads, Macro Influencer)
- > 100M: Integrated campaign (TV, OOH, Digital, Celebrity)
` : 'Đề xuất kênh phù hợp với ngành hàng và mục tiêu.'}

### INDUSTRY-SPECIFIC CHANNELS
Ưu tiên kênh theo ngành:
- Fashion/Beauty → TikTok, Instagram, Pinterest
- F&B → Facebook, Local SEO, Delivery Apps (Grab, Shopee Food)
- B2B/SaaS → LinkedIn, Email Marketing, Webinars
- Health/Wellness → YouTube, Blog SEO, Community Groups
- E-commerce → Paid Ads, Retargeting, Email Automation

### OUTPUT FORMAT (STRICT JSON)
{
  "project_name": "Tên Campaign sáng tạo, ngắn gọn, bắt tai (tiếng Việt)",
  "context_analysis": "Phân tích bối cảnh thị trường, đối thủ và cơ hội cạnh tranh (2-3 câu)",
  "objectives": {
    "business": "Mục tiêu kinh doanh cụ thể với con số (VD: Tăng doanh số 30% trong Q1)",
    "marketing": "Các chỉ số về tiếp thị (VD: 500K reach, 50K engagement, 10K leads)",
    "communication": "Mục tiêu về định vị thương hiệu (VD: Top 3 thương hiệu được nhắc đến nhiều nhất)"
  },
  "target_persona": {
    "demographic": "Nhân khẩu học: Tuổi, giới tính, thu nhập, vị trí",
    "psychographic": "Sở thích, hành vi, lối sống cụ thể",
    "insight": "Core Insight - Nỗi đau hoặc khát khao thầm kín (bắt đầu bằng 'Họ...')"
  },
  "strategy": {
    "core_message": "Thông điệp chính (Big Idea) - 1 câu mạnh mẽ",
    "key_hook": "Câu dẫn/Góc tiếp cận thu hút sự chú ý ngay lập tức",
    "tone_mood": "Tính cách và giọng văn của thương hiệu trong chiến dịch"
  },
  "execution_plan": [
    {
      "phase": "Phase 1: Teasing (Tuần 1-2)",
      "activity": "Hoạt động cụ thể để gây tò mò, thu hút sự chú ý",
      "channel": "Kênh triển khai cụ thể (phù hợp với budget)"
    },
    {
      "phase": "Phase 2: Launching (Tuần 3-4)",
      "activity": "Hoạt động chính, đẩy mạnh thông điệp và bán hàng",
      "channel": "Kênh triển khai cụ thể (phù hợp với budget)"
    },
    {
      "phase": "Phase 3: Sustain (Tuần 5+)",
      "activity": "Duy trì tương tác và giữ chân khách hàng",
      "channel": "Kênh triển khai cụ thể (phù hợp với budget)"
    }
  ],
  "kpis_deliverables": {
    "success_metrics": "Các chỉ số đo lường thành công chính (VD: CTR > 2%, Conversion > 5%, ROAS > 3)",
    "estimated_reach": "Ước tính lượt tiếp cận dựa trên ngân sách và ngành hàng"
  }
}

### QUALITY CONTROL
- Nội dung phải mang tính chiến lược, KHÔNG chung chung
- Campaign Name phải thực sự sáng tạo và "bắt trend"
- Core Insight phải là sự thật ngầm hiểu, không phải mô tả demographic
- Key Hook phải độc đáo, không sao chép công thức cũ
- Execution Plan phải actionable với activities cụ thể
- Kênh phải phù hợp với budget và industry
- Output PHẢI là JSON valid, không có markdown`;

    try {
        // Enhanced progress indicators
        if (onProgress) {
            onProgress('🔍 Đang phân tích bối cảnh thị trường...');
            await new Promise(r => setTimeout(r, 1000));
            onProgress('🎯 Đang phân rã mục tiêu SMART...');
            await new Promise(r => setTimeout(r, 1000));
            onProgress('🧠 Đang trích xuất Deep Insight...');
            await new Promise(r => setTimeout(r, 1000));
            onProgress('💡 Đang xây dựng Big Idea...');
            await new Promise(r => setTimeout(r, 1000));
            onProgress('📢 Đang chọn kênh phù hợp với budget...');
            await new Promise(r => setTimeout(r, 1000));
            onProgress('📋 Đang tạo kế hoạch 3 giai đoạn...');
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: `Generate comprehensive marketing brief with strategic thinking`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.85
            },
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as BriefData;
    } catch (error) {
        console.error("Auto Brief Gen Error:", error);
        return null;
    }
};

// --- SOP BUILDER ---
import { SOPData } from "../types";

export interface SOPInput {
    processName: string;
    primaryRole: string;
    frequency: string;
    goalOutput?: string;
    scope?: string;
}

export const generateSOP = async (
    input: SOPInput,
    onProgress?: (step: string) => void
): Promise<SOPData | null> => {
    const systemPrompt = `### ROLE & OBJECTIVE
Bạn là một Giám đốc Vận hành (Operations Director) và Chuyên gia Tối ưu hóa Quy trình (Process Optimization Expert) với 15 năm kinh nghiệm xây dựng SOP cho các tập đoàn đa quốc gia. Nhiệm vụ của bạn là chuyển đổi yêu cầu công việc thành một Quy trình Vận hành Tiêu chuẩn (SOP) chi tiết, logic, dễ hiểu và có tính ứng dụng cao.

### INPUT DATA
- Process Name: ${input.processName}
- Main Role: ${input.primaryRole}
- Frequency: ${input.frequency}
${input.goalOutput ? `- Goal/Output: ${input.goalOutput}` : ''}
${input.scope ? `- Scope: ${input.scope}` : ''}

### LOGIC & REASONING (CHAIN OF THOUGHT)
Trước khi tạo nội dung, hãy phân tích logic sau:

**1. Xử lý mâu thuẫn tần suất:**
- Nếu "${input.processName}" mang tính dự án dài hạn (VD: Campaign, Product Launch) nhưng "${input.frequency}" là "Hàng ngày", hãy ưu tiên cấu trúc theo Giai đoạn dự án (Phase) nhưng chia nhỏ task thành các việc cần check mỗi ngày.
- Nếu "${input.frequency}" là "Hàng ngày", SOP phải ngắn gọn, dạng Checklist nhanh.
- Nếu "${input.frequency}" là "Dự án/Một lần", SOP phải chi tiết, chia giai đoạn rõ ràng.

**2. Phân bổ vai trò:**
- Dựa vào "${input.primaryRole}", hãy đặt role này làm trọng tâm.
- Nếu quy trình cần phối hợp, hãy chỉ định thêm các role hỗ trợ (Support Roles) hợp lý.
- "${input.primaryRole}" vẫn phải chịu trách nhiệm chính ở các khâu quan trọng nhất.

**3. Lựa chọn công cụ:**
- Đề xuất bộ công cụ (Tools) phù hợp với tính chất công việc hiện đại:
  - Design: Figma, Canva, Adobe Creative Suite
  - Project Management: Jira, Trello, Asana, Monday.com
  - Communication: Slack, Teams, Email
  - Analytics: Google Analytics, Mixpanel, Tableau
  - Marketing: Meta Business Suite, Google Ads, Mailchimp

### STRUCTURE FRAMEWORK
**3 Giai đoạn bắt buộc:**
1. **Preparation (Chuẩn bị)**: Setup, Planning, Resource gathering
2. **Execution (Thực hiện)**: Main activities, Core tasks
3. **Review (Đánh giá)**: Quality check, Reporting, Optimization

### OUTPUT FORMAT (STRICT JSON)
{
  "sop_title": "Quy trình Chuẩn hóa: ${input.processName}",
  "estimated_time": "Thời gian ước tính dựa trên tính chất công việc (VD: 2 giờ, 1 tuần, 3 tháng)",
  "phases": [
    {
      "phase_name": "Phase 1: Preparation (Chuẩn bị)",
      "steps": [
        {
          "id": 1,
          "action": "Tên đầu việc cụ thể, bắt đầu bằng động từ hành động",
          "role": "${input.primaryRole} hoặc role phù hợp",
          "tools": ["Tool 1", "Tool 2"],
          "critical_note": "Hướng dẫn chi tiết CỤ THỂ (VD: 'File xuất ra phải ở định dạng .PNG và nén dưới 1MB', 'Kiểm tra kỹ chính tả, màu sắc theo brand guideline')",
          "completed": false
        }
      ],
      "collapsed": false
    },
    {
      "phase_name": "Phase 2: Execution (Thực hiện)",
      "steps": [
        {
          "id": 2,
          "action": "Tên đầu việc cụ thể",
          "role": "${input.primaryRole}",
          "tools": ["Tool"],
          "critical_note": "Hướng dẫn chi tiết CỤ THỂ",
          "completed": false
        }
      ],
      "collapsed": false
    },
    {
      "phase_name": "Phase 3: Review (Đánh giá)",
      "steps": [
        {
          "id": 3,
          "action": "Tên đầu việc cụ thể",
          "role": "${input.primaryRole}",
          "tools": ["Tool"],
          "critical_note": "Hướng dẫn chi tiết CỤ THỂ",
          "completed": false
        }
      ],
      "collapsed": false
    }
  ]
}

### QUALITY CONTROL RULES
- **Critical Note là quan trọng nhất**: Đừng viết chung chung như "Làm tốt nhé". Hãy viết như một chỉ dẫn kỹ thuật cụ thể.
- Mỗi phase phải có ít nhất 2-3 steps.
- Action phải bắt đầu bằng động từ hành động (Tạo, Kiểm tra, Phê duyệt, Xuất bản...).
- Tools phải là tên công cụ cụ thể, không viết "Công cụ thiết kế" mà phải "Figma" hoặc "Canva".
- Ngôn ngữ: Tiếng Việt chuyên nghiệp, gãy gọn, dùng thuật ngữ chuyên ngành đúng chỗ.
- Output PHẢI là JSON valid, không có markdown.`;

    try {
        if (onProgress) {
            onProgress('🔍 Đang phân tích tính chất quy trình...');
            await new Promise(r => setTimeout(r, 800));
            onProgress('🎯 Đang xác định giai đoạn chính...');
            await new Promise(r => setTimeout(r, 800));
            onProgress('👥 Đang phân bổ vai trò...');
            await new Promise(r => setTimeout(r, 800));
            onProgress('🛠️ Đang chọn công cụ phù hợp...');
            await new Promise(r => setTimeout(r, 800));
            onProgress('📋 Đang tạo checklist chi tiết...');
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: `Generate comprehensive SOP with operations framework`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.7
            },
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonStr) as SOPData;

        // Ensure all steps have completed: false
        if (data.phases) {
            data.phases = data.phases.map(phase => ({
                ...phase,
                collapsed: false,
                steps: phase.steps.map(step => ({
                    ...step,
                    completed: false
                }))
            }));
        }

        return data;
    } catch (error) {
        console.error("SOP Gen Error:", error);
        return null;
    }
};

// --- HOOK GENERATOR (The Hook Matrix) ---
import { HookGeneratorResult } from '../types';

export interface HookInput {
    topic: string;
    targetAudience: string;
    usp?: string;
    platform?: string;
}

export const generateHooks = async (
    input: HookInput,
    onProgress?: (step: string) => void
): Promise<HookGeneratorResult | null> => {
    const systemPrompt = `### ROLE & OBJECTIVE
Bạn là một chuyên gia Copywriting hàng đầu và bậc thầy về Tâm lý học hành vi (Behavioral Psychology). Nhiệm vụ của bạn là tạo ra các "Hook" (Lời dẫn/Mở đầu) có khả năng thu hút sự chú ý ngay lập tức dựa trên mô hình "The Hook Matrix".

### THE HOOK MATRIX - 3 CORE PSYCHOLOGICAL TRIGGERS

**1. NEGATIVE WARNING (Cảnh báo tiêu cực)**
- Tâm lý: Đánh vào nỗi sợ mắc sai lầm hoặc hậu quả nếu không sử dụng đúng cách/đúng sản phẩm
- Công thức: "Dừng ngay nếu..." / "Đừng bao giờ..." / "Sai lầm nghiêm trọng khi..."
- Kích hoạt: Fear of Loss, Regret Aversion

**2. SECRET REVEAL (Tiết lộ bí mật)**
- Tâm lý: Đánh vào sự tò mò, hứa hẹn một giải pháp mới lạ hoặc ít người biết
- Công thức: "Bí mật mà..." / "Điều không ai nói với bạn về..." / "Cách ít người biết để..."
- Kích hoạt: Curiosity Gap, Exclusivity

**3. TRANSFORMATION (Sự lột xác)**
- Tâm lý: Nhấn mạnh vào kết quả trước/sau (Before/After) để thấy rõ hiệu quả
- Công thức: "Từ X đến Y trong Z ngày" / "Làm thế nào tôi..." / "Kết quả sau khi..."
- Kích hoạt: Social Proof, Aspiration

### INSTRUCTIONS

**BƯỚC 1: INSIGHT ANALYSIS (Phân tích sâu)**
Dựa trên Topic, Target Audience và USP (nếu có), hãy phân tích:
1. **Pain Point (Nỗi đau thầm kín)**: Vấn đề cụ thể, gây khó chịu nhất mà khách hàng đang gặp phải
2. **Desire (Khao khát tột cùng)**: Trạng thái lý tưởng mà họ muốn đạt được sau khi giải quyết nỗi đau đó

**BƯỚC 2: HOOK GENERATION**
Tạo 3 hooks cho mỗi loại (Negative Warning, Secret Reveal, Transformation) cho từng platform:

**📱 VIDEO (TikTok/Reels/Shorts):**
- Hook Text: < 10 từ, gây shock/tò mò ngay giây đầu tiên
- Visual Cue: Mô tả chi tiết cảnh quay/hành động cụ thể trong 3 giây đầu (VD: "Cận cảnh texture kem tan trên da", "Biểu cảm nhăn mặt khi...")
- Psychology Trigger: Chọn từ danh sách triggers

**🌐 LANDING PAGE:**
- Headline: Kết quả cụ thể + Thời gian + Cam kết (< 15 từ)
- Sub-headline: Xử lý từ chối (objection handling), giải thích thêm
- Psychology Trigger

**📧 EMAIL:**
- Subject Line: < 50 ký tự, tạo FOMO hoặc Exclusive
- Preview Text: Gợi mở thêm, tạo curiosity gap
- Psychology Trigger

**📲 SOCIAL POST:**
- Hook Text: Câu mở đầu gây chú ý, có thể phủ định niềm tin phổ biến
- Hashtag Suggestion: 3-5 hashtags relevant
- Psychology Trigger

### PSYCHOLOGY TRIGGERS (Chọn 1 cho mỗi hook)
- Fear of Loss (Sợ mất mát)
- Risk Reversal (Đảo ngược rủi ro)
- Curiosity Gap (Khoảng trống tò mò)
- Contrarian (Đi ngược xu hướng)
- Social Proof (Bằng chứng xã hội)
- Urgency (Tính cấp bách)
- Exclusivity (Độc quyền)
- Authority (Uy tín chuyên gia)

### OUTPUT FORMAT (STRICT JSON)
{
  "analysis": {
    "identified_pain_point": "Mô tả nỗi đau cụ thể...",
    "identified_desire": "Mô tả khao khát cụ thể..."
  },
  "hooks": {
    "video_shorts": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "hook_text": "Câu hook ngắn gọn < 10 từ",
        "visual_cue": "Mô tả chi tiết cảnh quay/hành động trong 3 giây đầu",
        "psychology_trigger": "Tên trigger"
      }
    ],
    "landing_page": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "headline": "Tiêu đề chính",
        "sub_headline": "Tiêu đề phụ giải thích thêm",
        "psychology_trigger": "Tên trigger"
      }
    ],
    "email": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "subject_line": "Tiêu đề email < 50 chars",
        "preview_text": "Preview text gợi mở",
        "psychology_trigger": "Tên trigger"
      }
    ],
    "social_post": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "hook_text": "Câu mở đầu post",
        "hashtag_suggestion": "#hashtag1 #hashtag2 #hashtag3",
        "psychology_trigger": "Tên trigger"
      }
    ]
  }
}

### IMPORTANT NOTES
- Visual Cue phải mô tả hành động cụ thể, dễ hình dung (ví dụ: "Cận cảnh texture kem tan trên da", "Biểu cảm nhăn mặt khi...")
- Headline phải lồng ghép khéo léo USP (nếu có) vào giải pháp hoặc vấn đề
- Ngôn ngữ: Tiếng Việt tự nhiên, bắt trend nếu phù hợp với nhóm khách hàng trẻ
- Tạo 3 hooks cho mỗi loại (Negative Warning, Secret Reveal, Transformation) cho mỗi platform
- Output PHẢI là JSON valid, không có markdown`;

    try {
        onProgress?.('Phân tích Pain Point & Desire...');

        const userPrompt = `TOPIC / SẢN PHẨM: ${input.topic}
TARGET AUDIENCE: ${input.targetAudience}
${input.usp ? `USP / FEATURES: ${input.usp}` : ''}
${input.platform ? `PLATFORM: ${input.platform}` : ''}

Hãy áp dụng The Hook Matrix để tạo hooks theo 3 loại chính:
1. Negative Warning (Cảnh báo tiêu cực)
2. Secret Reveal (Tiết lộ bí mật)
3. Transformation (Sự lột xác)

Nhớ:
1. Phân tích Pain Point & Desire trước
2. Tạo 3 hooks cho mỗi loại cho mỗi platform
3. Video hooks PHẢI có visual_cue chi tiết (mô tả hành động cụ thể trong 3 giây đầu)
4. Mỗi hook phải có psychology_trigger`;

        onProgress?.('Áp dụng The Hook Matrix...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.85,
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: 'application/json'
            },
        });

        onProgress?.('Đang tạo hooks...');

        const text = response.text?.trim();
        if (!text) return null;

        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as HookGeneratorResult;

        return result;
    } catch (error) {
        console.error('Hook Generator Error:', error);
        return null;
    }
};

// --- CUSTOMER JOURNEY MAPPER ---
import { JourneyStage } from '../types';

export interface JourneyMapperInput {
    productBrand: string;
    targetAudience: string;
    conversionGoal: string;
    channels: string;
}

export const generateCustomerJourney = async (
    input: JourneyMapperInput,
    onProgress?: (step: string) => void
): Promise<JourneyStage[] | null> => {
    const systemPrompt = `Bạn là Senior Marketing Strategist với 15 + năm kinh nghiệm về Customer Journey Mapping.
Nhiệm vụ: Tạo bản đồ hành trình khách hàng 4 giai đoạn(Awareness → Consideration → Conversion → Loyalty).

=== CONTEXTUAL TOUCHPOINTS(Điểm chạm theo ngữ cảnh) ===
    Tự động phát hiện ngành hàng và điều chỉnh touchpoints phù hợp:
• B2B Software → LinkedIn, Whitepaper, Email Demo, Webinar, Case Study
• B2C Fashion → TikTok, Instagram Ads, Shopee, Influencer Review, Flash Sale
• F & B → Facebook Local, Grab / ShopeeFood, UGC Review, Location - based Ads
• Education → Facebook Groups, Webinar Free, Blog SEO, Email Nurture
• Beauty → TikTok Review, KOL, Shopee Live, Before / After Content

    === EMOTIONAL MAPPING(Biểu đồ cảm xúc) ===
        Tại mỗi giai đoạn, xác định cảm xúc chủ đạo:
1. Awareness: Confused / Frustrated → Curious(Bối rối → Tò mò)
2. Consideration: Analytical / Cautious → Comparing(Phân tích → So sánh)
3. Conversion: Anxious / Excited → Ready to buy(Hồi hộp → Sẵn sàng mua)
4. Loyalty: Satisfied / Proud → Advocate(Hài lòng → Muốn giới thiệu)

    === NUDGE LOGIC(Cú hích chuyển đổi) ===
        Key Message PHẢI:
- Trả lời trực tiếp Pain Point tại giai đoạn đó
    - Đẩy khách hàng sang bước tiếp theo
        - KHÔNG viết chung chung, phải cụ thể cho sản phẩm

            === OUTPUT FORMAT(STRICT JSON ARRAY) ===
                [
                    {
                        "stage": "1. Awareness (Nhận biết)",
                        "customer_mindset": "Tôi đang gặp vấn đề X nhưng chưa biết giải pháp nào.",
                        "emotional_state": "Confused / Frustrated (Bối rối)",
                        "touchpoints": ["Viral Video TikTok", "PR Article", "Google Search"],
                        "key_message": "Câu trả lời cho pain point cụ thể...",
                        "content_ideas": ["Video '5 dấu hiệu...'", "Bài viết 'Tại sao...'"]
                    },
                    {
                        "stage": "2. Consideration (Cân nhắc)",
                        "customer_mindset": "Tôi biết vài giải pháp, cái nào tốt nhất?",
                        "emotional_state": "Analytical / Cautious (Phân tích/Thận trọng)",
                        "touchpoints": ["Review Group", "Comparison Table", "Webinar"],
                        "key_message": "[Sản phẩm] vượt trội ở tính năng A và mức giá B.",
                        "content_ideas": ["Video so sánh", "Testimonial"]
                    },
                    {
                        "stage": "3. Conversion (Chuyển đổi)",
                        "customer_mindset": "Tôi thích rồi, nhưng sợ mua hớ.",
                        "emotional_state": "Anxious / Excited (Hồi hộp/Hào hứng)",
                        "touchpoints": ["Landing Page", "Remarketing Ads", "Livechat"],
                        "key_message": "Mua ngay với ưu đãi X. Cam kết hoàn tiền.",
                        "content_ideas": ["Flash Sale", "Case Study thành công"]
                    },
                    {
                        "stage": "4. Loyalty (Trung thành)",
                        "customer_mindset": "Sản phẩm tốt. Có nên giới thiệu bạn bè?",
                        "emotional_state": "Satisfied / Proud (Hài lòng/Tự hào)",
                        "touchpoints": ["Email CSKH", "Community", "Referral Program"],
                        "key_message": "Cảm ơn bạn. Quà tặng VIP đang chờ.",
                        "content_ideas": ["Referral rewards", "Advanced tips"]
                    }
                ]

Output PHẢI là JSON array valid, không có markdown.`;

    try {
        onProgress?.('Phân tích ngành hàng...');

        const userPrompt = `SẢN PHẨM / THƯƠNG HIỆU: ${input.productBrand}
TARGET AUDIENCE: ${input.targetAudience}

Hãy tạo Customer Journey Map 4 giai đoạn cho sản phẩm trên.Nhớ:
1. Phát hiện ngành hàng và chọn touchpoints phù hợp
2. Xác định emotional state cho từng giai đoạn
3. Key message phải đánh trúng pain point
4. Content ideas phải actionable và cụ thể`;

        onProgress?.('Xây dựng hành trình...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Hoàn thiện bản đồ...');

        const text = response.text?.trim() || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return null;

        const data: JourneyStage[] = JSON.parse(jsonMatch[0]);
        return data;
    } catch (error) {
        console.error("Journey Map Error:", error);
        return null;
    }
};

// --- BUDGET ALLOCATOR ---
import { BudgetAllocationResult, BudgetAllocatorInput } from '../types';

export const generateBudgetAllocation = async (
    input: BudgetAllocatorInput,
    onProgress?: (step: string) => void
): Promise<BudgetAllocationResult | null> => {
    const systemPrompt = `Bạn là Senior Media Planner với 15 + năm kinh nghiệm hoạch định truyền thông.

=== MA TRẬN ƯU TIÊN(PRIORITY MATRIX) ===

** QUY TẮC 1: Dựa trên KPI **
    - KPI = "sales"(Ra số / Conversion):
  • Google Ads(40 %): High Intent - Khách đã tìm kiếm = sẵn sàng mua
  • Meta Ads(30 %): Retargeting + Lookalike mở rộng
  • TikTok Shop(20 %): Impulse buying, thanh toán nhanh
  • CRM / Email(10 %): Chăm sóc khách cũ, ROI cao

    - KPI = "awareness"(Nhận diện thương hiệu):
  • TikTok(40 %): Viral, reach rộng, giá rẻ
  • KOL / KOC(30 %): Tạo lòng tin, UGC content
  • Meta Reach(20 %): Targetin rộng theo demo
  • Google Display(10 %): Banner hiện diện

    - KPI = "retention"(Giữ chân):
  • CRM / Email / Zalo OA(60 %): Chi phí thấp, hiệu quả cao
  • Meta Retargeting(30 %): Nhắc nhở khách cũ
  • Google Remarketing(10 %): Bám đuổi web visitors

    ** QUY TẮC 2: Budget Threshold(Ngưỡng ngân sách) **
        - <10.000.000 VND: CHỈ tập trung 1 - 2 kênh hiệu quả nhất.KHÔNG chia nhỏ!
  • Ví dụ: Chỉ Meta(100 %) hoặc Meta(70 %) + Google(30 %)
  • Lý do: Tránh loãng tiền, không đủ data để optimize

    - 10M - 50M: Tối đa 2 - 3 kênh chính
        - > 50M: Mới kích hoạt KOL và các kênh branding

            ** QUY TẮC 3: Channel DNA(Đặc tính kênh) **
                - Google Ads: "Harvesting"(Thu hoạch) - khách đã có ý định
                    - Meta Ads: "Retargeting + Discovery" - bám đuổi và tìm khách mới
                        - TikTok: "Viral Seeding" - nội dung lan truyền nhanh
                            - KOL / KOC: "Trust Building" - xây dựng lòng tin(chi phí cao)
                                - CRM: Luôn phân bổ 5 - 10 % (trừ brand mới 100 % chưa có data)

** QUY TẮC 4: Industry Context **
    - B2B(Software, Service): Ưu tiên Google + LinkedIn
        - B2C(Fashion, F & B): Ưu tiên TikTok + Meta
            - E - commerce: Shopee Ads / Lazada Ads quan trọng

                === OUTPUT FORMAT(STRICT JSON) ===
                    {
                        "total_budget": [số tiền input],
                        "strategy_name": "Tên chiến lược VD: Performance-First Strategy",
                        "allocation": [
                            {
                                "channel": "Tên kênh",
                                "percentage": [số từ 0 - 100],
                                "amount": [số tiền VND],
                                "role": "Vai trò kênh VD: Harvesting/Seeding/Retargeting",
                                "rationale": "LÝ DO CỤ THỂ tại sao phân bổ % này cho ngành [Industry] và KPI [KPI]. KHÔNG viết chung chung!"
                            }
                        ],
                        "estimated_result": {
                            "clicks": "Ước tính clicks VD: 5.000 - 7.000",
                            "conversions": "Ước tính conversions VD: 150 - 200 đơn hàng"
                        }
                    }

                    ** LƯU Ý QUAN TRỌNG:**
                        - Tổng % các kênh PHẢI = 100 %
                            - Rationale PHẢI cụ thể cho ngành hàng và KPI, KHÔNG generic
                                - Nếu kênh = 0 %, vẫn liệt kê nhưng giải thích tại sao không phân bổ
                                    - Output PHẢI là JSON thuần, KHÔNG có markdown`;

    try {
        onProgress?.('Phân tích ngân sách và KPI...');

        const budgetInMillions = input.totalBudget / 1000000;
        const kpiLabel = {
            sales: 'Chuyển đổi/Doanh số',
            awareness: 'Nhận diện thương hiệu',
            retention: 'Giữ chân khách hàng'
        }[input.kpi];

        const userPrompt = `NGÂN SÁCH TỔNG: ${input.totalBudget.toLocaleString('vi-VN')} VND(${budgetInMillions.toFixed(1)}M)
KPI: ${kpiLabel}
NGÀNH HÀNG: ${input.industry}

Hãy phân bổ ngân sách dựa trên:
1. Ma trận ưu tiên KPI
2. Ngưỡng ngân sách(nếu < 10M chỉ 1 - 2 kênh)
3. Đặc thù ngành hàng ${input.industry}
4. Channel DNA

Rationale PHẢI cụ thể: "Với ngành ${input.industry} và mục tiêu ${kpiLabel}, kênh X chiếm Y% vì..."`;

        onProgress?.('Tính toán phân bổ tối ưu...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Hoàn thiện chiến lược...');

        const text = response.text?.trim() || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const data: BudgetAllocationResult = JSON.parse(jsonMatch[0]);

        // Verify total percentage = 100%
        const totalPercentage = data.allocation.reduce((sum, ch) => sum + ch.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.1) {
            console.warn('Total percentage not 100%:', totalPercentage);
        }

        return data;
    } catch (error) {
        console.error("Budget Allocation Error:", error);
        return null;
    }
};// Append this to the END of geminiService.ts

// --- INSIGHT FINDER ---
import { InsightFinderResult, InsightFinderInput } from '../types';

export const generateDeepInsights = async (
    input: InsightFinderInput,
    onProgress?: (step: string) => void
): Promise<InsightFinderResult | null> => {
    const systemPrompt = `### ROLE & OBJECTIVE
Bạn là chuyên gia Phân tích Tâm lý Người tiêu dùng (Consumer Psychology Expert) và Chiến lược gia Thương hiệu với 20+ năm kinh nghiệm. Nhiệm vụ của bạn là giải mã tâm lý khách hàng để tìm ra những insight sâu sắc nhất (Deep Insights) dựa trên dữ liệu đầu vào.

### THINKING PROCESS (CHAIN OF THOUGHT)
Đừng vội đưa ra kết quả. Hãy đặt mình vào vị trí của Target Audience trong bối cảnh sử dụng Product/Industry. Hãy tự hỏi:
- Tại sao họ thực sự cần sản phẩm này? (Không phải lý do bề mặt).
- Điều gì khiến họ lo lắng thầm kín mà không dám nói ra?
- Rào cản vô hình nào ngăn họ xuống tiền?

### FRAMEWORK 1: EMOTIONAL INTENSITY SCALE
Đánh giá mức độ cảm xúc của khách hàng với vấn đề hiện tại (1-10):
- **1-3 (Mild)**: Khó chịu nhẹ, không gấp
- **4-6 (Frustrated)**: Bực bội, muốn giải quyết
- **7-8 (Distress)**: Đau khổ, ảnh hưởng đến cuộc sống
- **9-10 (Desperate)**: Tuyệt vọng, sẵn sàng làm bất cứ điều gì

**Output:**
- Level: Số từ 1-10
- Description: Giải thích ngắn gọn tại sao nhóm khách này lại có mức độ cảm xúc đó với vấn đề hiện tại

### FRAMEWORK 2: ICEBERG PAIN POINTS (Tảng băng trôi)
Luôn có 2 layers - Surface (Bề mặt) và Deep (Thầm kín):

**Layer 1 - SURFACE PAIN (Nỗi đau bề mặt):**
- Những phàn nàn công khai, dễ thấy
- Vấn đề FUNCTIONAL: Đắt, chờ lâu, phức tạp...
- Khách hàng dễ dàng nói ra điều này công khai
- VD: "Giá đắt", "Tốn thời gian", "Khó sử dụng"

**Layer 2 - DEEP INSIGHT (Tâm lý thầm kín):**
- Nỗi sợ hãi, sự tự ti, hoặc áp lực xã hội ẩn sâu bên dưới
- Vấn đề EMOTIONAL/SOCIAL: Sợ bị đánh giá, mất kiểm soát, bị phán xét...
- Khách hàng CHỈ thổ lộ điều này ẩn danh trên internet
- VD Gym: Surface: "Đắt, đông người" | Deep: "Sợ bị người khác cười vì yếu (Gymtimidation)"
- **LƯU Ý: Đây là phần quan trọng nhất, hãy viết thật "chạm"**

**Output:** Tối thiểu 4 pain points (2 Surface + 2 Deep)

### FRAMEWORK 3: JOBS-TO-BE-DONE (JTBD)
Khách hàng không "mua sản phẩm". Họ "THUÊ" sản phẩm để làm một CÔNG VIỆC trong đời họ.

Phân loại 3 loại Jobs:
1. **Functional Job (Công năng)**: Nhiệm vụ cụ thể cần hoàn thành
   - VD: "Giảm mụn trong 2 tuần"

2. **Emotional Job (Cảm xúc cá nhân)**: Cảm giác họ muốn có
   - VD: "Cảm giác được 'chữa lành', lấy lại kiểm soát với làn da"

3. **Social Job (Xã hội)**: Cách họ muốn người khác nhìn nhận mình
   - VD: "Tự tin để mặt mộc khi video call với người yêu"

### FRAMEWORK 4: BARRIERS & FRICTIONS (Rào cản)
Chia làm 3 loại:
1. **Trust Barrier**: Lý do họ nghi ngờ thương hiệu/sản phẩm
   - Sợ bị lừa, sợ tác dụng phụ, sợ làm tệ hơn

2. **Effort Barrier**: Những phiền phức tốn công sức khiến họ ngại mua
   - Quá rắc rối, quá nhiều bước, không có thời gian

3. **Price Barrier**: Tâm lý so sánh giá trị nhận được so với số tiền bỏ ra
   - Không chỉ là đắt hay rẻ, mà là "xứng đáng hay không"

**Output:** Tối thiểu 3 barriers (1 mỗi loại)

### FRAMEWORK 5: BUYING BEHAVIOR JOURNEY
Map hành trình mua hàng:
1. **Search Channel**: Nơi họ tìm kiếm thông tin đầu tiên
   - Phải CỤ THỂ: "TikTok #skincarevietnam", "Group FB Đẹp Chanh Sả", "Google Maps", "Word of mouth"

2. **Decision Driver**: Yếu tố chốt hạ khiến họ ra quyết định mua ngay lập tức
   - VD: "Review từ người có da giống mình, KHÔNG tin KOL da đẹp sẵn"

3. **Deal Breaker**: Yếu tố tối kỵ khiến họ quay lưng bỏ đi ngay lập tức
   - VD: "Thành phần có Cồn/Paraben cho da nhạy cảm"

### OUTPUT FORMAT (STRICT JSON)
{
  "industry": "[Tên ngành input]",
  "deep_insights": {
    "pain_points": [
      { "level": "Surface", "content": "Phàn nàn công khai, dễ thấy..." },
      { "level": "Surface", "content": "..." },
      { "level": "Deep", "content": "Insight THẦM KÍN - sợ hãi/xấu hổ thực sự..." },
      { "level": "Deep", "content": "..." }
    ],
    "motivations_jtbd": {
      "functional": "Nhiệm vụ cụ thể cần giải quyết",
      "emotional": "Cảm giác cá nhân muốn đạt được",
      "social": "Cách họ muốn người khác nhìn nhận mình"
    },
    "barriers": [
      { "type": "Trust Barrier", "content": "Lý do nghi ngờ cụ thể..." },
      { "type": "Effort Barrier", "content": "Phiền phức cụ thể..." },
      { "type": "Price Barrier", "content": "Tâm lý so sánh giá trị..." }
    ],
    "buying_behavior": {
      "search_channel": "Kênh CỤ THỂ (TikTok, FB Group, Google...)",
      "decision_driver": "Yếu tố chốt hạ CỤ THỂ",
      "deal_breaker": "Điều tối kỵ CỤ THỂ"
    }
  },
  "emotional_intensity": {
    "level": 7,
    "description": "Giải thích tại sao có mức độ này..."
  }
}

### IMPORTANT RULES
- Tuyệt đối không đưa ra các nhận định chung chung (như "giá cả hợp lý", "chất lượng tốt"). Hãy cụ thể hóa theo Target Audience.
- Deep Insight phải là thứ mà khách hàng "nghĩ nhưng ít khi nói ra".
- Ngôn ngữ cần mang tính phân tích tâm lý, chuyên nghiệp nhưng dễ hiểu.
- Phải áp dụng Chain of Thought - suy nghĩ sâu trước khi đưa ra kết luận.
- Output PHẢI là JSON valid, không có markdown.`;

    try {
        onProgress?.('Đang phân tích tâm lý khách hàng...');

        const userPrompt = `PRODUCT/INDUSTRY: ${input.productIndustry}
TARGET AUDIENCE: ${input.targetAudience}
${input.context ? `CONTEXT/SEGMENT: ${input.context}` : ''}

Hãy áp dụng Chain of Thought để phân tích sâu:
1. Đặt mình vào vị trí của Target Audience
2. Tìm ra nỗi đau thầm kín (Deep Insight) - không phải lý do bề mặt
3. Phân tích Emotional Intensity Scale
4. Áp dụng Iceberg Pain Points (Surface + Deep)
5. Xác định Jobs-To-Be-Done (Functional, Emotional, Social)
6. Tìm ra Barriers & Buying Behavior

Nhớ:
- Deep Insight phải "chạm" vào tâm lý thầm kín
- Mọi thứ phải CỤ THỂ, không chung chung
- Emotional Intensity phải có lý do rõ ràng`;

        onProgress?.('Đang áp dụng Iceberg Pain Points...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.8,
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: 'application/json'
            },
        });

        onProgress?.('Đang hoàn thiện insights...');

        const text = response.text?.trim();
        if (!text) return null;

        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as InsightFinderResult;

        return result;
    } catch (error) {
        console.error('Insight Finder Error:', error);
        return null;
    }
};

// --- CREATIVE ANGLE EXPLORER ---
export const generateCreativeAngles = async (
    input: any,
    onProgress?: (step: string) => void
): Promise<any> => {
    const { productName, productDescription, targetAudience, keyFeatures, desiredAngleCount } = input;
    const count = desiredAngleCount || 30;

    onProgress?.('Khởi động Ma trận Sáng tạo...');

    const prompt = `Bạn là Creative Strategist chuyên nghiệp. Nhiệm vụ: Tạo ra ${count} góc tiếp cận quảng cáo (Ad Angles) HOÀN TOÀN ĐỘC ĐÁO cho sản phẩm sau:

SẢN PHẨM:
- Tên: ${productName}
- Mô tả: ${productDescription}
${targetAudience ? `- Đối tượng mục tiêu: ${targetAudience}` : ''}
${keyFeatures && keyFeatures.length > 0 ? `- Tính năng nổi bật: ${keyFeatures.join(', ')}` : ''}

QUY TẮC SÁNG TẠO:
1. Chạy qua 4 FRAMEWORK song song để đảm bảo đa dạng:
   - PAS (Pain-Agitate-Solve): Tìm nỗi đau → Xát muối → Giải pháp
   - BAB (Before-After-Bridge): Viễn cảnh xấu → Viễn cảnh đẹp → Sản phẩm là cầu nối
   - Emotional Hooks: FOMO, Vanity, Greed, Laziness, Curiosity, Altruism, Fear
   - Story-driven: Founder Story, User Testimonial, Behind the Scenes

2. PERMUTATION LOGIC (Tránh lặp):
   - Kết hợp: [Framework] + [Persona cụ thể] + [Feature X]
   - Ví dụ: PAS + Mẹ bỉm sữa + Tính năng an toàn = Angle 1
   - Mỗi angle phải có góc nhìn KHÁC BIỆT hoàn toàn

3. Mỗi angle BẮT BUỘC có:
   - framework: Tên framework được dùng
   - angle_name: Tên angle bằng tiếng Anh (ngắn gọn, catchy)
   - hook_text: Câu mở đầu hấp dẫn (bằng Tiếng Việt)
   - ad_copy_outline: Outline nội dung quảng cáo (3-4 câu, Tiếng Việt)
   - visual_direction: Hướng dẫn hình ảnh/video chi tiết (Tiếng Việt)
   - suggested_format: 'Video TikTok', 'Video YouTube', 'Static Image', 'Carousel', 'Meme'
   - emotion_tag: (Nếu dùng Emotional Hook framework) - FOMO, Vanity, Greed, Laziness, Curiosity, Altruism, Fear

YÊU CẦU ĐẦU RA:
- Trả về JSON object với cấu trúc:
{
  "product_context": "...",
  "total_angles": ${count},
  "angles": [
    {
      "id": 1,
      "framework": "PAS",
      "angle_name": "The Morning Chaos Angle",
      "hook_text": "...",
      "ad_copy_outline": "...",
      "visual_direction": "...",
      "suggested_format": "Video TikTok",
      "emotion_tag": "Laziness"
    }
  ]
}

- QUAN TRỌNG: Mỗi angle phải ĐỘC ĐÁO về cả góc nhìn, cảm xúc, và visual
- Hãy sáng tạo tối đa, đừng sợ ý tưởng điên rồ!`;

    onProgress?.('Đang chạy 4 Framework Matrix...');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                temperature: 0.8, // High creativity
                maxOutputTokens: 8000,
                responseMimeType: 'application/json',
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Parsing kết quả...');

        const text = response.text?.trim();
        if (!text) return null;

        const rawData = JSON.parse(text);

        // Map snake_case from AI to camelCase for frontend
        const mappedAngles = rawData.angles?.map((angle: any) => ({
            id: angle.id,
            framework: angle.framework,
            angleName: angle.angle_name, // Map angle_name -> angleName
            hookText: angle.hook_text,   // Map hook_text -> hookText
            adCopyOutline: angle.ad_copy_outline, // Map ad_copy_outline -> adCopyOutline
            visualDirection: angle.visual_direction, // Map visual_direction -> visualDirection
            suggestedFormat: angle.suggested_format, // Map suggested_format -> suggestedFormat
            emotionTag: angle.emotion_tag // Map emotion_tag -> emotionTag
        })) || [];

        const data = {
            productContext: rawData.product_context,
            totalAngles: rawData.total_angles,
            angles: mappedAngles
        };

        onProgress?.('Hoàn thành!');

        return data;
    } catch (error) {
        console.error('Creative Angle Explorer Error:', error);
        return null;
    }
};

export const checkAdsHealth = async (
    input: AdsHealthInput,
    onProgress?: (step: string) => void
): Promise<AdsHealthResult | null> => {
    onProgress?.('Initializing Ads Doctor...');

    // Prepare data string with basic cleaning (remove 'đ', commas)
    let dataStr = '';
    if (input.dataMode === 'manual' && input.manualMetrics) {
        dataStr = `
        Spend: ${input.manualMetrics.spend}
        Impressions: ${input.manualMetrics.impressions}
        Clicks: ${input.manualMetrics.clicks}
        Conversions: ${input.manualMetrics.conversions}
        `;
    } else {
        const raw = input.rawText || '';
        // Clean special characters like 'đ' and commas for number parsing consistency if needed, 
        // strictly speaking the AI can handle it, but user asked for "Clean Data".
        // We'll clean it before sending to context just to be safe.
        dataStr = raw.replace(/[đ,]/g, '');
    }

    const systemPrompt = `You are a Senior Performance Marketer and Data Scientist. 
    Your task is to analyze raw advertising metrics and diagnose campaign health based on a strict Diagnostic Matrix.
    
    IMPORTANT: OUTPUT IN VIETNAMESE (Tiếng Việt) for all explanations, diagnosis, status, and action details. Keep JSON keys in English.
    
    CONTEXT:
    - Industry: ${input.industry}
    - Platform: ${input.platform}
    
    DIAGNOSTIC LOGIC (Apply this strictly):
    
    1. Contextual Benchmarking:
       - Establish baseline CTR, CPM, CPC, CR based on Industry & Platform.
       
    2. Root Cause Analysis (Identify ONE primary issue):
       - Creative Fatigue: CPM stable, CTR drops over time, Frequency > 2.0.
       - Wrong Targeting: CTR very low (<0.5%) from start, CPM low.
       - High Competition: CTR good, but CPC very high due to high CPM.
       - Landing Page Issue: CTR high, CPC cheap, but CR = 0 or very low.
       
    3. Structural Recommendation:
       - Low budget (<500k/day) & many adsets -> Consolidate.
       - Good efficiency (ROAS > 2.0) -> Scale (Duplicate or +20% budget).
       
    OUTPUT FORMAT (Strict JSON):
    {
      "health_score": number (0-100),
      "status": "Tốt" | "Cảnh báo" | "Nguy hiểm",
      "metrics_analysis": {
        "cpm": { "value": number, "assessment": "Thấp"|"Tốt"|"Cao", "benchmark": "string" },
        "ctr": { "value": number (percent), "assessment": "Thấp"|"Tốt"|"Cao", "benchmark": "string" },
        "cpc": { "value": number, "assessment": "Rẻ"|"Tốt"|"Đắt" },
        "cr": { "value": number (percent), "assessment": "Thấp"|"Tốt"|"Cao" }
      },
      "diagnosis": {
        "primary_issue": "string (Title in Vietnamese)",
        "explanation": "string (Detailed explanation in Vietnamese)"
      },
      "actionable_steps": [
        { "action": "Cắt giảm"|"Làm mới Content"|"Cấu trúc lại"|"Scale", "detail": "string (Action detail in Vietnamese)" }
      ]
    }
    `;

    const userPrompt = `Analyze this clean data:\n${dataStr}`;

    onProgress?.('Analyzing metrics & benchmarking...');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.5,
                responseMimeType: 'application/json',
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Formulating action plan...');

        const text = response.text?.trim();
        if (!text) return null;

        // Clean markdown if present
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as AdsHealthResult;
    } catch (error) {
        console.error('Ads Health Check Error:', error);
        return null;
    }
};

// --- BRAND POSITIONING BUILDER ---
export const buildBrandPositioning = async (
    input: BrandPositioningInput,
    onProgress?: (step: string) => void
): Promise<BrandPositioningResult | null> => {
    onProgress?.('Đang phân tích thương hiệu...');

    const systemPrompt = `Bạn là Chief Brand Officer (CBO) với 20 năm kinh nghiệm xây dựng thương hiệu cho các Startup và tập đoàn lớn.

NHIỆM VỤ: Xây dựng Brand Strategy Deck hoàn chỉnh cho thương hiệu dựa trên thông tin đầu vào.

THÔNG TIN ĐẦU VÀO:
- Tên thương hiệu: ${input.brandName}
- Sản phẩm/Dịch vụ: ${input.products}
- Khách hàng mục tiêu: ${input.targetCustomers}
- Đối thủ cạnh tranh: ${input.competitors}
- Tầm nhìn/Sứ mệnh: ${input.visionMission || 'Chưa xác định'}

QUY TẮC TƯ DUY CHIẾN LƯỢC (PHẢI TUÂN THỦ NGHIÊM NGẶT):

1. PHÂN BIỆT USP vs UVP:
   - USP (Unique Selling Proposition): SỰ KHÁC BIỆT so với đối thủ.
     Công thức: "Duy nhất tại Việt Nam..." hoặc "The Only... that..."
     Ví dụ: "Duy nhất tích hợp AI vào quy trình pháp lý tại VN."
   
   - UVP (Unique Value Proposition): GIÁ TRỊ mang lại cho khách hàng.
     Công thức: "Giúp bạn [lợi ích cụ thể] + [con số/thời gian]"
     Ví dụ: "Giúp Startup soạn hợp đồng chuẩn luật trong 5 phút, tiết kiệm 90% chi phí."

2. BRAND ARCHETYPE (12 Hình mẫu Carl Jung):
   Chọn ĐÚNG 1 archetype phù hợp nhất:
   - The Innocent (Hồn nhiên): Tối giản, lạc quan, đáng tin. VD: Coca-Cola
   - The Sage (Nhà hiền triết): Thông thái, dẫn dắt, tri thức. VD: Google, TED
   - The Explorer (Nhà thám hiểm): Tự do, khám phá, phiêu lưu. VD: Jeep, REI
   - The Outlaw (Kẻ nổi loạn): Phá vỡ lề lối, táo bạo. VD: Harley-Davidson
   - The Magician (Nhà ảo thuật): Biến ước mơ thành hiện thực. VD: Apple, Disney
   - The Hero (Anh hùng): Dũng cảm, chiến thắng, vượt qua thử thách. VD: Nike
   - The Lover (Người tình): Đam mê, gợi cảm, kết nối. VD: Victoria's Secret
   - The Jester (Chú hề): Vui vẻ, hài hước, sống trọn từng khoảnh khắc. VD: M&M's
   - The Everyman (Người bình dân): Gần gũi, thực tế, đồng cảm. VD: IKEA
   - The Caregiver (Người chăm sóc): Bảo vệ, nuôi dưỡng, công bằng. VD: Volvo, Johnson & Johnson
   - The Ruler (Nhà cầm quyền): Quyền lực, đẳng cấp, kiểm soát. VD: Mercedes-Benz, Rolex
   - The Creator (Nhà sáng tạo): Sáng tạo, đổi mới, tự thể hiện. VD: Lego, Adobe

3. RTB (Reason to Believe) - BẰNG CHỨNG:
   RTB KHÔNG ĐƯỢC là lời hứa suông! Phải là:
   - Tính năng cụ thể (Feature): "Tích hợp 50+ template chuẩn MBA"
   - Công nghệ độc quyền (Technology): "Công nghệ NLP xử lý ngôn ngữ tự nhiên"
   - Chứng nhận/Giải thưởng (Certification): "ISO 27001, Top 10 Startup Vietnam"
   - Con số ấn tượng: "10,000+ khách hàng tin dùng"

4. POSITIONING STATEMENT (Template chuẩn MBA):
   "Đối với [Khách hàng mục tiêu], những người [Nhu cầu/Pain point], [Tên Brand] là [Định nghĩa Category] giúp [Lợi ích chính] nhờ vào [RTB nổi bật nhất]."

ĐẦU RA (JSON NGHIÊM NGẶT):
{
  "brand_identity": {
    "archetype": "Tên Archetype (Tên Tiếng Việt)", // VD: "The Magician (Nhà ảo thuật)"
    "archetype_desc": "Mô tả ngắn về archetype này phù hợp với brand như thế nào",
    "tone_of_voice": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3"] // VD: ["Visionary", "Charismatic", "Bold"]
  },
  "strategic_pillars": {
    "usp": "USP theo công thức 'Duy nhất...' hoặc 'The Only...'",
    "uvp": "UVP theo công thức 'Giúp bạn...' với con số cụ thể",
    "rtb": ["RTB 1 - Feature/Tech/Cert", "RTB 2", "RTB 3"]
  },
  "messaging_pillars": [
    {
      "pillar_name": "Tên trụ cột thông điệp 1",
      "key_message": "Thông điệp chính cho trụ cột này"
    },
    {
      "pillar_name": "Tên trụ cột thông điệp 2",
      "key_message": "Thông điệp chính cho trụ cột này"
    }
  ],
  "positioning_statement": "Câu định vị hoàn chỉnh theo template MBA"
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM.`;

    try {
        onProgress?.('Đang xây dựng Brand Canvas...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            config: {
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.8,
                maxOutputTokens: 4096,
            },
        });

        onProgress?.('Đang hoàn thiện Brand Strategy...');

        const text = response.text?.trim();
        if (!text) return null;

        // Clean markdown if present
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as BrandPositioningResult;
    } catch (error) {
        console.error('Brand Positioning Builder Error:', error);
        return null;
    }
};

// Pricing Analyzer - Pricing Strategy Analysis
export const analyzePricingStrategy = async (
    input: PricingAnalyzerInput,
    onProgress?: (message: string) => void
): Promise<PricingAnalyzerResult | null> => {
    try {
        onProgress?.('Đang phân tích chiến lược giá...');

        // PILLAR 1: Financial Analysis (Local Calculation)
        const grossMargin = ((input.targetPrice - input.cogs) / input.targetPrice) * 100;

        let financialAssessment = '';
        if (grossMargin < 20) {
            financialAssessment = 'Biên lợi nhuận Rất thấp (Critical). Nguy cơ thua lỗ cao.';
        } else if (grossMargin < 30) {
            financialAssessment = 'Biên lợi nhuận Mỏng (Thin Margin). Rất rủi ro nếu chạy Ads.';
        } else if (grossMargin < 50) {
            financialAssessment = 'Biên lợi nhuận Trung bình (Moderate). Đủ để vận hành nhưng cần tối ưu.';
        } else {
            financialAssessment = 'Biên lợi nhuận Tốt (Healthy). Đủ không gian để tái đầu tư.';
        }

        const estimatedFixedCosts = 10000000; // 10M VND assumption
        const breakEvenUnits = Math.ceil(estimatedFixedCosts / (input.targetPrice - input.cogs));

        // PILLAR 2: Competitive Indexing (Local Calculation)
        const marketAvg = (input.competitorMin + input.competitorMax) / 2;
        const priceIndex = input.targetPrice / marketAvg;

        let marketComment = '';
        const priceDiff = ((input.targetPrice - marketAvg) / marketAvg) * 100;

        if (priceIndex < 0.85) {
            marketComment = `Bạn đang rẻ hơn thị trường ${Math.abs(priceDiff).toFixed(0)}%. Điều này tốt cho việc chiếm thị phần nhưng có thể làm giảm giá trị thương hiệu.`;
        } else if (priceIndex > 1.15) {
            marketComment = `Bạn đang đắt hơn thị trường ${priceDiff.toFixed(0)}%. Để bán được giá này, Brand của bạn phải thuộc Top 10% thị trường về niềm tin.`;
        } else {
            marketComment = `Giá của bạn nằm trong khoảng trung bình thị trường (±15%). Đây là vùng an toàn.`;
        }

        // PILLAR 3: Positioning Match Logic
        let positioningWarning = '';
        if (input.positioning === 'premium' && priceIndex < 1.0) {
            positioningWarning = 'CẢNH BÁO: Bạn định vị Premium nhưng giá thấp hơn thị trường. Điều này gây ra Brand Dilution (làm loãng thương hiệu).';
        } else if (input.positioning === 'budget' && priceIndex > 1.0) {
            positioningWarning = 'CẢNH BÁO: Bạn định vị Budget nhưng giá cao hơn thị trường. Điều này không thể cạnh tranh được.';
        }

        // Calculate Verdict Score (0-100)
        let score = 50; // Base score

        // Financial health impact (max ±20)
        if (grossMargin >= 50) score += 20;
        else if (grossMargin >= 30) score += 10;
        else if (grossMargin < 20) score -= 20;
        else score -= 10;

        // Market positioning impact (max ±20)
        if (priceIndex >= 0.85 && priceIndex <= 1.15) score += 20;
        else if (priceIndex < 0.7 || priceIndex > 1.5) score -= 20;
        else score -= 10;

        // Positioning match impact (max ±10)
        if (positioningWarning) score -= 10;
        else score += 10;

        score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

        let verdictStatus: 'Optimal' | 'Warning' | 'Critical';
        if (score >= 70) verdictStatus = 'Optimal';
        else if (score >= 40) verdictStatus = 'Warning';
        else verdictStatus = 'Critical';

        let verdictSummary = '';
        if (verdictStatus === 'Optimal') {
            verdictSummary = 'Mức giá này hợp lý và cân bằng tốt giữa lợi nhuận và khả năng cạnh tranh.';
        } else if (verdictStatus === 'Warning') {
            verdictSummary = 'Mức giá này cần điều chỉnh. ';
            if (grossMargin < 30) verdictSummary += 'Biên lợi nhuận thấp. ';
            if (positioningWarning) verdictSummary += 'Không khớp với định vị thương hiệu. ';
            if (priceIndex > 1.2) verdictSummary += 'Giá cao hơn đối thủ đáng kể.';
        } else {
            verdictSummary = 'Mức giá này có vấn đề nghiêm trọng và cần xem xét lại toàn bộ chiến lược.';
        }

        // Use Gemini for Strategic Solutions
        onProgress?.('Đang tạo giải pháp chiến lược...');

        const industryContext = input.industry ? `Ngành: ${input.industry}` : 'Ngành: Chưa xác định';

        const systemPrompt = `Bạn là Senior Pricing Strategist và Financial Analyst.

NHIỆM VỤ: Đưa ra 3-5 lời khuyên chiến lược để tối ưu giá bán.

DỮ LIỆU PHÂN TÍCH:
${industryContext}
- Giá vốn (COGS): ${input.cogs.toLocaleString('vi-VN')}đ
- Giá bán mục tiêu: ${input.targetPrice.toLocaleString('vi-VN')}đ
- Biên lợi nhuận: ${grossMargin.toFixed(1)}%
- Giá đối thủ: ${input.competitorMin.toLocaleString('vi-VN')}đ - ${input.competitorMax.toLocaleString('vi-VN')}đ
- Giá trung bình thị trường: ${marketAvg.toLocaleString('vi-VN')}đ
- Price Index: ${priceIndex.toFixed(2)} (${priceIndex > 1 ? 'Cao hơn' : 'Thấp hơn'} thị trường ${Math.abs(priceDiff).toFixed(0)}%)
- Định vị: ${input.positioning === 'budget' ? 'Budget (Giá rẻ)' : input.positioning === 'premium' ? 'Premium (Cao cấp)' : 'Mainstream (Phổ thông)'}

VẤN ĐỀ CHÍNH:
${positioningWarning || 'Không có vấn đề định vị'}
${grossMargin < 30 ? '- Biên lợi nhuận quá thấp' : ''}
${priceIndex > 1.2 ? '- Giá cao hơn đối thủ đáng kể' : ''}

YÊU CẦU:
Đưa ra 3-5 strategic solutions (giải pháp chiến lược) cụ thể, khả thi. Mỗi solution phải có:
- type: Loại giải pháp (Psychological Pricing, Value Addition, Cost Optimization, Positioning Strategy, Competitive Response)
- advice: Lời khuyên chi tiết, cụ thể cho ngành hàng này

Ví dụ về các loại advice:
- Psychological Pricing: "Giảm giá từ 500k xuống 499k để tạo Left-digit effect"
- Value Addition: "Thêm bảo hành 12 tháng để justify giá cao hơn"
- Cost Optimization: "Đàm phán với nhà cung cấp để giảm COGS 10%"
- Positioning Strategy: "Nâng cấp packaging để match với định vị Premium"
- Competitive Response: "Bundle với sản phẩm bổ sung để tạo differentiation"

TRẢ VỀ JSON (chỉ JSON, không markdown):
{
  "strategic_solutions": [
    {
      "type": "string",
      "advice": "string"
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            config: {
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.8,
                responseMimeType: 'application/json'
            }
        });

        const text = response.text?.trim();
        let strategicSolutions: StrategicSolution[] = [];

        if (text) {
            const jsonStr = text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            strategicSolutions = parsed.strategic_solutions || [];
        }

        return {
            verdict: {
                status: verdictStatus,
                score: Math.round(score),
                summary: verdictSummary
            },
            financial_analysis: {
                gross_margin_percent: Math.round(grossMargin * 10) / 10,
                break_even_point: `Bạn cần bán ít nhất ${breakEvenUnits} đơn/tháng để hòa vốn cố định (ước tính).`,
                assessment: financialAssessment
            },
            market_position_analysis: {
                your_price: input.targetPrice,
                market_avg: Math.round(marketAvg),
                price_index: Math.round(priceIndex * 100) / 100,
                comment: marketComment + (positioningWarning ? ` ${positioningWarning}` : '')
            },
            strategic_solutions: strategicSolutions
        };
    } catch (error) {
        console.error('Pricing Analyzer Error:', error);
        return null;
    }
};

// Audience Emotion Map - Consumer Psychology Analysis
export const analyzeEmotionalJourney = async (
    input: AudienceEmotionMapInput,
    onProgress?: (message: string) => void
): Promise<AudienceEmotionMapResult | null> => {
    try {
        onProgress?.('🧠 Đang phân tích tâm lý khách hàng (Tiếng Việt)...');

        const systemPrompt = `Bạn là Senior Consumer Psychologist chuyên về Plutchik's Wheel of Emotions và Content Strategist người Việt Nam.

NHIỆM VỤ: Phân tích hành trình cảm xúc của khách hàng qua 4 giai đoạn mua hàng.

ĐẦU VÀO (INPUT):
- Ngành hàng: ${input.industry}
${input.productCategory ? `- Danh mục sản phẩm: ${input.productCategory}` : ''}
${input.targetAudience ? `- Đối tượng khách hàng: ${input.targetAudience}` : ''}
- Nỗi đau/Vấn đề chính (Pain Point): ${input.painPoint}
${input.positioning ? `- Định vị thương hiệu: ${input.positioning}` : ''}

QUY ĐỊNH NGÔN NGỮ (LANGUAGE RULES) - QUAN TRỌNG NHẤT:
1. TOÀN BỘ KẾT QUẢ TRẢ VỀ PHẢI LÀ TIẾNG VIỆT (VIETNAMESE).
2. Tên cảm xúc (Dominant Emotion) bắt buộc format: "Tên Tiếng Việt (Tên Tiếng Anh)". VD: "Lo âu (Anxiety)".
3. Trigger, Monologue, Tone, Hook, Keywords... TẤT CẢ phải viết bằng Tiếng Việt tự nhiên, không dịch word-by-word.

LOGIC PHÂN TÍCH (CHAIN OF THOUGHT):
- Awareness (Nhận biết): Bắt đầu từ "${input.painPoint}". Nếu đau đớn/nghiêm trọng -> Lo âu/Sợ hãi. Nếu nhu cầu mới -> Tò mò/Hào hứng.
- Journey (Cân nhắc): Quá tải thông tin -> Bối rối. So sánh giá/tính năng -> Nghi ngờ.
- Buy (Mua hàng): ${input.positioning === 'premium' ? 'Giá cao -> Căng thẳng nhưng Hy vọng.' : input.positioning === 'budget' ? 'Giá rẻ -> An tâm, Hài lòng.' : 'Thời điểm xuống tiền -> Căng thẳng vs Hào hứng.'}
- Loyal (Trung thành): Sau mua phải là tích cực -> Tự hào, Tin tưởng, Vui vẻ.

4 GIAI ĐOẠN TRẢ VỀ:
1. AWARENESS (Nhận biết) - Emoji: 🤔
2. JOURNEY (Cân nhắc) - Emoji: 🤯
3. BUY (Mua hàng) - Emoji: 😬
4. LOYAL (Trung thành) - Emoji: 😎

OUTPUT JSON FORMAT (STRICT JSON, NO MARKDOWN):
{
  "industry": "${input.industry}",
  "emotion_journey": [
    {
      "stage": "Awareness",
      "dominant_emotion": "Lo âu (Anxiety)",
      "intensity_score": 7,
      "trigger": "Viết bằng Tiếng Việt...",
      "internal_monologue": "Tôi cảm thấy... (Viết bằng Tiếng Việt)",
      "recommended_tone": "Đồng cảm, Thấu hiểu (Viết bằng Tiếng Việt)",
      "content_hook": "Viết bằng Tiếng Việt...",
      "emoji": "🤔",
      "keywords_to_use": ["Từ khóa 1", "Từ khóa 2"],
      "keywords_to_avoid": ["Từ khóa tránh 1"]
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            config: {
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.8,
                responseMimeType: "application/json"
            },
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as AudienceEmotionMapResult;

        // Validation fallback
        if (!result.emotion_journey || result.emotion_journey.length < 4) {
            // Basic retry or fallback if strictly needed, but throwing creates error state
            console.warn("Insufficient stages generated");
        }

        return result;
    } catch (error) {
        console.error("Emotion Map Error:", error);
        return null;
    }
};








