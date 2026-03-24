import { log } from "console";

interface PhoneSpecs {
    id: string;
    name: string;
    brand: string;
    model: string;
    image?: string;
    specs: {
        display?: {
            size?: string;
            resolution?: string;
            type?: string;
            refresh_rate?: string;
        };
        performance?: {
            processor?: string;
            ram?: string;
            storage?: string;
            gpu?: string;
        };
        camera?: {
            main?: string;
            front?: string;
            video?: string;
        };
        battery?: {
            capacity?: string;
            charging?: string;
            wireless?: string;
        };
        design?: {
            dimensions?: string;
            weight?: string;
            materials?: string;
            colors?: string[];
        };
        connectivity?: {
            network?: string;
            wifi?: string;
            bluetooth?: string;
            gps?: string;
        };
        software?: {
            os?: string;
            ui?: string;
        };
    };
    price?: {
        current?: number;
        currency?: string;
        availability?: string;
    };
}

interface Brand {
  brandValue: string;
}

interface SearchResponse {
    phones: PhoneSpecs[];
    total: number;
    page: number;
    limit: number;
}

interface BrandModel {
    modelValue: string;
}

class PhoneAPIClient {
    private apiKey: string;
    private baseUrl = 'https://mobile-phone-specs-database.p.rapidapi.com/gsm';
    private headers: HeadersInit;

    constructor() {
        this.apiKey = process.env.RAPIDAPI_KEY || '';
        this.headers = {
            'X-RapidAPI-Host': 'mobile-phone-specs-database.p.rapidapi.com',
            'X-RapidAPI-Key': this.apiKey
        };
    }

    private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        try {
            if (!this.apiKey) {
                throw new Error('RapidAPI key not configured. Please set RAPIDAPI_KEY environment variable.');
            }

            const url = new URL(`${this.baseUrl}${endpoint}`);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
            }
            console.log('Making API request to:', url.toString());
            const response = await fetch(url.toString(), {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error in makeRequest:', error);
            throw error;
        }
    }

      async getBrands(): Promise<Brand[]> {
    try {
      const brands = await this.makeRequest<Brand[]>('/all-brands');
      return brands;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

    async getPhonesByBrand(brandId: string, page: number = 1, limit: number = 50): Promise<BrandModel[]> {
        try {
            const response = await this.makeRequest<BrandModel[]>(`/get-models-by-brandname/${encodeURIComponent(brandId)}`);
            console.log(`Fetched phones for brand ${brandId}:`, response);
            return response;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.stack : String(error);
            console.error(`Error fetching phones for brand ${brandId}:`, errorMessage);
            throw error;
        }
    }

    async searchPhones(query: string, page: number = 1, limit: number = 20): Promise<SearchResponse> {
        try {
            const response = await this.makeRequest<SearchResponse>('/search', {
                query,
                page: page.toString(),
                limit: limit.toString()
            });
            return response;
        } catch (error) {
            console.error(`Error searching phones for "${query}":`, error);
            throw error;
        }
    }

    async getPhoneDetails(phoneId: string): Promise<PhoneSpecs> {
        try {
            const response = await this.makeRequest<PhoneSpecs>(`/phone/${phoneId}`);
            return response;
        } catch (error) {
            console.error(`Error fetching phone details for ${phoneId}:`, error);
            throw error;
        }
    }

    async getPhoneDetailsByBrandModel(brand: string, model: string): Promise<PhoneSpecs> {
        try {
            const response = await this.makeRequest<PhoneSpecs>(
                `/get-specifications-by-brandname-modelname/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`
            );
            return response;
        } catch (error) {
            console.error(`Error fetching phone details for brand=${brand} model=${model}:`, error);
            throw error;
        }
    }

    async downloadAllPhones(): Promise<PhoneSpecs[]> {
        const allPhones: PhoneSpecs[] = [];
        let page = 1;
        const limit = 100; // Maximum allowed per request

        try {
            while (true) {
                console.log(`Downloading page ${page}...`);
                const response = await this.makeRequest<SearchResponse>('/search', {
                    page: page.toString(),
                    limit: limit.toString()
                });

                if (response.phones.length === 0) {
                    break; // No more phones
                }

                allPhones.push(...response.phones);
                console.log(`Downloaded ${response.phones.length} phones from page ${page}`);

                if (response.phones.length < limit) {
                    break; // Last page
                }

                page++;

                // Add delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`Total phones downloaded: ${allPhones.length}`);
            return allPhones;
        } catch (error) {
            console.error('Error downloading all phones:', error);
            throw error;
        }
    }

    async downloadBrandPhones(brandId: string): Promise<PhoneSpecs[]> {
        const allPhones: PhoneSpecs[] = [];
        let page = 1;
        const limit = 50;

        try {
            while (true) {
                console.log(`Downloading ${brandId} phones page ${page}...`);
                const response = await this.getPhonesByBrand(brandId, page, limit);
                console.log(response)
                if (response.phones.length === 0) {
                    break;
                }

                allPhones.push(...response.phones);
                console.log(`Downloaded ${response.phones.length} phones from page ${page}`);

                if (response.phones.length < limit) {
                    break;
                }

                page++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`Total ${brandId} phones downloaded: ${allPhones.length}`);
            return allPhones;
        } catch (error) {
            console.error(`Error downloading ${brandId} phones:`, error);
            throw error;
        }
    }
}

export const phoneAPIClient = new PhoneAPIClient();
export type { PhoneSpecs, Brand, SearchResponse }; 