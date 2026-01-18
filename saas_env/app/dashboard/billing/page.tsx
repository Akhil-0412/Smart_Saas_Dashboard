import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check } from "lucide-react";

export default async function BillingPage() {
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

    if (!profile) return null;

    const isPro = profile.subscription?.status === 'active';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground">Manage your plan and payment details.</p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {isPro ? "Pro Plan" : "Free Plan"}
                    </CardTitle>
                    <CardDescription>
                        {isPro
                            ? "You are currently on the Pro plan. Thanks for your support!"
                            : "Upgrade to unlock all features."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Unlimited Projects</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Advanced Analytics</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Priority Support</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    {isPro ? (
                        <form action="/api/stripe/portal" method="POST">
                            <Button type="submit" variant="outline">Manage Subscription</Button>
                        </form>
                    ) : (
                        <form action="/api/stripe/checkout" method="POST">
                            <Button type="submit">Upgrade to Pro ($20/mo)</Button>
                        </form>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
