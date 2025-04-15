"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";

interface FlashcardReviewProps {
  words: { arabic: string; translation: string, id?: string }[];
  onToggleHardWord: (word: string, isHard: boolean) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ words, onToggleHardWord }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [easyWords, setEasyWords] = useState<string[]>([]); // Store easy words
  const [hardWordCount, setHardWordCount] = useState(0);
  const [reviewCompleted, setReviewCompleted] = useState(false); // Track if review is completed
  const [allWordsCount, setAllWordsCount] = useState(0);

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
  }, [words, toast, router]);

  const handleToggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  const handleMarkEasy = () => {
    if (currentWord) {
      setEasyWords(prev => [...prev, currentWord.translation]); // Add to easy words list
      setAllWordsCount(prevCount => prevCount + 1);
      handleNextWord();
    }
  };

  const handleMarkHard = () => {
    if (currentWord) {
      setHardWordCount(prevCount => prevCount + 1);
      setAllWordsCount(prevCount => prevCount + 1);
      onToggleHardWord(currentWord.translation, true);
      handleNextWord();
    }
  };

  const handleReviewComplete = () => {
    // Delete all words marked as easy
    easyWords.forEach(word => {
      onToggleHardWord(word, false);
    });
    setReviewCompleted(true);
    // Navigate to hard words page
    // router.push('/hard-words');
  };

  useEffect(() => {
    if (allWordsCount >= words.length && words.length > 0) {
      handleReviewComplete();
    }
  }, [allWordsCount, words.length, handleReviewComplete]);

  const progress = words.length > 0 ? ((currentWordIndex + 1) / words.length) * 100 : 0;

  if (words.length === 0) {
    return <div className="text-center">الرجاء إضافة بعض الكلمات أولاً.</div>;
  }

  if (reviewCompleted) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-center text-lg mb-4">
          تمت مراجعة جميع الكلمات!
        </div>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => {
            // Delete all words marked as easy
            easyWords.forEach(word => {
              onToggleHardWord(word, false);
            });
            setCurrentWordIndex(0);
            setReviewCompleted(false);
            setAllWordsCount(0);
            router.push('/')
          }}>
            العودة إلى صفحة الإدخال
          </Button>
          <Button variant="secondary" onClick={() => {
            // Delete all words marked as easy
            easyWords.forEach(word => {
              onToggleHardWord(word, false);
            });
            setCurrentWordIndex(0);
            setReviewCompleted(false);
            setAllWordsCount(0);
          }}>
            المراجعة مرة أخرى
          </Button>
          <Button variant="secondary" onClick={() => router.push('/hard-words')}>
            الذهاب إلى الكلمات الصعبة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">

      <div className="mb-4 w-full max-w-md">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>التقدم:</span>
          <span>{currentWordIndex + 1} / {words.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>الكلمات الصعبة:</span>
          <span>{hardWordCount}</span>
          <span>الكلمات التي تمت مراجعتها:</span>
          <span>{allWordsCount}</span>
        </div>
      </div>

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
