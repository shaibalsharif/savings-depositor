import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { eq, and, gte, lte, isNull } from "drizzle-orm"
import { format, startOfMonth, subMonths, addMonths, parse } from "date-fns"
import { deposits, depositSettings } from "@/db/schema/logs"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const today = new Date()
    const currentMonthStart = startOfMonth(today)
    const currentMonthStr = format(currentMonthStart, "yyyy-MM")

    // Get minimum effective month from deposit settings
    const settings = await db
      .select({ effectiveMonth: depositSettings.effectiveMonth })
      .from(depositSettings)
      .where(isNull(depositSettings.terminatedAt))

    if (!settings.length) {
      return NextResponse.json({ error: "No deposit settings found" }, { status: 500 })
    }

    const minEffectiveMonth = settings.reduce((min, curr) => {
      return curr.effectiveMonth < min ? curr.effectiveMonth : min
    }, settings[0].effectiveMonth)
    const minEffectiveDate = parse(minEffectiveMonth + "-01", "yyyy-MM-dd", new Date())

    // Generate range for DB query: only needed for ±6 months
    const rangeStartDate = subMonths(currentMonthStart, 6)
    const rangeEndDate = addMonths(currentMonthStart, 6)
    const rangeStart = format(rangeStartDate, "yyyy-MM")
    const rangeEnd = format(rangeEndDate, "yyyy-MM")

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

    const getMonthString = (offset: number) =>
      format(addMonths(currentMonthStart, offset), "yyyy-MM")

    const results: Array<{ month: string; status: string; rejected?: boolean }> = []

    const allRejected = (deposits: typeof userDeposits) =>
      deposits.every((d) => d.status === "rejected")

    // Current month
    const currentDeposits = depositsByMonth.get(currentMonthStr)
    if (!currentDeposits) {
      results.push({ month: currentMonthStr, status: "current" })
    } else if (allRejected(currentDeposits)) {
      results.push({ month: currentMonthStr, status: "current", rejected: true })
    }

    // Previous 6 months
    for (let i = -6; i < 0; i++) {
      const monthStr = getMonthString(i)
      const monthDate = parse(monthStr + "-01", "yyyy-MM-dd", new Date())

      // Skip if before effectiveMonth
      if (monthDate < minEffectiveDate) continue

      const depositsForMonth = depositsByMonth.get(monthStr)
      if (!depositsForMonth) {
        results.push({ month: monthStr, status: "due" })
      } else if (allRejected(depositsForMonth)) {
        results.push({ month: monthStr, status: "due", rejected: true })
      }
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
    }

    // Sort by month ascending
    results.sort((a, b) => {
      const dateA = new Date(a.month + "-01")
      const dateB = new Date(b.month + "-01")
      return dateA.getTime() - dateB.getTime()
    })

    return NextResponse.json({ months: results })
  } catch (error) {
    console.error("Error fetching deposit months:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
