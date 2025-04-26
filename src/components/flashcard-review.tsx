
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ArrowRight, Loader2 } from "lucide-react"; // Use ArrowRight for Previous Word in RTL
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";

interface Word {
  arabic: string;
  english: string;
  id: string;
  uid?: string;
  difficulty?: 'easy' | 'hard';
}


interface FlashcardReviewProps {
  words: Word[];
  onToggleHardWord: (wordId: string, isHard: boolean) => void;
  onReviewComplete: (easyWordIds: string[]) => void;
  loading: boolean;
}


export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ words, onToggleHardWord, onReviewComplete, loading }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [easyWordIds, setEasyWordIds] = useState<string[]>([]);
  const [hardWordCount, setHardWordCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [isDelaying, setIsDelaying] = useState(false);
  const hardButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading) {
        setCurrentWordIndex(0);
        setShowTranslation(false);
        setEasyWordIds([]);
        setHardWordCount(0);
        setReviewedCount(0);
        setReviewCompleted(false);
        setIsDelaying(false);
        if (hardButtonTimeoutRef.current) {
          clearTimeout(hardButtonTimeoutRef.current);
          hardButtonTimeoutRef.current = null;
        }
    }
    return () => {
        if (hardButtonTimeoutRef.current) {
            clearTimeout(hardButtonTimeoutRef.current);
        }
    };
  }, [words, loading]);


  const currentWord = words.length > 0 ? words[currentWordIndex] : null;

  const handlePreviousWord = useCallback(() => {
     if (words.length === 0 || currentWordIndex === 0 || isDelaying) return;
    setCurrentWordIndex((prevIndex) => prevIndex - 1);
    setShowTranslation(false);
     // Decrement reviewed count only if we are going back from a word that was marked
     // This logic might be complex, simpler to just track forward progress
     // setReviewedCount(prev => Math.max(0, prev - 1)); // Avoid negative counts
  }, [words.length, currentWordIndex, isDelaying]);


 const handleNextWordLogic = useCallback(() => {
    setIsDelaying(false);
    const nextIndex = currentWordIndex + 1;

    // Only update reviewed count if moving forward
    if (nextIndex > currentWordIndex) {
         // Check if we are moving past the last word
        if (nextIndex >= words.length) {
             if (!reviewCompleted) {
                 // Ensure count matches total before completing
                 setReviewedCount(prev => Math.max(prev, words.length));
                 handleReviewComplete(); // Call completion logic only when all words are done
             }
        } else {
            setCurrentWordIndex(nextIndex);
            setShowTranslation(false);
        }
    } else {
         // If somehow called without index increase (e.g., after delay), just end delay
         setIsDelaying(false);
         // Check completion status again in case delay finished on the last word
         if (currentWordIndex >= words.length - 1 && !reviewCompleted) {
             setReviewedCount(prev => Math.max(prev, words.length));
             handleReviewComplete();
         }
    }

 }, [currentWordIndex, words.length, reviewCompleted]); // Removed dependency on reviewedCount

  // Trigger completion check after reviewedCount updates or when moving past the last word
  useEffect(() => {
    if (!isDelaying && !reviewCompleted && words.length > 0 && reviewedCount >= words.length) {
       handleReviewComplete();
    }
  }, [reviewedCount, words.length, reviewCompleted, isDelaying]); // Add isDelaying


  const handleToggleTranslation = () => {
    if (isDelaying) return;
    setShowTranslation((prev) => !prev);
  };

 const handleMarkEasy = useCallback(() => {
    if (currentWord && !isDelaying) {
      if (!easyWordIds.includes(currentWord.id)) {
        setEasyWordIds(prev => [...prev, currentWord.id]);
      }
      onToggleHardWord(currentWord.id, false);
      setReviewedCount(prev => prev + 1); // Increment reviewed count immediately
      handleNextWordLogic(); // Advance state
    }
  }, [currentWord, isDelaying, easyWordIds, onToggleHardWord, handleNextWordLogic]);


 const handleMarkHard = useCallback(() => {
    if (currentWord && !isDelaying) {
      setHardWordCount(prevCount => prevCount + 1);
      onToggleHardWord(currentWord.id, true);

      setShowTranslation(true);
      setIsDelaying(true);

      if (hardButtonTimeoutRef.current) {
          clearTimeout(hardButtonTimeoutRef.current);
      }

      hardButtonTimeoutRef.current = setTimeout(() => {
        setReviewedCount(prev => prev + 1); // Increment reviewed count *after* delay
        handleNextWordLogic();
         hardButtonTimeoutRef.current = null;
      }, 3000);
    }
  }, [currentWord, isDelaying, onToggleHardWord, handleNextWordLogic]); // Added handleNextWordLogic

  const handleReviewComplete = useCallback(async () => {
    if (reviewCompleted) return;
    console.log("Calling onReviewComplete with easy IDs:", easyWordIds);
    setReviewCompleted(true);
    await onReviewComplete(easyWordIds);
    // Navigation is now handled by the Finish Session button or automatically
    router.push('/hard-words'); // Navigate to hard words page after completion
  }, [reviewCompleted, onReviewComplete, easyWordIds, router]); // Removed toast, added router


  const progress = words.length > 0 ? (reviewedCount / words.length) * 100 : 0;

   if (loading) {
     return (
       <div className="flex flex-col items-center justify-center h-64">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         <p className="mt-2 text-muted-foreground">جاري تحميل الكلمات...</p>
       </div>
     );
   }


  if (words.length === 0) {
    return <div className="text-center mt-10">لا توجد كلمات للمراجعة. الرجاء إضافة بعض الكلمات أولاً.</div>;
  }

  if (reviewCompleted) {
    return (
      <div className="flex flex-col items-center space-y-4 mt-10">
        <div className="text-center text-lg font-semibold">
          🎉 تمت مراجعة جميع الكلمات! 🎉
        </div>
        <p className="text-muted-foreground text-sm">جاري الانتقال إلى صفحة الكلمات الصعبة...</p>
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (!currentWord) {
    return <div className="text-center mt-10">جاري تحميل الكلمة...</div>;
  }


  return (
    <div className="flex flex-col items-center pb-20"> {/* Add padding-bottom */}

      <div className="mb-4 w-full max-w-md">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>التقدم:</span>
          <span>{reviewedCount} / {words.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
           <span>صعبة (الجلسة): {hardWordCount}</span>
           <span>سهلة (الجلسة): {easyWordIds.length}</span>
           <span>متبقي: {words.length - reviewedCount}</span>
        </div>
      </div>

        <Card className="glass-card p-6 w-full max-w-md mb-4 min-h-[12rem] flex flex-col justify-center items-center relative">
        <div className="text-4xl lg:text-5xl font-bold text-center mb-2 break-words w-full px-2">
          {currentWord?.english || '...'}
        </div>
        {showTranslation && (
          <div className="text-xl text-gray-400 text-center mt-2 break-words w-full px-2">
            {currentWord?.arabic || '...'}
          </div>
        )}
        {isDelaying && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                <Loader2 className="inline-block h-3 w-3 animate-spin mr-1"/>
                التالي بعد قليل...
            </div>
        )}
      </Card>


        <div className="flex justify-between items-center space-x-4 rtl:space-x-reverse mb-4 w-full max-w-md">
          {/* Left side buttons (Previous and Show/Hide) */}
          <div className="flex space-x-2 rtl:space-x-reverse">
             <Button onClick={handlePreviousWord} disabled={currentWordIndex === 0 || isDelaying} size="icon" variant="outline">
               <ArrowRight className="w-5 h-5" /> {/* Use ArrowRight for previous in RTL */}
               <span className="sr-only">الكلمة السابقة</span>
             </Button>
            <Button variant="secondary" onClick={handleToggleTranslation} disabled={isDelaying} className="px-4 py-3">
            {showTranslation ? "إخفاء" : "إظهار"}
            </Button>
        </div>

        {/* Right side buttons (Easy and Hard) - Centered */}
         <div className="flex justify-center space-x-2 rtl:space-x-reverse flex-1">
             {/* Hard Button (now on the right in RTL) */}
            <Button variant="destructive" onClick={handleMarkHard} disabled={isDelaying} className="px-6 py-3">
                <X className="w-5 h-5 mr-2 rtl:ml-2" />
                صعبة
            </Button>
             {/* Easy Button (now on the left in RTL) */}
             <Button variant="success" onClick={handleMarkEasy} disabled={isDelaying} className="px-6 py-3">
                 <Check className="w-5 h-5 mr-2 rtl:ml-2" />
                 سهلة
             </Button>
        </div>
      </div>

      {/* End Session Button */}
      <div className="mt-6 w-full max-w-md">
         <Button
           variant="outline"
           onClick={handleReviewComplete}
           className="w-full"
           disabled={isDelaying || reviewCompleted} // Also disable if already completed
         >
           {reviewCompleted ? 'اكتملت المراجعة' : 'إنهاء الجلسة'}
         </Button>
      </div>
    </div>
  );
};
