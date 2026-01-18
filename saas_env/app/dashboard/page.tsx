import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { AuditLogTable } from "@/components/AuditLogTable";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Activity, Wrench, Car, Sparkles, ArrowRight, Bot, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    const profile = await prisma.profile.upsert({
        where: { id: userId },
        update: { email: email || "" },
        create: {
            id: userId,
            email: email || "",
            role: 'user'
        },
        include: { subscription: true }
    });

    const isPro = profile.subscription?.status === 'active';
    const isAdmin = profile.role === 'admin';
    const subscription = profile.subscription;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vehicle Command Center</h1>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Vehicle Command Center
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                        Welcome back, {user?.firstName}. Your fleet status is <span className="text-primary font-bold">Good</span>.
                    </p>
                </div>
                {isPro && (
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Premium Member
                    </div>
                )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* AI Mechanic Card - Featured */}
                <Link href="/dashboard/advisor" className="group">
                    <Card className="h-full border-2 border-primary/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-card to-primary/5 cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                                Sparky ⚡
                            </CardTitle>
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <Bot className="h-7 w-7" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold mb-1">AI Advisor</div>
                            <p className="text-base text-muted-foreground">
                                Diagnose sounds, estimate repairs, and get DIY guides instantly.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Garage Card */}
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">My Garage</CardTitle>
                        <Car className="h-8 w-8 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1">1 Vehicle</div>
                        <p className="text-sm text-muted-foreground mb-4">
                            2018 Toyota Camry
                        </p>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[85%]" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Health Score: 85%</p>
                    </CardContent>
                </Card>

                {/* Plan Status Card */}
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">Plan Status</CardTitle>
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1 capitalize">
                            {subscription?.status === 'active' ? 'Pro Plan' : 'Free Tier'}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {subscription?.status === 'active'
                                ? 'Unlimited AI Diagnostics enabled.'
                                : 'Upgrade to unlock advanced repair guides.'}
                        </p>
                        {/* Usage Meter */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span>Daily Queries</span>
                                <span>{subscription?.status === 'active' ? '∞' : '3 / 5'}</span>
                            </div>
                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${subscription?.status === 'active' ? 'bg-primary' : 'bg-yellow-500'} w-[${subscription?.status === 'active' ? '100%' : '60%'}] transition-all duration-1000`}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <Link href="/dashboard/billing" className="w-full">
                                <Button variant="outline" className="w-full">Manage Subscription</Button>
                            </Link>
                        ) : (
                            <form action="/api/stripe/checkout" method="POST" className="w-full">
                                <Button type="submit" className="w-full">Upgrade to Pro</Button>
                            </form>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {isAdmin && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Admin Controls</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>System Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AuditLogsSection />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

async function AuditLogsSection() {
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { email: true } } }
    });
    return <AuditLogTable logs={logs} />
}
