import { fetchApi, postApi, putApi, deleteApi } from '@/lib/api';

export interface ForumThread {
    id?: string;
    authorId?: string;
    authorName?: string;
    categoryId: string;
    categoryName?: string;
    title: string;
    content: string;
    viewsCount?: number;
    isPinned?: boolean;
    isLocked?: boolean;
    createdAt?: string;
    replyCount?: number;
}

export interface ModerationResult {
    label: 'allow' | 'off_topic' | 'spam' | 'abusive' | 'needs_review';
    reason: string;
    model: string;
}

export interface UpdateThreadRequest {
    title?: string;
    content?: string;
    categoryId?: string;
    isPinned?: boolean;
    isLocked?: boolean;
}

export const forumThreadService = {
    moderateThread: async (id: string): Promise<ModerationResult> => {
        return postApi<ModerationResult>(`/admin/forum-threads/${encodeURIComponent(id)}/moderate`, {});
    },

    getAllThreads: async (categoryId?: string): Promise<ForumThread[]> => {
        const qs = categoryId ? `?categoryId=${categoryId}` : '';
        return fetchApi<ForumThread[]>(`/forum-threads${qs}`);
    },

    getThreadById: async (id: string): Promise<ForumThread> => {
        return fetchApi<ForumThread>(`/forum-threads/${id}`);
    },

    updateThread: async (id: string, data: UpdateThreadRequest): Promise<ForumThread> => {
        return putApi<ForumThread>(`/admin/forum-threads/${id}`, data);
    },

    deleteThread: async (id: string, banAuthor = false): Promise<string> => {
        return deleteApi<string>(`/admin/forum-threads/${encodeURIComponent(id)}${banAuthor ? "?banAuthor=true" : ""}`);
    },
};
