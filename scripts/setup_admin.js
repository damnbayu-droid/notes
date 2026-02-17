
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfxhfutflhnxjjpbqscj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmeGhmdXRmbGhueGpqcGJxc2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTg4MjksImV4cCI6MjA4Njg5NDgyOX0.IVwTASlNKoFleBlnzPxbth-ITt71kFhVBmNt4I723yM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdmin() {
    const email = 'damnbayu@gmail.com';
    const password = 'Admin123';
    const name = 'Admin';

    console.log(`Attempting to sign up ${email}...`);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) {
            console.log('Sign up result:', error.message);
            // Try signing in to see if user already exists
            if (error.message.includes('already registered') || error.message.includes('already taken')) {
                console.log('User already exists. Attempting sign in...');
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) {
                    console.error('Sign in failed (password might be different?):', signInError.message);
                } else {
                    console.log('Sign in successful! Admin user verified.');
                }
            }
        } else {
            console.log('Sign up successful!');
            if (!data.session) {
                console.log('Note: Email confirmation might be required depending on project settings.');
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

setupAdmin();
