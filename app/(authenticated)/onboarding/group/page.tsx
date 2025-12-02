"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Users, Plus, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GroupPage() {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);

  const [accessCode, setAccessCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"join" | "create">("join");

  const validateCode = useQuery(
    api.groups.validateCode,
    accessCode.trim().length > 0 ? { accessCode: accessCode.toLowerCase().trim() } : "skip"
  );
  const joinGroup = useMutation(api.groups.join);
  const createGroup = useMutation(api.groups.create);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  // Check if user already has a group (shouldn't happen, but just in case)
  useEffect(() => {
    if (user?.activeGroupId) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const code = accessCode.toLowerCase().trim();

      if (code.length === 0) {
        toast.error("Please enter a group code");
        setLoading(false);
        return;
      }

      // Validate the code first
      if (validateCode === undefined) {
        toast.error("Checking code...");
        setLoading(false);
        return;
      }

      if (!validateCode.valid) {
        toast.error("Invalid group code. Please check and try again.");
        setLoading(false);
        return;
      }

      // Join the group
      const result = await joinGroup({ accessCode: code });

      // Mark onboarding as complete
      await completeOnboarding();

      toast.success(result.message || "Successfully joined group!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error joining group:", error);
      toast.error(error.message || "Failed to join group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (groupName.trim().length < 3) {
        toast.error("Group name must be at least 3 characters");
        setLoading(false);
        return;
      }

      // Create the group
      const result = await createGroup({
        name: groupName.trim(),
        description: "Our curry rating group"
      });

      // Mark onboarding as complete
      await completeOnboarding();

      toast.success(result.message || "Group created successfully!");
      toast.info(`Your group code is: ${result.accessCode}`, { duration: 10000 });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast.error(error.message || "Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-curry" />
      </div>
    );
  }

  const codeIsValid = validateCode?.valid && accessCode.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center mesh-gradient p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block paper-aged px-8 py-4 rounded-2xl mb-4">
            <h1 className="text-3xl font-bold text-curry mb-2">
              Join Your Curry Group
            </h1>
            <p className="text-spice text-sm">
              Connect with your curry rating crew
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="card-parchment p-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "join" | "create")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="join" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Join Group
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </TabsTrigger>
            </TabsList>

            <TabsContent value="join">
              <form onSubmit={handleJoinGroup} className="space-y-6">
                <div>
                  <Label htmlFor="accessCode" className="text-spice text-base">
                    Group Access Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="accessCode"
                      type="text"
                      placeholder="curry-spice-2025-xk7p"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      required
                      className="mt-2 bg-white/80 border-terracotta focus:border-curry h-12 text-base pr-10"
                      autoFocus
                    />
                    {codeIsValid && (
                      <CheckCircle2 className="absolute right-3 top-[50%] translate-y-[-50%] mt-1 h-5 w-5 text-green-600" />
                    )}
                  </div>
                  {codeIsValid && validateCode.name && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Valid code for group: {validateCode.name}
                    </p>
                  )}
                  {!codeIsValid && accessCode.trim().length > 5 && validateCode !== undefined && (
                    <p className="text-sm text-red-600 mt-2">
                      Invalid group code
                    </p>
                  )}
                  <p className="text-xs text-spice/70 mt-2">
                    Enter the code shared by your group admin
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !codeIsValid}
                  className="btn-curry w-full h-12 text-base font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Group"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create">
              <form onSubmit={handleCreateGroup} className="space-y-6">
                <div>
                  <Label htmlFor="groupName" className="text-spice text-base">
                    Group Name
                  </Label>
                  <Input
                    id="groupName"
                    type="text"
                    placeholder="Curry Connoisseurs"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    minLength={3}
                    maxLength={50}
                    className="mt-2 bg-white/80 border-terracotta focus:border-curry h-12 text-base"
                  />
                  <p className="text-xs text-spice/70 mt-2">
                    Choose a name for your curry rating group
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || groupName.length < 3}
                  className="btn-curry w-full h-12 text-base font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>

                <div className="bg-curry/10 border border-curry/20 rounded-lg p-4">
                  <p className="text-xs text-spice">
                    💡 After creating your group, you'll receive a unique access code to share with others.
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-xs text-spice/60">
              Groups allow you to rate and track curries with your friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
