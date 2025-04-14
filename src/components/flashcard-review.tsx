"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, X } from "lucide-react";

interface FlashcardReviewProps {
  words: { arabic: string; translation: string }[];
  hardWords: Set<string>;
  onToggleHardWord: (word: string, isHard: boolean) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ words, hardWords, onToggleHardWord }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();

  const currentWord = words[currentWordIndex];

  const handleNextWord = useCallback(() => {
    setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    setShowTranslation(false);
  }, [words.length]);

  useEffect(() => {
    if (words.length === 0) {
      toast({
        title: "الرجاء إضافة بعض الكلمات أولاً.",
      });
    }
  }, [words, toast]);

  const handleToggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  const handleMarkEasy = () => {
    if (currentWord) {
      onToggleHardWord(currentWord.arabic, false);
      handleNextWord();
    }
  };

  const handleMarkHard = () => {
    if (currentWord) {
      onToggleHardWord(currentWord.arabic, true);
      handleNextWord();
    }
  };

  const handleCopyToClipboard = () => {
    const hardWordsArray = Array.from(hardWords);
    navigator.clipboard.writeText(hardWordsArray.join("\n"));
    toast({
      title: "تم نسخ الكلمات الصعبة إلى الحافظة!",
    });
  };

  if (words.length === 0) {
    return <div className="text-center">الرجاء إضافة بعض الكلمات أولاً.</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <Card className="glass-card p-6 w-full max-w-md mb-4">
        <div className="text-4xl font-bold text-center mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {currentWord?.arabic}
        </div>
        {showTranslation && (
          <div className="text-gray-500 text-center">
            {currentWord?.translation}
          </div>
        )}
      </Card>

      <div className="flex justify-center space-x-4 mb-4">
        <Button variant="secondary" onClick={handleToggleTranslation}>
          {showTranslation ? "إخفاء الترجمة" : "إظهار الترجمة"}
        </Button>
        <Button onClick={handleNextWord}>كلمة التالية</Button>
      </div>

      <div className="flex justify-center space-x-4">
        <Button variant="success" onClick={handleMarkEasy}>
          <Check className="w-4 h-4 ml-2" />
          سهلة
        </Button>
        <Button variant="destructive" onClick={handleMarkHard}>
          <X className="w-4 h-4 ml-2" />
          صعبة
        </Button>
      </div>

      <div className="mt-4">
        <Button variant="outline" onClick={handleCopyToClipboard}>
          <Copy className="w-4 h-4 ml-2" />
          نسخ الكلمات الصعبة
        </Button>
      </div>
    </div>
  );
};
