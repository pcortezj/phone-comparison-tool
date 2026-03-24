interface PhoneSpecs {
  id: string;
  name: string;
  brand: string;
  model: string;
  image?: string;
  specs?: {
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
  specifications?: unknown;
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
    if (!this.apiKey) {
      throw new Error('RapidAPI key not configured. Please set RAPIDAPI_KEY environment variable.');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.headers,
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  }

  async getBrands(): Promise<Brand[]> {
    return this.makeRequest<Brand[]>('/all-brands');
  }

  async getPhonesByBrand(brandName: string): Promise<BrandModel[]> {
    return this.makeRequest<BrandModel[]>(`/get-models-by-brandname/${encodeURIComponent(brandName)}`);
  }

  async getPhoneDetailsByBrandModel(brand: string, model: string): Promise<PhoneSpecs> {
    return this.makeRequest<PhoneSpecs>(
      `/get-specifications-by-brandname-modelname/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`
    );
  }

  async searchPhones(query: string, page: number = 1, limit: number = 20): Promise<SearchResponse> {
    return this.makeRequest<SearchResponse>('/search', {
      query,
      page: page.toString(),
      limit: limit.toString()
    });
  }

  async downloadAllPhones(): Promise<PhoneSpecs[]> {
    const allPhones: PhoneSpecs[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const response = await this.makeRequest<SearchResponse>('/search', {
        page: page.toString(),
        limit: limit.toString()
      });

      if (!response.phones?.length) {
        break;
      }

      allPhones.push(...response.phones);

      if (response.phones.length < limit) {
        break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return allPhones;
  }

  async downloadBrandPhones(brandName: string): Promise<PhoneSpecs[]> {
    const models = await this.getPhonesByBrand(brandName);

    return models.map((model) => ({
      id: `${encodeURIComponent(brandName)}::${encodeURIComponent(model.modelValue)}`,
      name: `${brandName} ${model.modelValue}`,
      brand: brandName,
      model: model.modelValue,
      image: 'https://via.placeholder.com/300x400?text=Phone+Image'
    }));
  }
}

export const phoneAPIClient = new PhoneAPIClient();
export type { PhoneSpecs, Brand, SearchResponse, BrandModel };
