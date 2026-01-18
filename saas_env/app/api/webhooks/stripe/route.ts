import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-12-15.clover" as any, // Cast to any to avoid type check issues with latest versions
    typescript: true,
});

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session?.metadata?.userId) {
            return new NextResponse("User id is required", { status: 400 });
        }

        await prisma.subscription.upsert({
            where: {
                userId: session.metadata.userId,
            },
            update: { // If subscription exists, update it (e.g. they re-subscribed)
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                planId: subscription.items.data[0].plan.id,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                status: subscription.status,
            },
            create: {
                userId: session.metadata.userId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                planId: subscription.items.data[0].plan.id,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                status: subscription.status,
            },
        });

        // Optional: Send welcome email here
    }

    if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        const subscriptionInDb = await prisma.subscription.findUnique({
            where: {
                stripeSubscriptionId: subscription.id,
            },
        });

        if (subscriptionInDb) {
            await prisma.subscription.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    planId: subscription.items.data[0].plan.id,
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    status: subscription.status,
                },
            });
        }
    }

    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
        const subscription = await stripe.subscriptions.retrieve(
            (event.data.object as Stripe.Subscription).id
        );

        const subscriptionInDb = await prisma.subscription.findUnique({
            where: {
                stripeSubscriptionId: subscription.id,
            }
        });

        if (subscriptionInDb) {
            await prisma.subscription.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    status: subscription.status,
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                }
            });
        }
    }

    return new NextResponse(null, { status: 200 });
}
