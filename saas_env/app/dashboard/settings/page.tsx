"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { Loader2, Save, Moon, Sun, User as UserIcon, Phone, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        imageUrl: ""
    });

    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        // Fetch current profile data
        const fetchProfile = async () => {
            try {
                // We'll trust Clerk for initial data if DB is empty, but we should fetch from DB
                // For now, let's just use what we have or fetch from an endpoint if we made one for 'GET'
                // Simplification for this turn: Use Clerk data as defaults
                setFormData({
                    firstName: user?.firstName || "",
                    lastName: user?.lastName || "",
                    phone: "", // Clerk phone is complex object, leave empty for now or fetch from DB
                    imageUrl: user?.imageUrl || ""
                });
            } catch (error) {
                console.error("Failed to load profile", error);
            }
        };

        if (user) fetchProfile();

        // Check current theme
        if (document.documentElement.classList.contains("dark")) {
            setTheme("dark");
        }
    }, [user]);

    const toggleTheme = () => {
        if (theme === "light") {
            document.documentElement.classList.add("dark");
            setTheme("dark");
        } else {
            document.documentElement.classList.remove("dark");
            setTheme("light");
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/profile/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to update");

            router.refresh();
            // Could add toast here
            alert("Profile updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your profile and preferences.</p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Phone Number
                        </Label>
                        <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Profile Picture URL
                        </Label>
                        <Input
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://example.com/avatar.jpg"
                        />
                        <p className="text-xs text-muted-foreground">Paste a direct link to an image.</p>
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 p-6">
                    <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            {/* Appearance Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-yellow-500" />}
                        Appearance
                    </CardTitle>
                    <CardDescription>Customize your workspace theme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                        <div className="space-y-1">
                            <div className="font-medium">Theme Mode</div>
                            <div className="text-sm text-muted-foreground">
                                Switch between Light and Dark mode.
                            </div>
                        </div>
                        <Button variant="outline" onClick={toggleTheme} className="w-32">
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Content Section (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle>Additional Content</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center text-muted-foreground">
                        Custom User Content Area
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
