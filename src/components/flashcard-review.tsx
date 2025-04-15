"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { useRouter } from 'next/navigation';

interface FlashcardReviewProps {
  words: { arabic: string; translation: string, id?: string }[];
  onToggleHardWord: (word: string, isHard: boolean) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ words, onToggleHardWord }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const currentWord = words[currentWordIndex];

  const handlePreviousWord = useCallback(() => {
    setCurrentWordIndex((prevIndex) => {
      const newIndex = (prevIndex - 1 + words.length) % words.length;
      return newIndex;
    });
    setShowTranslation(false);
  }, [words, words.length]);

  const handleNextWord = useCallback(() => {
    if (words.length === 0) return;

    setCurrentWordIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % words.length;
      return newIndex;
    });
    setShowTranslation(false);
  }, [words, words.length]);


  useEffect(() => {
    if (words.length === 0) {
      toast({
        title: "الرجاء إضافة بعض الكلمات أولاً.",
      });
    }
    // If all words are reviewed, redirect to hard words page
    if (words.length > 0 && currentWordIndex >= words.length) {
      router.push('/hard-words');
    }
  }, [words, toast, currentWordIndex, router]);

  const handleToggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  const handleMarkEasy = () => {
    if (currentWord) {
      onToggleHardWord(currentWord.translation, false);
      handleNextWord();
    }
  };

  const handleMarkHard = () => {
    if (currentWord) {
      onToggleHardWord(currentWord.translation, true);
      handleNextWord();
    }
  };

  const handleReviewComplete = () => {
    // Navigate to hard words page
    router.push('/hard-words');
  };

  if (words.length === 0) {
    return <div className="text-center">الرجاء إضافة بعض الكلمات أولاً.</div>;
  }

  if (currentWordIndex >= words.length) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-center text-lg mb-4">
          تمت مراجعة جميع الكلمات!
        </div>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => { setCurrentWordIndex(0); router.push('/') }}>
            العودة إلى صفحة الإدخال
          </Button>
          <Button variant="secondary" onClick={() => { setCurrentWordIndex(0); }}>
            المراجعة مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <Card className="glass-card p-6 w-full max-w-md mb-4">
        <div className="text-4xl font-bold text-center mb-2">
          {currentWord?.translation}
        </div>
        {showTranslation && (
          <div className="text-gray-500 text-center">
            {currentWord?.arabic}
          </div>
        )}
      </Card>

      <div className="flex justify-center space-x-4 mb-4">
        <Button variant="secondary" onClick={handleToggleTranslation}>
          {showTranslation ? "إخفاء الكلمة العربية" : "إظهار الكلمة العربية"}
        </Button>
        <Button onClick={handlePreviousWord}>الكلمة السابقة</Button>
      </div>

      <div className="flex justify-center space-x-4">
        <Button variant="destructive" onClick={handleMarkHard}>
          <X className="w-4 h-4 ml-2" />
          صعبة
        </Button>
        <Button variant="success" onClick={handleMarkEasy}>
          <Check className="w-4 h-4 ml-2" />
          سهلة
        </Button>
      </div>


    </div>
  );
};

