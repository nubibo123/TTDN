import { fetchApi, postApi, putApi, deleteApi } from '@/lib/api';

export interface AdmissionScore {
    id?: string;
    year: number;
    method: string;
    score: number;
    note?: string;
    url?: string;
    majorId: string;
    majorCode?: string;
    majorName?: string;
    universityId?: string;
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

export const admissionScoreService = {
    getAllScores: async (
        page: number = 0,
        size: number = 10,
        keyword: string = '',
        year?: number,
        method?: string,
        universityId?: string,
    ): Promise<Page<AdmissionScore>> => {
        const items = await fetchApi<AdmissionScore[]>('/admission-scores');
        const kw = keyword.trim().toLowerCase();
        const filtered = items.filter(item => (!universityId || item.universityId === universityId) && (!year || item.year === year) && (!method || item.method === method) && [item.majorName, item.universityName, item.method].some(value => value?.toLowerCase().includes(kw)));
        return { content: filtered.slice(page * size, (page + 1) * size), pageable: { pageNumber: page, pageSize: size }, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size), size, number: page };
    },

    getScoreById: async (id: string): Promise<AdmissionScore> => {
        return fetchApi<AdmissionScore>(`/admission-scores/${id}`);
    },

    createScore: async (data: AdmissionScore): Promise<AdmissionScore> => {
        return postApi<AdmissionScore>('/admin/admission-scores', data);
    },

    updateScore: async (id: string, data: AdmissionScore): Promise<AdmissionScore> => {
        return putApi<AdmissionScore>(`/admin/admission-scores/${id}`, data);
    },

    deleteScore: async (id: string): Promise<string> => {
        return deleteApi<string>(`/admin/admission-scores/${id}`);
    }
};