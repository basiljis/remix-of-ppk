import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const useSubscriptionsAnalytics = () => {
  return useQuery({
    queryKey: ["subscriptions-analytics"],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);

      // Fetch all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .gte("created_at", sixMonthsAgo.toISOString());

      if (subsError) throw subsError;

      // Fetch all payment logs
      const { data: payments, error: paymentsError } = await supabase
        .from("payment_logs")
        .select("*")
        .gte("created_at", sixMonthsAgo.toISOString());

      if (paymentsError) throw paymentsError;

      // Calculate monthly revenue
      const monthlyRevenue = new Map<string, number>();
      const monthlySubscriptions = new Map<string, { new: number; renewed: number }>();
      
      subscriptions?.forEach((sub) => {
        const monthKey = format(new Date(sub.created_at!), "yyyy-MM");
        const currentRevenue = monthlyRevenue.get(monthKey) || 0;
        monthlyRevenue.set(monthKey, currentRevenue + Number(sub.amount));

        const currentSubs = monthlySubscriptions.get(monthKey) || { new: 0, renewed: 0 };
        // Считаем подписку новой, если она создана впервые
        const isRenewal = subscriptions.some(
          s => s.user_id === sub.user_id && 
          new Date(s.created_at!) < new Date(sub.created_at!) &&
          s.id !== sub.id
        );
        
        if (isRenewal) {
          currentSubs.renewed += 1;
        } else {
          currentSubs.new += 1;
        }
        monthlySubscriptions.set(monthKey, currentSubs);
      });

      // Generate chart data for last 6 months
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, "yyyy-MM");
        const monthLabel = format(date, "LLL yyyy");
        
        chartData.push({
          month: monthLabel,
          revenue: monthlyRevenue.get(monthKey) || 0,
          newSubscriptions: monthlySubscriptions.get(monthKey)?.new || 0,
          renewedSubscriptions: monthlySubscriptions.get(monthKey)?.renewed || 0,
        });
      }

      // Calculate status distribution
      const statusDistribution = subscriptions?.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate subscription type distribution
      const typeDistribution = subscriptions?.reduce((acc, sub) => {
        const label = sub.subscription_type === "monthly" ? "Месячная" : "Годовая";
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate payment type distribution
      const paymentTypeDistribution = subscriptions?.reduce((acc, sub) => {
        const label = sub.payment_type === "individual" ? "Физ. лицо" : "Юр. лицо";
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate key metrics
      const totalRevenue = subscriptions?.reduce((sum, sub) => sum + Number(sub.amount), 0) || 0;
      const activeSubscriptions = subscriptions?.filter(s => s.status === "active").length || 0;
      const averageCheck = subscriptions?.length ? totalRevenue / subscriptions.length : 0;
      
      const currentMonthSubs = subscriptions?.filter(s => {
        const subDate = new Date(s.created_at!);
        return subDate >= startOfMonth(now) && subDate <= endOfMonth(now);
      }).length || 0;

      const previousMonthSubs = subscriptions?.filter(s => {
        const subDate = new Date(s.created_at!);
        const prevMonth = subMonths(now, 1);
        return subDate >= startOfMonth(prevMonth) && subDate <= endOfMonth(prevMonth);
      }).length || 0;

      const growthRate = previousMonthSubs 
        ? ((currentMonthSubs - previousMonthSubs) / previousMonthSubs) * 100 
        : 0;

      // Calculate MRR (Monthly Recurring Revenue)
      const activeMonthlySubs = subscriptions?.filter(s => 
        s.status === "active" && s.subscription_type === "monthly"
      ) || [];
      
      const activeYearlySubs = subscriptions?.filter(s => 
        s.status === "active" && s.subscription_type === "yearly"
      ) || [];

      const monthlyMRR = activeMonthlySubs.reduce((sum, sub) => sum + Number(sub.amount), 0);
      const yearlyMRR = activeYearlySubs.reduce((sum, sub) => sum + (Number(sub.amount) / 12), 0);
      const totalMRR = monthlyMRR + yearlyMRR;

      // Conversion rate (approved / total requests)
      const { data: requests } = await supabase
        .from("subscription_requests")
        .select("status");

      const totalRequests = requests?.length || 0;
      const approvedRequests = requests?.filter(r => r.status === "approved").length || 0;
      const conversionRate = totalRequests ? (approvedRequests / totalRequests) * 100 : 0;

      return {
        chartData,
        statusDistribution: Object.entries(statusDistribution || {}).map(([name, value]) => ({
          name: name === "active" ? "Активные" : name === "expired" ? "Истекшие" : "Ожидающие",
          value,
        })),
        typeDistribution: Object.entries(typeDistribution || {}).map(([name, value]) => ({
          name,
          value,
        })),
        paymentTypeDistribution: Object.entries(paymentTypeDistribution || {}).map(([name, value]) => ({
          name,
          value,
        })),
        metrics: {
          totalRevenue,
          activeSubscriptions,
          averageCheck,
          growthRate,
          totalMRR,
          conversionRate,
        },
      };
    },
  });
};
