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

  // NOTE: Direct API calls have been disabled for security reasons.
  // All API interactions should go through the educom-api edge function
  // which securely manages credentials in environment variables.
  
  async getActualEduorgs(): Promise<EduOrgResponse> {
    try {
      console.warn('Direct API access is deprecated. Use educom-api edge function instead.');
      console.log(`Using ${FALLBACK_ORGANIZATIONS.length} fallback organizations`);
      
      // Return fallback data - clients should use the edge function for actual data
      return {
        data: {
          eduorgs: FALLBACK_ORGANIZATIONS
        }
      };
    } catch (error) {
      console.error('Error in getActualEduorgs:', error);
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

  // Legacy method - no longer used
  resetToken(): void {
    this.apiToken = null;
  }
}

export const apiService = new ApiService();
