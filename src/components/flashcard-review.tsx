"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface FlashcardReviewProps {
  words: { arabic: string; translation: string, id?: string }[];
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ words }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();
  const [hardWords, setHardWords] = useState<Set<string>>(new Set());


  useEffect(() => {
    // Load hard words from local storage on initial render
    const storedHardWords = localStorage.getItem('hardWords');
    if (storedHardWords) {
      setHardWords(new Set(JSON.parse(storedHardWords)));
    }
  }, []);

  useEffect(() => {
    // Update local storage whenever hardWords changes
    localStorage.setItem('hardWords', JSON.stringify(Array.from(hardWords)));
  }, [hardWords]);


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
      setHardWords(prevHardWords => {
        const newHardWords = new Set(prevHardWords);
        newHardWords.delete(currentWord.arabic);
        return newHardWords;
      });
      handleNextWord();
    }
  };

  const handleMarkHard = () => {
    if (currentWord) {
      setHardWords(prevHardWords => {
        const newHardWords = new Set(prevHardWords);
        newHardWords.add(currentWord.arabic);
        return newHardWords;
      });
      handleNextWord();
    }
  };

  if (words.length === 0) {
    return <div className="text-center">الرجاء إضافة بعض الكلمات أولاً.</div>;
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


    </div>
  );
};
