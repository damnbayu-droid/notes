
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfxhfutflhnxjjpbqscj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmeGhmdXRmbGhueGpqcGJxc2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTg4MjksImV4cCI6MjA4Njg5NDgyOX0.IVwTASlNKoFleBlnzPxbth-ITt71kFhVBmNt4I723yM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
    const email = 'damnbayu@gmail.com';
    const password = 'Admin123';

    console.log(`Checking status for ${email}...`);

    // 1. Try Sign In
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInData.user) {
        console.log('✅ Sign In Successful!');
        console.log('User ID:', signInData.user.id);
        return;
    }

    console.log('❌ Sign In Failed:', signInError?.message);

    // 2. If invalid login credentials, maybe user doesn't exist? Try Sign Up
    if (signInError && (signInError.message.includes('Invalid login credentials') || signInError.message.includes('Email not confirmed'))) {
        if (signInError.message.includes('Email not confirmed')) {
            console.log('⚠️ Email exists but is NOT confirmed. Please check your inbox.');
            return;
        }

        console.log('Attempting to create user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: 'Admin' } }
        });

        if (signUpError) {
            console.log('❌ Sign Up Failed:', signUpError.message);
        } else {
            console.log('✅ Sign Up Successful!');
            if (signUpData.user && !signUpData.session) {
                console.log('⚠️ User created but email confirmation is required.');
            }
        }
    }
}

debugAuth();
