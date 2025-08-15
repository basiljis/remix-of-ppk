const API_BASE = "https://api-st.educom.ru/v1";

// Enhanced fallback data with more realistic organization count
const FALLBACK_ORGANIZATIONS = Array.from({ length: 150 }, (_, i) => {
  const districts = ["Центральный", "Северный", "Западный", "Восточный", "Южный", "Северо-Западный", "Юго-Восточный"];
  const types = [
    "Общеобразовательная школа", 
    "Дошкольное образовательное учреждение", 
    "Гимназия", 
    "Лицей", 
    "Коррекционная школа",
    "Школа-интернат",
    "Центр развития ребенка"
  ];
  
  const district = districts[i % districts.length];
  const type = types[i % types.length];
  const num = i + 1;
  
  let name = "";
  if (type === "Дошкольное образовательное учреждение") {
    name = `МБДОУ Детский сад №${num}`;
  } else if (type === "Гимназия") {
    name = `МАОУ Гимназия №${num}`;
  } else if (type === "Лицей") {
    name = `МАОУ Лицей №${num}`;
  } else {
    name = `МБОУ ${type === "Общеобразовательная школа" ? "СОШ" : type} №${num}`;
  }
  
  return { 
    id: `org_${num}`, 
    name, 
    district, 
    type 
  };
});

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE}/auth/createSession`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa('go_gppc:NHFud4'), // базовая авторизация
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ошибка авторизации: ${response.status}`);
      }

      const data: SessionResponse = await response.json();
      this.apiToken = data.data.token;
      console.log('Успешная авторизация в ЕКИС API');
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_BASE}/eduorg/getActual`, {
        method: 'POST',
        headers: {
          'X-API-TOKEN': this.apiToken!,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ошибка запроса образовательных организаций: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Получено ${data.data.eduorgs.length} организаций из ЕКИС API`);
      return data;
    } catch (error) {
      console.warn('API недоступен, используем резервные данные:', error);
      console.log(`Используем ${FALLBACK_ORGANIZATIONS.length} резервных организаций`);
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