import { fetchApi, postApi, putApi, deleteApi } from '@/lib/api';

export interface Major {
    id?: string;
    code: string;
    name: string;
    subjectGroup?: string;
    description?: string;
    universityId: string;
    universityName?: string;
}

export interface Page<T> {
    content: T[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export const majorService = {
    getAllMajors: async (
        page: number = 0,
        size: number = 10,
        keyword: string = '',
        universityId?: string,
    ): Promise<Page<Major>> => {
        const items = await fetchApi<Major[]>('/majors');
        const kw = keyword.trim().toLowerCase();
        const filtered = items.filter(item => (!universityId || item.universityId === universityId) && [item.code, item.name, item.universityName].some(value => value?.toLowerCase().includes(kw)));
        return { content: filtered.slice(page * size, (page + 1) * size), pageable: { pageNumber: page, pageSize: size }, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size), size, number: page };
    },

    getMajorById: async (id: string): Promise<Major> => {
        return fetchApi<Major>(`/majors/${id}`);
    },

    createMajor: async (data: Major): Promise<Major> => {
        return postApi<Major>('/admin/majors', data);
    },

    updateMajor: async (id: string, data: Major): Promise<Major> => {
        return putApi<Major>(`/admin/majors/${id}`, data);
    },

    deleteMajor: async (id: string): Promise<string> => {
        return deleteApi<string>(`/admin/majors/${id}`);
    }
};