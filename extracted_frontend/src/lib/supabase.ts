import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdijjlsuehjivlodmfxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWpqbHN1ZWhqaXZsb2RtZnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjI4MzksImV4cCI6MjA5ODg5ODgzOX0.RbU-zmK9qIeOada43sKSs4kHSEnrkVGoKcVesmaoCHI';

export const supabase = createClient(supabaseUrl, supabaseKey);
