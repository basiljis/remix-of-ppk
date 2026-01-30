import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMonths } from "date-fns";
import { sphereRecommendations } from "@/data/developmentTestData";

export interface DevelopmentTest {
  id: string;
  title: string;
  description: string | null;
  slug: string;
}

export interface AgeGroup {
  id: string;
  test_id: string;
  label: string;
  min_months: number;
  max_months: number;
  sort_order: number;
}

export interface Sphere {
  id: string;
  test_id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

export interface DevelopmentTask {
  id: string;
  sphere_id: string;
  age_group_id: string;
  task_text: string;
  age_range_hint: string | null;
  video_demo_title: string | null;
  video_demo_url: string | null;
  allows_media_upload: boolean;
  sort_order: number;
}

export interface TestResult {
  id: string;
  child_id: string;
  parent_user_id: string;
  test_id: string;
  age_group_id: string;
  child_age_months: number;
  answers: any[];
  sphere_scores: Record<string, number>;
  overall_risk_level: string;
  recommendations: any;
  next_test_date: string | null;
  consent_given: boolean;
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
}

export function useDevelopmentTest() {
  const queryClient = useQueryClient();

  // Fetch active test
  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ["development-test"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("child_development_tests" as any)
        .select("*")
        .eq("is_active", true)
        .eq("slug", "child-growth")
        .single() as { data: DevelopmentTest | null; error: any };
      if (error) throw error;
      return data as DevelopmentTest;
    },
  });

  // Fetch age groups
  const { data: ageGroups } = useQuery({
    queryKey: ["development-age-groups", test?.id],
    queryFn: async () => {
      if (!test?.id) return [];
      const { data, error } = await supabase
        .from("development_age_groups" as any)
        .select("*")
        .eq("test_id", test.id)
        .order("sort_order") as { data: AgeGroup[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
    enabled: !!test?.id,
  });

  // Fetch spheres
  const { data: spheres } = useQuery({
    queryKey: ["development-spheres", test?.id],
    queryFn: async () => {
      if (!test?.id) return [];
      const { data, error } = await supabase
        .from("development_spheres" as any)
        .select("*")
        .eq("test_id", test.id)
        .order("sort_order") as { data: Sphere[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
    enabled: !!test?.id,
  });

  // Get age group for child's age
  const getAgeGroupForChild = (birthDate: string | null): AgeGroup | null => {
    if (!birthDate || !ageGroups) return null;
    const ageMonths = differenceInMonths(new Date(), new Date(birthDate));
    return ageGroups.find(
      (g) => ageMonths >= g.min_months && ageMonths < g.max_months
    ) || null;
  };

  // Fetch tasks for age group
  const fetchTasksForAgeGroup = async (ageGroupId: string): Promise<DevelopmentTask[]> => {
    const { data, error } = await supabase
      .from("development_tasks" as any)
      .select("*")
      .eq("age_group_id", ageGroupId)
      .order("sort_order") as { data: DevelopmentTask[] | null; error: any };
    if (error) throw error;
    return data || [];
  };

  // Calculate sphere scores
  const calculateSphereScores = (
    answers: Array<{ task_id: string; answer: string; sphere_id: string }>,
    tasks: DevelopmentTask[],
    spheresList: Sphere[]
  ): Record<string, number> => {
    const scores: Record<string, number> = {};
    
    spheresList.forEach((sphere) => {
      const sphereTasks = tasks.filter((t) => t.sphere_id === sphere.id);
      const sphereAnswers = answers.filter((a) => a.sphere_id === sphere.id);
      
      if (sphereTasks.length === 0) {
        scores[sphere.slug] = 0;
        return;
      }

      let totalScore = 0;
      sphereAnswers.forEach((answer) => {
        if (answer.answer === "yes_easy") totalScore += 1;
        else if (answer.answer === "yes_help") totalScore += 0.5;
        // "no" = 0
      });

      scores[sphere.slug] = Math.round((totalScore / sphereTasks.length) * 100);
    });

    return scores;
  };

  // Calculate risk level
  const calculateRiskLevel = (scores: Record<string, number>): string => {
    const values = Object.values(scores);
    const lowSpheres = values.filter((v) => v < 50).length;
    const normalSpheres = values.filter((v) => v >= 70).length;

    if (normalSpheres >= 4) return "normal";
    if (lowSpheres >= 3) return "help_needed";
    return "attention";
  };

  // Generate recommendations
  const generateRecommendations = (
    scores: Record<string, number>,
    spheresList: Sphere[]
  ) => {
    const weakSpheres = Object.entries(scores)
      .filter(([_, score]) => score < 70)
      .sort((a, b) => a[1] - b[1])
      .map(([slug]) => slug);

    const recommendations = weakSpheres.slice(0, 2).map((slug) => ({
      sphere: slug,
      ...sphereRecommendations[slug],
    }));

    return recommendations;
  };

  // Save result mutation
  const saveResultMutation = useMutation({
    mutationFn: async (params: {
      childId: string;
      parentUserId: string;
      testId: string;
      ageGroupId: string;
      childAgeMonths: number;
      answers: any[];
      sphereScores: Record<string, number>;
      riskLevel: string;
      recommendations: any;
      consentGiven: boolean;
    }) => {
      const nextTestDate = new Date();
      nextTestDate.setMonth(nextTestDate.getMonth() + 3);

      const { data, error } = await supabase
        .from("development_test_results" as any)
        .insert({
          child_id: params.childId,
          parent_user_id: params.parentUserId,
          test_id: params.testId,
          age_group_id: params.ageGroupId,
          child_age_months: params.childAgeMonths,
          answers: params.answers,
          sphere_scores: params.sphereScores,
          overall_risk_level: params.riskLevel,
          recommendations: params.recommendations,
          next_test_date: nextTestDate.toISOString().split("T")[0],
          consent_given: params.consentGiven,
          is_completed: true,
          completed_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-test-results"] });
    },
  });

  return {
    test,
    testLoading,
    ageGroups,
    spheres,
    getAgeGroupForChild,
    fetchTasksForAgeGroup,
    calculateSphereScores,
    calculateRiskLevel,
    generateRecommendations,
    saveResultMutation,
  };
}

// Hook for fetching results
export function useDevelopmentTestResults(parentUserId: string) {
  return useQuery({
    queryKey: ["development-test-results", parentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_test_results" as any)
        .select("*")
        .eq("parent_user_id", parentUserId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false }) as { data: TestResult[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
    enabled: !!parentUserId,
  });
}
