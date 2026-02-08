import { ViewMode } from "@/components/AdminViewSwitcher";

// Test data for different user types simulation
export interface TestUserProfile {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  organization?: string;
  region?: string;
}

export interface TestChild {
  id: string;
  full_name: string;
  birth_date: string;
  gender: string;
  education_level: string;
  class_or_group: string;
}

export interface TestProtocol {
  id: string;
  child_name: string;
  status: string;
  education_level: string;
  created_at: string;
  consultation_type: string;
}

export interface TestSession {
  id: string;
  child_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  session_type: string;
}

export interface TestEmployee {
  id: string;
  full_name: string;
  position: string;
  email: string;
  is_blocked: boolean;
}

export interface AdminTestData {
  profile: TestUserProfile;
  children: TestChild[];
  protocols: TestProtocol[];
  sessions: TestSession[];
  employees: TestEmployee[];
}

const testChildren: TestChild[] = [
  {
    id: "test-child-1",
    full_name: "Иванов Петр Сергеевич",
    birth_date: "2019-05-15",
    gender: "male",
    education_level: "preschool",
    class_or_group: "Старшая группа",
  },
  {
    id: "test-child-2",
    full_name: "Сидорова Анна Михайловна",
    birth_date: "2017-09-22",
    gender: "female",
    education_level: "elementary",
    class_or_group: "2А",
  },
  {
    id: "test-child-3",
    full_name: "Козлов Дмитрий Александрович",
    birth_date: "2015-03-10",
    gender: "male",
    education_level: "middle",
    class_or_group: "5Б",
  },
];

const testProtocols: TestProtocol[] = [
  {
    id: "test-protocol-1",
    child_name: "Иванов Петр Сергеевич",
    status: "completed",
    education_level: "preschool",
    created_at: new Date().toISOString(),
    consultation_type: "primary",
  },
  {
    id: "test-protocol-2",
    child_name: "Сидорова Анна Михайловна",
    status: "draft",
    education_level: "elementary",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    consultation_type: "secondary",
  },
  {
    id: "test-protocol-3",
    child_name: "Козлов Дмитрий Александрович",
    status: "completed",
    education_level: "middle",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    consultation_type: "primary",
  },
];

const testSessions: TestSession[] = [
  {
    id: "test-session-1",
    child_name: "Иванов Петр Сергеевич",
    scheduled_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "09:45",
    status: "planned",
    session_type: "individual",
  },
  {
    id: "test-session-2",
    child_name: "Сидорова Анна Михайловна",
    scheduled_date: new Date().toISOString().split("T")[0],
    start_time: "10:00",
    end_time: "10:45",
    status: "planned",
    session_type: "individual",
  },
  {
    id: "test-session-3",
    child_name: "Группа 1",
    scheduled_date: new Date().toISOString().split("T")[0],
    start_time: "11:00",
    end_time: "12:00",
    status: "planned",
    session_type: "group",
  },
];

const testEmployees: TestEmployee[] = [
  {
    id: "test-emp-1",
    full_name: "Петрова Елена Ивановна",
    position: "Педагог-психолог",
    email: "petrova@test.org",
    is_blocked: false,
  },
  {
    id: "test-emp-2",
    full_name: "Смирнов Алексей Владимирович",
    position: "Логопед",
    email: "smirnov@test.org",
    is_blocked: false,
  },
  {
    id: "test-emp-3",
    full_name: "Кузнецова Мария Андреевна",
    position: "Дефектолог",
    email: "kuznetsova@test.org",
    is_blocked: false,
  },
  {
    id: "test-emp-4",
    full_name: "Волков Иван Петрович",
    position: "Социальный педагог",
    email: "volkov@test.org",
    is_blocked: true,
  },
];

export function getTestDataForViewMode(viewMode: ViewMode): AdminTestData {
  switch (viewMode) {
    case "specialist":
      return {
        profile: {
          full_name: "Тестовый Специалист Организации",
          email: "specialist@test.org",
          phone: "+7 (999) 123-45-67",
          position: "Педагог-психолог",
          organization: "ГБОУ Школа №1234",
          region: "Москва",
        },
        children: testChildren,
        protocols: testProtocols,
        sessions: testSessions,
        employees: [],
      };

    case "parent":
      return {
        profile: {
          full_name: "Тестовый Родитель",
          email: "parent@test.ru",
          phone: "+7 (999) 987-65-43",
          position: "Родитель",
          region: "Москва",
        },
        children: testChildren.slice(0, 2),
        protocols: [],
        sessions: [],
        employees: [],
      };

    case "private":
      return {
        profile: {
          full_name: "Тестовый Частный Специалист",
          email: "private@test.ru",
          phone: "+7 (999) 555-44-33",
          position: "Логопед",
          region: "Москва",
        },
        children: testChildren.slice(0, 1),
        protocols: [],
        sessions: testSessions.slice(0, 2),
        employees: [],
      };

    case "org_admin":
      return {
        profile: {
          full_name: "Тестовый Админ Организации",
          email: "org-admin@test.org",
          phone: "+7 (999) 111-22-33",
          position: "Администратор",
          organization: "ГБОУ Школа №1234",
          region: "Москва",
        },
        children: testChildren,
        protocols: testProtocols,
        sessions: testSessions,
        employees: testEmployees,
      };

    case "director":
      return {
        profile: {
          full_name: "Тестовый Директор",
          email: "director@test.org",
          phone: "+7 (999) 000-11-22",
          position: "Директор",
          organization: "ГБОУ Школа №1234",
          region: "Москва",
        },
        children: testChildren,
        protocols: testProtocols,
        sessions: testSessions,
        employees: testEmployees,
      };

    default:
      return {
        profile: {
          full_name: "Тестовый Пользователь",
          email: "user@test.org",
          phone: "+7 (999) 000-00-00",
          position: "Пользователь",
        },
        children: [],
        protocols: [],
        sessions: [],
        employees: [],
      };
  }
}

export function useAdminTestData(viewMode: ViewMode, isTestMode: boolean) {
  if (!isTestMode) {
    return null;
  }

  return getTestDataForViewMode(viewMode);
}
