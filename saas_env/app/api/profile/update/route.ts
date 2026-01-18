
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { firstName, lastName, phone, imageUrl } = body;

        const updatedProfile = await prisma.profile.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phone,
                imageUrl
            }
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId,
                action: "UPDATE_PROFILE",
                details: "User updated their profile settings."
            }
        });

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
