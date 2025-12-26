import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use Anon key or Service Role if available, assuming Anon works for now if RLS allows

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- EMAIL DESIGNS ---');
    const { data: designs, error: designError } = await supabase
        .from('email_designs')
        .select('*')
        .order('updated_at', { ascending: false });

    if (designError) {
        console.error('Error fetching designs:', designError);
    } else {
        designs.forEach(d => {
            const doc = d.doc || {};
            const blocks = doc.blocks || [];
            const firstBlock = blocks.length > 0 ? blocks[0] : null;
            let contentSnippet = 'Empty/No Blocks';
            if (firstBlock) {
                if (firstBlock.content) contentSnippet = firstBlock.content.substring(0, 50).replace(/\n/g, ' ');
                else if (firstBlock.type) contentSnippet = `[Type: ${firstBlock.type}]`;
            }

            console.log(`ID: ${d.id}`);
            console.log(`  Name: ${d.name}`);
            console.log(`  Updated: ${d.updated_at}`);
            console.log(`  Blocks: ${blocks.length}`);
            console.log(`  First Block: ${contentSnippet}`);
            console.log('-----------------------------------');
        });
    }

    console.log('\n--- EMAIL CAMPAIGNS ---');
    const { data: campaigns, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('id, name, template_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (campaignError) {
        console.error('Error fetching campaigns:', campaignError);
    } else {
        campaigns.forEach(c => {
            console.log(`ID: ${c.id}`);
            console.log(`  Name: ${c.name}`);
            console.log(`  Template ID: ${c.template_id}`);
            console.log(`  Status: ${c.status}`);
            console.log('-----------------------------------');
        });
    }
}

main();
