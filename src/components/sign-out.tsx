"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

export const SignOut = () => {
  const { signOutUser } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast({
        title: "تم تسجيل الخروج بنجاح!",
      });
    } catch (error: any) {
      toast({
        title: "فشل تسجيل الخروج.",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleSignOut} variant="outline">
      تسجيل الخروج
    </Button>
  );
};
