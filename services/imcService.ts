import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import { IMCPlan, IMCPhase, IMCChannelMatrix } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
] as any;

export interface IMCInput {
    brand: string;
    product: string;
    budget: number;
    timeline_weeks: number;
    industry?: string;
}

export interface SavedIMCPlan extends IMCPlan { }

// Strategic validation constants
const VALIDATION = {
    MIN_BUDGET: 50_000_000, // 50M VND
    MIN_TIMELINE: 4,
    MAX_TIMELINE: 24,
    PHASE_DISTRIBUTION: {
        teasing: { min: 10, max: 20 },
        booming: { min: 50, max: 70 },
        sustain: { min: 15, max: 30 }
    }
};

export const IMCService = {
    /**
     * Validate budget meets IMC minimum threshold
     */
    validateBudget(budget: number): { valid: boolean; message?: string } {
        if (budget < VALIDATION.MIN_BUDGET) {
            return {
                valid: false,
                message: `Ngân sách tối thiểu cho chiến dịch IMC tổng thể là ${(VALIDATION.MIN_BUDGET / 1_000_000).toFixed(0)}M VND. IMC cần sự tổng lực trên nhiều kênh để hiệu quả.`
            };
        }
        return { valid: true };
    },

    /**
     * Generate comprehensive IMC strategy using Gemini AI
     */
    async generateIMCPlan(input: IMCInput): Promise<IMCPlan | null> {
        try {
            // Validate budget first
            const validation = this.validateBudget(input.budget);
            if (!validation.valid) {
                alert(validation.message);
                return null;
            }

            const systemPrompt = `Bạn là Strategic Planning Director tại Agency hàng đầu như Ogilvy/Dentsu. 
Nhiệm vụ: Tạo kế hoạch IMC (Integrated Marketing Communications) toàn diện.

YÊU CẦU BẮT BUỘC:

1. BIG IDEA (Ý tưởng lớn):
   - Tìm ra 1 Key Message duy nhất xuyên suốt
   - Message phải có thể biến thể cho từng kênh (TikTok vui nhộn, Báo chí trang trọng)

2. PHASING STRATEGY:
   - Phase 1: Teasing (Gây tò mò) - 10-20% ngân sách - PR + Social Seeding
   - Phase 2: Booming/Launch (Bùng nổ) - 50-70% ngân sách - Mass Media + KOLs + Ads
   - Phase 3: Sustain (Duy trì) - 15-30% ngân sách - Promotion + Retargeting + Community

3. POES MODEL (Channel Mix):
   - Paid: Quảng cáo trả tiền
   - Owned: Website, Fanpage, App
   - Earned: Báo chí miễn phí, Viral
   - Shared: Cộng đồng review, chia sẻ

4. Mỗi activity phải có KPI cụ thể

OUTPUT FORMAT (JSON ONLY):
{
  "campaign_name": "Tên chiến dịch",
  "big_idea": "Ý tưởng lớn ngắn gọn",
  "key_message": "Thông điệp chính chi tiết",
  "phases": [
    {
      "phase_name": "Phase 1: Teasing (2 tuần)",
      "objective": "Mục tiêu",
      "budget_allocation": "15%",
      "duration_weeks": 2,
      "activities": [
        {
          "channel_type": "Earned",
          "channel_name": "PR Báo chí",
          "tactic": "Chiến thuật cụ thể",
          "kpi": "500k Reach"
        }
      ]
    }
  ],
  "channel_matrix": {
    "paid": ["Facebook Ads"],
    "owned": ["Website"],
    "earned": ["VnExpress"],
    "shared": ["Facebook Groups"]
  }
}`;

            const prompt = `Tạo kế hoạch IMC cho:
- Thương hiệu: ${input.brand}
- Sản phẩm: ${input.product}
- Ngân sách: ${input.budget.toLocaleString('vi-VN')} VND
- Thời gian: ${input.timeline_weeks} tuần
${input.industry ? `- Ngành: ${input.industry}` : ''}`;

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
            const parsed = JSON.parse(text);

            // Create IMC Plan object
            const imcPlan: IMCPlan = {
                id: Date.now().toString(),
                campaign_name: parsed.campaign_name,
                big_idea: parsed.big_idea,
                key_message: parsed.key_message,
                brand: input.brand,
                product: input.product,
                total_budget: input.budget,
                timeline_weeks: input.timeline_weeks,
                phases: parsed.phases || [],
                channel_matrix: parsed.channel_matrix || { paid: [], owned: [], earned: [], shared: [] },
                created_at: Date.now()
            };

            return imcPlan;
        } catch (error) {
            console.error('Error generating IMC plan:', error);
            return null;
        }
    },


    /**
     * Save IMC plan to Supabase
     */
    async savePlan(plan: SavedIMCPlan): Promise<boolean> {
        try {
            const dbPlan = {
                id: plan.id,
                campaign_name: plan.campaign_name,
                big_idea: plan.big_idea,
                key_message: plan.key_message,
                brand: plan.brand,
                product: plan.product,
                total_budget: plan.total_budget,
                timeline_weeks: plan.timeline_weeks,
                phases: plan.phases,
                channel_matrix: plan.channel_matrix,
                created_at: new Date(plan.created_at).toISOString()
            };

            const { error } = await supabase
                .from('imc_plans')
                .upsert(dbPlan, { onConflict: 'id' });

            if (error) {
                console.error('Error saving IMC plan:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in savePlan:', error);
            return false;
        }
    },

    /**
     * Get all saved IMC plans
     */
    async getPlans(): Promise<SavedIMCPlan[]> {
        try {
            const { data, error } = await supabase
                .from('imc_plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching IMC plans:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                campaign_name: item.campaign_name,
                big_idea: item.big_idea,
                key_message: item.key_message,
                brand: item.brand,
                product: item.product,
                total_budget: item.total_budget,
                timeline_weeks: item.timeline_weeks,
                phases: item.phases,
                channel_matrix: item.channel_matrix,
                created_at: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getPlans:', error);
            return [];
        }
    },

    /**
     * Delete IMC plan
     */
    async deletePlan(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('imc_plans')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting IMC plan:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deletePlan:', error);
            return false;
        }
    }
};
