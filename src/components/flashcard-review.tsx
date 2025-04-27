
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
    // Cleanup timeout on unmount
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
    setIsDelaying(false); // Ensure delay is reset
    const nextIndex = currentWordIndex + 1;

    // Always update reviewed count if moving forward
    setReviewedCount(prev => {
      // Only increment if we haven't already counted this word
      return nextIndex > prev ? nextIndex : prev;
    });


    if (nextIndex >= words.length) {
       if (!reviewCompleted) {
           // Ensure count matches total before completing
           // setReviewedCount(prev => Math.max(prev, words.length)); // Redundant if logic above is correct
           handleReviewComplete(); // Call completion logic only when all words are done
       }
    } else {
      setCurrentWordIndex(nextIndex);
      setShowTranslation(false); // Hide translation for the next word
    }

 }, [currentWordIndex, words.length, reviewCompleted]); // Add handleReviewComplete dependency? Check logic


  // Trigger completion check after reviewedCount updates or when moving past the last word
  useEffect(() => {
    if (!isDelaying && !reviewCompleted && words.length > 0 && reviewedCount >= words.length) {
       handleReviewComplete();
    }
  }, [reviewedCount, words.length, reviewCompleted, isDelaying, handleReviewComplete]); // Added handleReviewComplete dependency


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
      // Don't increment reviewedCount here, handleNextWordLogic will do it
      handleNextWordLogic(); // Advance state
    }
  }, [currentWord, isDelaying, easyWordIds, onToggleHardWord, handleNextWordLogic]);


 const handleMarkHard = useCallback(() => {
    if (currentWord && !isDelaying) {
      setHardWordCount(prevCount => prevCount + 1);
      onToggleHardWord(currentWord.id, true);

      setShowTranslation(true); // Show translation
      setIsDelaying(true); // Start delay

      if (hardButtonTimeoutRef.current) {
          clearTimeout(hardButtonTimeoutRef.current); // Clear existing timeout if any
      }

      // Set timeout to advance after 3 seconds
      hardButtonTimeoutRef.current = setTimeout(() => {
        // Don't increment reviewedCount here, handleNextWordLogic will do it
        handleNextWordLogic(); // Advance state after delay
         hardButtonTimeoutRef.current = null; // Clear ref after execution
      }, 3000); // 3 seconds delay
    }
  }, [currentWord, isDelaying, onToggleHardWord, handleNextWordLogic]);


  const handleReviewComplete = useCallback(async () => {
    if (reviewCompleted || loading) return; // Prevent multiple calls or calls while loading
    console.log("Calling onReviewComplete with easy IDs:", easyWordIds);
    setReviewCompleted(true); // Mark as completed immediately
    await onReviewComplete(easyWordIds);
    // Navigation is now handled by the Finish Session button or automatically
    // Removed automatic navigation: router.push('/hard-words');
    toast({ title: "تمت مراجعة جميع الكلمات!" });
  }, [reviewCompleted, onReviewComplete, easyWordIds, loading, toast]); // Added loading and toast


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
         <Button onClick={() => router.push('/hard-words')}>
           عرض الكلمات الصعبة
        </Button>
      </div>
    );
  }


  if (!currentWord) {
     // This case might happen if words array becomes empty unexpectedly or index is out of bounds
     // Could also indicate initial loading state wasn't handled properly
     console.warn("Current word is null or undefined, but review is not completed.");
     return (
        <div className="text-center mt-10 text-destructive">
          حدث خطأ غير متوقع أثناء عرض الكلمة. حاول تحديث الصفحة أو إضافة كلمات جديدة.
        </div>
     );
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
          {/* Ensure currentWord is accessed safely */}
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
           onClick={handleReviewComplete} // Use the same completion handler
           className="w-full"
           disabled={isDelaying || reviewCompleted || loading} // Disable if delaying, already completed, or loading
         >
           {reviewCompleted ? 'اكتملت المراجعة' : (loading ? 'جاري...' : 'إنهاء الجلسة')}
         </Button>
      </div>
    </div>
  );
};

    