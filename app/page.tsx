import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-foreground">Group Savings</h1>
            <div className="space-x-2">
              <Button variant="outline" className="text-primary-foreground" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-bold">Manage Your Group Savings</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              A secure platform for tracking deposits, managing withdrawals, and monitoring your group's financial
              progress.
            </p>
            <Button size="lg" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </section>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Key Features</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">Deposit Management</h3>
                <p className="text-muted-foreground">Upload and track deposit receipts with verification workflow.</p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">Financial Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor balances and view contribution history with detailed analytics.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">Withdrawal Management</h3>
                <p className="text-muted-foreground">
                  Request and approve withdrawals with a secure dual approval system.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Group Savings Management. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
