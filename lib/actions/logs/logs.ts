"use server";

import { db } from "@/lib/db";
import { logs, users } from "@/db/schema";
import { and, eq, desc, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {  parseISO } from "date-fns";

const logFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
});

export interface LogEntry {
  id: number;
  userId: string;
  action: string;
  details: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
    picture: string | null;
  } | null;
}

const PAGE_SIZE = 10;

export async function getLogs(
  filters: z.infer<typeof logFilterSchema>,
  isManagerOrAdmin: boolean,
  currentUserId: string,
): Promise<{ logs: LogEntry[]; totalCount: number } | { error: string }> {
  try {
    const { userId, action, startDate, endDate, page } = filters;
    const pageNum = parseInt(page || '1', 10);
    const offset = (pageNum - 1) * PAGE_SIZE;

    const conditions = [];

    if (isManagerOrAdmin && userId && userId !== 'all') {
      conditions.push(eq(logs.userId, userId));
    } else if (!isManagerOrAdmin || userId === 'my') {
      conditions.push(eq(logs.userId, currentUserId));
    }

    if (action && action !== 'all') {
      conditions.push(eq(logs.action, action));
    }
    if (startDate) {
      conditions.push(gte(logs.createdAt, parseISO(startDate)));
    }
    if (endDate) {
      conditions.push(lte(logs.createdAt, endOfDay(parseISO(endDate))));
    }

    const logQuery = db
      .select({
        id: logs.id,
        userId: logs.userId,
        action: logs.action,
        details: logs.details,
        createdAt: logs.createdAt,
        user: {
          name: users.name,
          email: users.email,
          picture: users.picture,
        },
      })
      .from(logs)
      .leftJoin(users, eq(logs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(logs.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(logs)
      .where(and(...conditions));

    const [logEntries, [totalCountResult]] = await Promise.all([
      logQuery,
      countQuery,
    ]);

    const typedLogs = logEntries.map(log => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      user: log.user || { name: 'Unknown', email: null, picture: null },
    }));
    
    return { logs: typedLogs, totalCount: totalCountResult.count };
  } catch (error) {
    console.error("Error fetching logs:", error);
    return { error: "Failed to fetch logs" };
  }
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}