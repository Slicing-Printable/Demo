import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const installerSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.string(),
  match_score: z.number()
});

const jobSchema = z.object({
  job_id: z.string(),
  name: z.string(),
  revenue: z.number(),
  duration_days: z.number(),
  city: z.string()
});

export type Installer = z.infer<typeof installerSchema>;
export type Job = z.infer<typeof jobSchema> & { revenue_bucket: string };

const overrideSchema = z.object({
  job_id: z.string(),
  installer_id: z.string(),
  start_date: z.string()
});

const scheduleItemSchema = z.object({
  job_id: z.string(),
  job_name: z.string(),
  installer_id: z.string(),
  installer_name: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  duration_days: z.number(),
  revenue: z.number(),
  revenue_bucket: z.string()
});

export type ScheduleItem = z.infer<typeof scheduleItemSchema>;
export type Override = z.infer<typeof overrideSchema>;

async function handleResponse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  if (!res.ok) {
    throw new Error(`API request failed with ${res.status}`);
  }
  const json = await res.json();
  return schema.parse(json);
}

export async function fetchInstallers(): Promise<Installer[]> {
  const res = await fetch(`${API_BASE}/installers`, { cache: "no-store" });
  return handleResponse(res, z.array(installerSchema));
}

export async function fetchJobs(query?: string): Promise<Job[]> {
  const url = new URL(`${API_BASE}/jobs`);
  if (query) {
    url.searchParams.set("q", query);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  const jobs = await handleResponse(res, z.array(jobSchema));
  return jobs.map((job) => ({
    ...job,
    revenue_bucket: bucketRevenue(job.revenue)
  }));
}

export async function saveOverrides(overrides: Override[]): Promise<Override[]> {
  const res = await fetch(`${API_BASE}/overrides`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(overrides)
  });
  return handleResponse(res, z.array(overrideSchema));
}

export async function buildSchedule(): Promise<ScheduleItem[]> {
  const res = await fetch(`${API_BASE}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  return handleResponse(res, z.array(scheduleItemSchema));
}

export async function publishToTeams(payload: {
  webhook_url: string;
  title: string;
  lines: string[];
  ics_url: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/teams/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Failed to publish to Teams");
  }
}

export function revenueFormatter(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

export function bucketRevenue(amount: number): string {
  if (amount < 10_000) return "0-10k";
  if (amount < 50_000) return "10-50k";
  if (amount < 100_000) return "50-100k";
  if (amount < 200_000) return "100-200k";
  return "200-300k";
}
