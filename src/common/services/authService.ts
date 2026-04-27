import { supabase } from '../utils/supabase';

interface UserCredentials {
  email: string;
  password: string;
  name?: string;
}

export const authService = {
  async signUp(credentials: UserCredentials) {
    const { email, password, name } = credentials;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signIn(credentials: Pick<UserCredentials, 'email' | 'password'>) {
    const { email, password } = credentials;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }

    return user;
  },

  async onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
