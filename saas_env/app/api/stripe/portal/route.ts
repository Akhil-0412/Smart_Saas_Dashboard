import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-12-15.clover" as any,
    typescript: true,
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const subscription = await prisma.subscription.findUnique({
            where: {
                userId: userId,
            }
        });

        if (!subscription?.stripeCustomerId) {
            return new NextResponse("No subscription found", { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
        });

        return NextResponse.redirect(session.url);
    } catch (error) {
        console.error("[STRIPE_PORTAL_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
