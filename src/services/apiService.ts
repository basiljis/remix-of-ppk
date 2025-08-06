const API_BASE = "https://api-st.educom.ru/v1";

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
    if (!this.apiToken) {
      await this.createSession();
    }

    try {
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
      console.error('Ошибка при получении образовательных организаций:', error);
      throw error;
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