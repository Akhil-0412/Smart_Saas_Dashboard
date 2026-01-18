import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-12-15.clover" as any, // Cast to any to avoid type issues if types are outdated/swapped
    typescript: true,
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const email = user.emailAddresses[0].emailAddress;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Create a Checkout Session
        const session = await stripe.checkout.sessions.create({
            success_url: `${baseUrl}/dashboard?success=true`,
            cancel_url: `${baseUrl}/dashboard?canceled=true`,
            payment_method_types: ["card"],
            mode: "payment", // Switched to One-Time to avoid complex Recurring/RBI regulations in India
            billing_address_collection: "auto",
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: "Lifetime Pro Access",
                            description: "Unlock all features forever",
                        },
                        unit_amount: 199900, // ₹1,999.00
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: userId,
            },
        });

        return NextResponse.redirect(session.url!);
    } catch (error) {
        console.error("[STRIPE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
