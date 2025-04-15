"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";

interface HardWord {
  arabic: string;
  translation: string;
}

const HardWordsPage = () => {
  const [hardWords, setHardWords] = useState<HardWord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Retrieve hard words from localStorage on component mount
    const storedHardWords = localStorage.getItem('hardWords');
    if (storedHardWords) {
      setHardWords(JSON.parse(storedHardWords));
    }
  }, []);

  const handleCopyToClipboard = () => {
    const textToCopy = hardWords.map(word => `${word.arabic}: ${word.translation}`).join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "تم نسخ الكلمات الصعبة إلى الحافظة!",
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">الكلمات الصعبة</h1>

      {hardWords.length > 0 ? (
        <>
          <Card className="glass-card p-6 w-full max-w-md mx-auto mb-4">
            <ul className="list-disc list-inside">
              {hardWords.map((word, index) => (
                <li key={index}>
                  {word.arabic} : {word.translation}
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleCopyToClipboard}>
              نسخ الكلمات الصعبة
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center">لا توجد كلمات صعبة مخزنة حتى الآن.</div>
      )}
    </div>
  );
};

export default HardWordsPage;
