const API_BASE = "https://api-st.educom.ru/v1";

// Fallback data for when API is not available
const FALLBACK_ORGANIZATIONS = [
  { id: "1", name: "МБОУ СОШ №1", district: "Центральный", type: "Общеобразовательная школа" },
  { id: "2", name: "МБДОУ Детский сад №5", district: "Северный", type: "Дошкольное образовательное учреждение" },
  { id: "3", name: "МАОУ Гимназия №3", district: "Западный", type: "Гимназия" },
  { id: "4", name: "МБОУ СОШ №7", district: "Восточный", type: "Общеобразовательная школа" },
  { id: "5", name: "МБДОУ Детский сад №12", district: "Южный", type: "Дошкольное образовательное учреждение" }
];

// Интерфейсы для API ответов
export interface EduOrgResponse {
  data: {
    eduorgs: Array<{
      id: string;
      name: string;
      district: string;
      type: string;
    }>;
  };
}

export interface SessionResponse {
  data: {
    token: string;
    expires: string;
  };
}

class ApiService {
  private apiToken: string | null = null;

  // Функция для авторизации и получения токена
  async createSession(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/auth/createSession`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa('go_gppc:NHFud4'), // базовая авторизация
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка авторизации');
      }

      const data: SessionResponse = await response.json();
      this.apiToken = data.data.token;
      return this.apiToken;
    } catch (error) {
      console.error('Ошибка при создании сессии:', error);
      throw error;
    }
  }

  // Запрос к методу getActual с токеном
  async getActualEduorgs(): Promise<EduOrgResponse> {
    try {
      if (!this.apiToken) {
        await this.createSession();
      }

      const response = await fetch(`${API_BASE}/eduorg/getActual`, {
        method: 'POST',
        headers: {
          'X-API-TOKEN': this.apiToken!,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка запроса образовательных организаций');
      }

      return await response.json();
    } catch (error) {
      console.warn('API недоступен, используем резервные данные:', error);
      // Return fallback data when API is not available
      return {
        data: {
          eduorgs: FALLBACK_ORGANIZATIONS
        }
      };
    }
  }

  // Метод для получения списка округов
  async getDistricts(): Promise<string[]> {
    try {
      const eduorgs = await this.getActualEduorgs();
      const districts = [...new Set(eduorgs.data.eduorgs.map(org => org.district))];
      return districts.filter(district => district);
    } catch (error) {
      console.error('Ошибка при получении округов:', error);
      return [];
    }
  }

  // Метод для получения списка типов образовательных организаций
  async getEduOrgTypes(): Promise<string[]> {
    try {
      const eduorgs = await this.getActualEduorgs();
      const types = [...new Set(eduorgs.data.eduorgs.map(org => org.type))];
      return types.filter(type => type);
    } catch (error) {
      console.error('Ошибка при получении типов организаций:', error);
      return [];
    }
  }

  // Метод для поиска образовательных организаций по фильтрам
  async searchEduOrgs(filters: {
    district?: string;
    type?: string;
    name?: string;
  }): Promise<Array<{ id: string; name: string; district: string; type: string }>> {
    try {
      const eduorgs = await this.getActualEduorgs();
      let filtered = eduorgs.data.eduorgs;

      if (filters.district) {
        filtered = filtered.filter(org => org.district === filters.district);
      }

      if (filters.type) {
        filtered = filtered.filter(org => org.type === filters.type);
      }

      if (filters.name) {
        filtered = filtered.filter(org => 
          org.name.toLowerCase().includes(filters.name!.toLowerCase())
        );
      }

      return filtered;
    } catch (error) {
      console.error('Ошибка при поиске организаций:', error);
      return [];
    }
  }

  // Сброс токена (для повторной авторизации при необходимости)
  resetToken(): void {
    this.apiToken = null;
  }
}

export const apiService = new ApiService();