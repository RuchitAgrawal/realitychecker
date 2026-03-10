import { create } from 'zustand';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// ─── Auth ────────────────────────────────────────────────────────────────────

interface AuthState {
    session: Session | null;
    user: User | null;
    isAuthenticated: boolean;
    signInWithEmail: (email: string, password: string) => Promise<string | null>;
    signUpWithEmail: (email: string, password: string) => Promise<string | null>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

// ─── Resumes ─────────────────────────────────────────────────────────────────

interface ResumesState {
    list: () => Promise<Resume[]>;
    get: (id: string) => Promise<Resume | null>;
    create: (data: Omit<Resume, 'id' | 'createdAt'>) => Promise<Resume>;
    delete: (id: string) => Promise<void>;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

interface StorageState {
    uploadFile: (bucket: string, file: File, path?: string) => Promise<string>;
    getSignedUrl: (bucket: string, path: string, expiresIn?: number) => Promise<string>;
    readBlob: (bucket: string, path: string) => Promise<Blob | null>;
    deleteFile: (bucket: string, path: string) => Promise<void>;
}

// ─── Combined Store ───────────────────────────────────────────────────────────

interface StoreState {
    isLoading: boolean;
    session: Session | null;
    user: User | null;
    isAuthenticated: boolean;
    setSession: (session: Session | null) => void;
    setLoading: (v: boolean) => void;
    auth: AuthState;
    resumes: ResumesState;
    storage: StorageState;
}

export const useStore = create<StoreState>((set, get) => ({
    isLoading: true,
    session: null,
    user: null,
    isAuthenticated: false,

    setSession: (session) => set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
    }),

    setLoading: (v) => set({ isLoading: v }),

    // ── Auth ──────────────────────────────────────────────────────────────────
    auth: {
        session: null,
        user: null,
        isAuthenticated: false,

        signInWithEmail: async (email, password) => {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            return error ? error.message : null;
        },

        signUpWithEmail: async (email, password) => {
            const { error } = await supabase.auth.signUp({ email, password });
            return error ? error.message : null;
        },

        signInWithGoogle: async () => {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/` },
            });
        },

        signOut: async () => {
            await supabase.auth.signOut();
            set({ session: null, user: null, isAuthenticated: false });
        },
    },

    // ── Resumes ───────────────────────────────────────────────────────────────
    resumes: {
        list: async () => {
            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data ?? []).map(dbToResume);
        },

        get: async (id) => {
            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .eq('id', id)
                .single();
            if (error) return null;
            return dbToResume(data);
        },

        create: async (input) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            const row = {
                user_id: user.id,
                company_name: input.companyName ?? null,
                job_title: input.jobTitle ?? null,
                job_description: input.jobDescription ?? null,
                resume_path: input.resumePath ?? null,
                image_path: input.imagePath ?? null,
                feedback: input.feedback ?? null,
            };
            const { data, error } = await supabase.from('resumes').insert(row).select().single();
            if (error) throw error;
            return dbToResume(data);
        },

        delete: async (id) => {
            // Fetch paths first so we can clean up storage
            const { data } = await supabase.from('resumes').select('resume_path, image_path').eq('id', id).single();
            if (data?.resume_path) {
                await supabase.storage.from('resume-files').remove([data.resume_path]).catch(() => {});
            }
            if (data?.image_path) {
                await supabase.storage.from('resume-images').remove([data.image_path]).catch(() => {});
            }
            const { error } = await supabase.from('resumes').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // ── Storage ───────────────────────────────────────────────────────────────
    storage: {
        uploadFile: async (bucket, file, path) => {
            const filePath = path ?? `${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
            if (error) throw error;
            return filePath;
        },

        getSignedUrl: async (bucket, path, expiresIn = 3600) => {
            const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
            if (error) throw error;
            return data.signedUrl;
        },

        readBlob: async (bucket, path) => {
            const { data, error } = await supabase.storage.from(bucket).download(path);
            if (error) return null;
            return data;
        },

        deleteFile: async (bucket, path) => {
            await supabase.storage.from(bucket).remove([path]);
        },
    },
}));

// ─── Helper: db row → Resume ──────────────────────────────────────────────────
function dbToResume(row: any): Resume {
    return {
        id: row.id,
        companyName: row.company_name ?? '',
        jobTitle: row.job_title ?? '',
        jobDescription: row.job_description ?? '',
        resumePath: row.resume_path ?? '',
        imagePath: row.image_path ?? '',
        feedback: row.feedback ?? undefined,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
    };
}

// ─── Bootstrap auth listener (call once from root) ────────────────────────────
export function initAuthListener() {
    const { setSession, setLoading } = useStore.getState();

    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setLoading(false);
    });
}
