import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDuties, fetchStaffByPhone } from "@/services/adminApi";
import { normalizeDepartment, parseDutyDescription } from "@/lib/dutyMeta";

interface DutyTimingItem {
  id: string;
  startDate: string;
  endDate: string;
  timeLabel: string;
  profileName: string;
  dutyContent: string;
}

const WorkersDashboard = () => {
  const { user } = useAuth();
  const [dutyTimings, setDutyTimings] = useState<DutyTimingItem[]>([]);
  const [loadingDutyTimings, setLoadingDutyTimings] = useState(false);

  useEffect(() => {
    loadDutyTimings();
  }, [user?.username]);

  async function loadDutyTimings() {
    try {
      setLoadingDutyTimings(true);

      let duties: any[] = [];
      const username = user?.username || "";
      const isPhoneLogin = /^\d{10}$/.test(username);

      if (isPhoneLogin) {
        const staff = await fetchStaffByPhone(username);
        duties = await fetchDuties({ staff_id: staff.id, status: "All" });
      } else {
        duties = await fetchDuties({ status: "All" });
      }

      const moduleDuties = duties
        .filter((duty) => {
          const parsed = parseDutyDescription(duty.description || "");
          const department = normalizeDepartment(duty?.staffs?.department || "");
          const moduleName = normalizeDepartment(parsed.module || department);
          return moduleName === "Workers";
        })
        .map((duty) => {
          const parsed = parseDutyDescription(duty.description || "");
          const timeLabel =
            parsed.dutyStartTime && parsed.dutyEndTime
              ? `${parsed.dutyStartTime} - ${parsed.dutyEndTime}`
              : "Timing not set";

          return {
            id: duty.id,
            startDate: duty.assigned_date || "",
            endDate: duty.deadline || "",
            timeLabel,
            profileName: duty?.staffs?.full_name || "Unknown Profile",
            dutyContent: parsed.cleanDescription || duty.duty_title || "Assigned duty",
          };
        })
        .sort((a, b) => ((a.startDate || a.endDate) < (b.startDate || b.endDate) ? 1 : -1));

      setDutyTimings(moduleDuties);
    } catch (error) {
      console.error("Failed loading worker duty timings:", error);
      setDutyTimings([]);
    } finally {
      setLoadingDutyTimings(false);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workers Dashboard</h1>
            <p className="text-muted-foreground">Assigned duties from admin</p>
          </div>
        </motion.div>

        <Card className="glass-panel border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Assigned Duties</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDutyTimings ? (
              <p className="text-sm text-muted-foreground">Loading assigned duties...</p>
            ) : dutyTimings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assigned duties found.</p>
            ) : (
              <div className="space-y-3">
                {dutyTimings.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/80 bg-gradient-to-r from-background to-accent/10 px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-foreground">{item.profileName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.dutyContent}</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <div className="rounded-md bg-muted/50 px-2 py-1">
                        <span className="font-medium text-foreground">Timing:</span> {item.timeLabel}
                      </div>
                      <div className="rounded-md bg-muted/50 px-2 py-1">
                        <span className="font-medium text-foreground">From:</span>{" "}
                        {item.startDate ? new Date(item.startDate).toLocaleDateString("en-IN") : "-"}
                      </div>
                      <div className="rounded-md bg-muted/50 px-2 py-1">
                        <span className="font-medium text-foreground">To:</span>{" "}
                        {item.endDate ? new Date(item.endDate).toLocaleDateString("en-IN") : "-"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default WorkersDashboard;
