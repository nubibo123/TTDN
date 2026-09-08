import { fetchApi } from '@/lib/api';

export interface ForumCategory {
    id?: string;
    name: string;
    slug: string;
    displayOrder?: number;
}

export const forumCategoryService = {
    getAllCategories: async (): Promise<ForumCategory[]> => {
        return fetchApi<ForumCategory[]>('/forum-categories');
    },

    getCategoryById: async (id: string): Promise<ForumCategory> => {
        return fetchApi<ForumCategory>(`/forum-categories/${id}`);
    },
};
