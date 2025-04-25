"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";

interface Word {
  arabic: string;
  english: string;
  translation: string;
  id: string; // ID is mandatory here
  uid?: string;
  difficulty?: 'easy' | 'hard'; // Optional difficulty marker
}


interface FlashcardReviewProps {
  words: Word[]; // Expect words with IDs
  onToggleHardWord: (wordId: string, isHard: boolean) => void;
  onReviewComplete: (easyWordIds: string[]) => void; // Callback when review finishes
}


export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ words, onToggleHardWord, onReviewComplete }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [easyWordIds, setEasyWordIds] = useState<string[]>([]); // Store IDs of easy words
  const [hardWordCount, setHardWordCount] = useState(0); // Count hard words marked in this session
  const [reviewedCount, setReviewedCount] = useState(0); // Count total words reviewed in this session
  const [reviewCompleted, setReviewCompleted] = useState(false); // Track if review is completed


  // Reset state when words change (e.g., user logs out/in, words are added/deleted)
  useEffect(() => {
    setCurrentWordIndex(0);
    setShowTranslation(false);
    setEasyWordIds([]);
    setHardWordCount(0);
    setReviewedCount(0);
    setReviewCompleted(false);
  }, [words]);


  // Get the current word based on the index
  const currentWord = words.length > 0 ? words[currentWordIndex] : null;

  const handlePreviousWord = useCallback(() => {
     if (words.length === 0) return;
    setCurrentWordIndex((prevIndex) => (prevIndex - 1 + words.length) % words.length);
    setShowTranslation(false);
     setReviewedCount(prev => prev > 0 ? prev -1 : 0); // Decrement reviewed count cautiously
  }, [words.length]);


 const handleNextWord = useCallback(() => {
    if (words.length === 0) return;

    const nextIndex = currentWordIndex + 1;

    if (nextIndex >= words.length) {
      // Last word reviewed, trigger completion
      if (!reviewCompleted) { // Prevent multiple triggers
         setReviewedCount(words.length); // Ensure count matches total
         handleReviewComplete();
      }
    } else {
       setCurrentWordIndex(nextIndex);
       setShowTranslation(false);
       // Increment reviewed count only if moving forward after a mark
       // The marking functions handle incrementing reviewedCount
    }
  }, [words.length, currentWordIndex, reviewCompleted]);


  useEffect(() => {
    if (words.length > 0 && words.length === reviewedCount && !reviewCompleted) {
       handleReviewComplete();
    }
  }, [reviewedCount, words.length, reviewCompleted]);


  const handleToggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

 const handleMarkEasy = () => {
    if (currentWord) {
      if (!easyWordIds.includes(currentWord.id)) {
        setEasyWordIds(prev => [...prev, currentWord.id]);
      }
      onToggleHardWord(currentWord.id, false); // Mark as easy (for potential deletion later)
      setReviewedCount(prev => prev + 1); // Increment reviewed count
      handleNextWord(); // Move to the next word
    }
  };


 const handleMarkHard = () => {
    if (currentWord) {
      setHardWordCount(prevCount => prevCount + 1);
      onToggleHardWord(currentWord.id, true); // Mark as hard
      setReviewedCount(prev => prev + 1); // Increment reviewed count
      handleNextWord(); // Move to the next word
    }
  };

  const handleReviewComplete = () => {
    console.log("Calling onReviewComplete with easy IDs:", easyWordIds);
    onReviewComplete(easyWordIds);
    setReviewCompleted(true);
    // Do not automatically navigate
    // router.push('/hard-words');
     toast({ title: "تمت مراجعة جميع الكلمات!" });
  };


  const progress = words.length > 0 ? (reviewedCount / words.length) * 100 : 0;

  if (loading && !currentWord) {
    return <div className="text-center">تحميل الكلمات...</div>;
  }


  if (words.length === 0 && !loading) {
    return <div className="text-center">لا توجد كلمات للمراجعة. الرجاء إضافة بعض الكلمات أولاً.</div>;
  }

  if (reviewCompleted) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center text-lg">
          تمت مراجعة جميع الكلمات!
        </div>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => {
            // Reset state for a new review session if needed, or navigate
            setCurrentWordIndex(0);
            setReviewedCount(0);
            setHardWordCount(0);
            setEasyWordIds([]);
            setReviewCompleted(false);
            // Optionally navigate back or provide other options
          }}>
            المراجعة مرة أخرى
          </Button>
          <Button variant="secondary" onClick={() => router.push('/hard-words')}>
             الذهاب إلى الكلمات الصعبة
          </Button>
          {/* Consider adding a button to go back to the add words tab */}
        </div>
      </div>
    );
  }


   // Added loading state check
  if (!currentWord) {
     // This case should ideally be covered by the loading or empty state checks
     // but added as a safeguard.
    return <div className="text-center">جاري تحميل الكلمة...</div>;
  }


  return (
    <div className="flex flex-col items-center">

      <div className="mb-4 w-full max-w-md">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>التقدم:</span>
          <span>{reviewedCount} / {words.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>الكلمات الصعبة (الجلسة الحالية):</span>
          <span>{hardWordCount}</span>
          <span>الكلمات التي تمت مراجعتها:</span>
          <span>{reviewedCount}</span>
        </div>
      </div>

      <Card className="glass-card p-6 w-full max-w-md mb-4 min-h-[10rem] flex flex-col justify-center">
         {/* Display English word */}
        <div className="text-4xl font-bold text-center mb-2">
          {currentWord?.english || '...'} {/* Show English word */}
        </div>
        {showTranslation && (
           // Display Arabic translation when shown
          <div className="text-gray-500 text-center mt-2">
            {currentWord?.arabic || '...'} {/* Show Arabic translation */}
          </div>
        )}
      </Card>


      <div className="flex justify-center space-x-4 rtl:space-x-reverse mb-4 w-full max-w-md">
         {/* Left side buttons (Previous and Show/Hide) */}
         <div className="flex space-x-2 rtl:space-x-reverse">
            <Button onClick={handlePreviousWord} disabled={currentWordIndex === 0 && reviewedCount <=1}>الكلمة السابقة</Button>
            <Button variant="secondary" onClick={handleToggleTranslation}>
            {showTranslation ? "إخفاء الترجمة" : "إظهار الترجمة"}
            </Button>
        </div>

         {/* Right side buttons (Easy and Hard) */}
         <div className="flex space-x-2 rtl:space-x-reverse">
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
    </div>
  );
};
