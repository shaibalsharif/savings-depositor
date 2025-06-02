import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { eq, and, gte, lte } from "drizzle-orm"
import { format, startOfMonth, subMonths, addMonths } from "date-fns"
import { deposits } from "@/db/schema/logs"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const today = new Date()
    const currentMonthStart = startOfMonth(today)

    // Prepare month strings for range
    const rangeStart = format(subMonths(currentMonthStart, 6), "yyyy-MM")
    const rangeEnd = format(addMonths(currentMonthStart, 6), "yyyy-MM")
    const currentMonthStr = format(currentMonthStart, "yyyy-MM")

    // Fetch all deposits for user in range
    const userDeposits = await db
      .select()
      .from(deposits)
      .where(
        and(
          eq(deposits.userId, userId),
          gte(deposits.month, rangeStart),
          lte(deposits.month, rangeEnd)
        )
      )

    // Group deposits by month
    const depositsByMonth = new Map<string, typeof userDeposits>()
    for (const deposit of userDeposits) {
      const month = deposit.month
      if (!depositsByMonth.has(month)) {
        depositsByMonth.set(month, [])
      }
      depositsByMonth.get(month)!.push(deposit)
    }

    // Helper to generate month string for i months offset
    const getMonthString = (offset: number) => {
      const date = addMonths(currentMonthStart, offset)
      return format(date, "yyyy-MM")
    }

    const results: Array<{ month: string; status: string; rejected?: boolean }> = []

    // Function to check if all deposits are rejected
    const allRejected = (deposits: typeof userDeposits) =>
      deposits.every((d) => d.status === "rejected")

    // Check current month
    const currentDeposits = depositsByMonth.get(currentMonthStr)
    if (!currentDeposits) {
      // No deposit for current month
      results.push({ month: currentMonthStr, status: "current" })
    } else if (allRejected(currentDeposits)) {
      results.push({ month: currentMonthStr, status: "current", rejected: true })
    }
    // else at least one accepted deposit → skip current month

    // Previous 6 months
    for (let i = -6; i < 0; i++) {
      const monthStr = getMonthString(i)
      const depositsForMonth = depositsByMonth.get(monthStr)
      if (!depositsForMonth) {
        results.push({ month: monthStr, status: "due" })
      } else if (allRejected(depositsForMonth)) {
        results.push({ month: monthStr, status: "due", rejected: true })
      }
      // else accepted deposits exist → skip
    }

    // Next 6 months
    for (let i = 1; i <= 6; i++) {
      const monthStr = getMonthString(i)
      const depositsForMonth = depositsByMonth.get(monthStr)
      if (!depositsForMonth) {
        results.push({ month: monthStr, status: "advance" })
      } else if (allRejected(depositsForMonth)) {
        results.push({ month: monthStr, status: "advance", rejected: true })
      }
      // else accepted deposits exist → skip
    }

    // Sort results by month ascending
    results.sort((a, b) => {
      const dateA = new Date(a.month + "-01") // add day for safe parsing
      const dateB = new Date(b.month + "-01")
      return dateA.getTime() - dateB.getTime()
    })

    return NextResponse.json({ months: results })
  } catch (error) {
    console.error("Error fetching months:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
