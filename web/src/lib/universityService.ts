import { fetchApi, postApi, putApi, deleteApi } from '@/lib/api';

export interface University {
    id?: string;
    code: string;
    name: string;
    address?: string;
    logoUrl?: string;
    description?: string;
    region?: 'NORTH' | 'CENTRAL' | 'SOUTH';
    type?: 'PUBLIC' | 'PRIVATE' | 'NATIONAL' | 'INTERNATIONAL';
    websiteUrl?: string;
    tuitionRange?: string;
    isVerified?: boolean;
    deanUrl?: string;
    latitude?: number;
    longitude?: number;
}

export interface Page<T> {
    content: T[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export const universityService = {
    getAllUniversities: async (
        page: number = 0,
        size: number = 10,
        keyword: string = '',
        region?: string,
        type?: string,
    ): Promise<Page<University>> => {
        const items = await fetchApi<University[]>('/universities');
        const kw = keyword.trim().toLowerCase();
        const filtered = items.filter(item => (!region || item.region === region) && (!type || item.type === type) && [item.code, item.name, item.address].some(value => value?.toLowerCase().includes(kw)));
        return { content: filtered.slice(page * size, (page + 1) * size), pageable: { pageNumber: page, pageSize: size }, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size), size, number: page };
    },

    getUniversityById: async (id: string): Promise<University> => {
        return fetchApi<University>(`/universities/${id}`);
    },

    createUniversity: async (data: University): Promise<University> => {
        return postApi<University>('/universities', data);
    },

    updateUniversity: async (id: string, data: University): Promise<University> => {
        return putApi<University>(`/universities/${id}`, data);
    },

    deleteUniversity: async (id: string): Promise<string> => {
        return deleteApi<string>(`/universities/${id}`);
    }
};