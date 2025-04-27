
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

  // Effect to reset state when loading finishes or the number of words changes
  useEffect(() => {
    // Only reset if not currently loading
    if (!loading) {
        // Reset internal component state
        setCurrentWordIndex(0);
        setShowTranslation(false);
        setEasyWordIds([]); // Keep track of words marked easy in this session
        setHardWordCount(0); // Keep track of words marked hard in this session
        setReviewedCount(0); // Track progress within the session
        setReviewCompleted(false); // Reset completion status
        setIsDelaying(false); // Reset delay status

        // Clear any pending timeout from marking a word as hard
        if (hardButtonTimeoutRef.current) {
          clearTimeout(hardButtonTimeoutRef.current);
          hardButtonTimeoutRef.current = null;
        }
    }

    // Cleanup timeout on unmount or when dependencies change again
    return () => {
        if (hardButtonTimeoutRef.current) {
            clearTimeout(hardButtonTimeoutRef.current);
        }
    };
    // Depend on loading status and the *number* of words.
    // This prevents resetting state just because the parent component re-rendered
    // and passed a new 'words' array reference with the same content.
  }, [loading, words.length]);


  const currentWord = words.length > 0 && currentWordIndex < words.length ? words[currentWordIndex] : null;

 const handleReviewComplete = useCallback(async () => {
    if (reviewCompleted || loading) return; // Prevent multiple calls or calls while loading
    console.log("Calling onReviewComplete with easy IDs:", easyWordIds);
    setReviewCompleted(true); // Mark as completed immediately
    await onReviewComplete(easyWordIds);
    // Navigation is now handled by the Finish Session button or automatically
    // router.push('/hard-words'); // Navigation is now handled by the parent component or the effect below
    toast({ title: "تمت مراجعة جميع الكلمات!" });
  }, [reviewCompleted, onReviewComplete, easyWordIds, loading, toast]); // Removed router dependency


  const handlePreviousWord = useCallback(() => {
     if (words.length === 0 || currentWordIndex === 0 || isDelaying) return;
    setCurrentWordIndex((prevIndex) => prevIndex - 1);
    setShowTranslation(false);
     // Decrement reviewed count only if we are going back from a word that was marked
     // Simpler to just track forward progress for completion. Previous button doesn't affect completion count.
     // setReviewedCount(prev => Math.max(0, prev - 1)); // Avoid negative counts
  }, [words.length, currentWordIndex, isDelaying]);


 const handleNextWordLogic = useCallback(() => {
    setIsDelaying(false); // Ensure delay is reset
    // Use functional update for reviewedCount to ensure it's based on the latest state
    setReviewedCount(prevReviewedCount => {
      const nextIndex = currentWordIndex + 1; // Calculate nextIndex based on current index *before* update
      const newReviewedCount = nextIndex > prevReviewedCount ? nextIndex : prevReviewedCount;

      // Move to next word or handle completion
      if (nextIndex >= words.length) {
         // Completion is now handled by useEffect based on reviewedCount
         console.log("Reached end of words in handleNextWordLogic");
         // Ensure the reviewed count reflects reaching the end if it hasn't already
         return Math.max(newReviewedCount, words.length);
      } else {
        setCurrentWordIndex(nextIndex); // Move to the next word
        setShowTranslation(false); // Hide translation for the new word
        return newReviewedCount; // Return the updated reviewed count
      }
    });


 }, [currentWordIndex, words.length]); // Dependencies


  // Trigger completion check after reviewedCount updates or when moving past the last word
  useEffect(() => {
    if (!isDelaying && !reviewCompleted && words.length > 0 && reviewedCount >= words.length) {
       // Use a small delay to ensure state updates related to the last word are processed
       const timer = setTimeout(() => {
           console.log("Attempting to call handleReviewComplete from useEffect");
           handleReviewComplete();
       }, 100); // Small delay (e.g., 100ms)
       return () => clearTimeout(timer); // Cleanup timer if dependencies change
    }
    // Depends on state variables, not the function itself to avoid potential loops if handleReviewComplete changes reference
  }, [reviewedCount, words.length, reviewCompleted, isDelaying, handleReviewComplete]); // Keep handleReviewComplete dependency


  const handleToggleTranslation = () => {
    if (isDelaying) return;
    setShowTranslation((prev) => !prev);
  };

 const handleMarkEasy = useCallback(() => {
    if (currentWord && !isDelaying) {
       console.log("Marking easy:", currentWord.english);
      if (!easyWordIds.includes(currentWord.id)) {
        setEasyWordIds(prev => [...prev, currentWord.id]);
      }
      onToggleHardWord(currentWord.id, false); // Mark as easy in Firestore
      handleNextWordLogic(); // Advance state
    }
  }, [currentWord, isDelaying, easyWordIds, onToggleHardWord, handleNextWordLogic]);


 const handleMarkHard = useCallback(() => {
    if (currentWord && !isDelaying) {
       console.log("Marking hard:", currentWord.english);
      // Optimistically update hard word count for the session
      setHardWordCount(prevCount => {
          // Ensure word is not already marked easy in this session before incrementing hard count
          if (!easyWordIds.includes(currentWord.id)) {
               // If word was previously marked hard in this session, don't increment again
               // This simple increment assumes first time marking hard in session
               return prevCount + 1;
          }
          return prevCount; // Keep count same if it was easy
      });
       // Remove from easy list if it was previously marked easy in this session
       setEasyWordIds(prev => prev.filter(id => id !== currentWord.id));

      onToggleHardWord(currentWord.id, true); // Mark as hard in Firestore

      setShowTranslation(true); // Show translation
      setIsDelaying(true); // Start delay

      if (hardButtonTimeoutRef.current) {
          clearTimeout(hardButtonTimeoutRef.current); // Clear existing timeout if any
      }

      // Set timeout to advance after 1.5 seconds
      hardButtonTimeoutRef.current = setTimeout(() => {
        handleNextWordLogic(); // Advance state after delay
         hardButtonTimeoutRef.current = null; // Clear ref after execution
      }, 1500); // 1500 milliseconds = 1.5 seconds
    }
  }, [currentWord, isDelaying, onToggleHardWord, handleNextWordLogic, easyWordIds]);


  const progress = words.length > 0 ? (reviewedCount / words.length) * 100 : 0;


  // ---- Session Completion on Unmount/Navigation ----
  const reviewCompletedRef = useRef(reviewCompleted);
  const easyWordIdsRef = useRef(easyWordIds);
  const wordsLengthRef = useRef(words.length);
  const onReviewCompleteRef = useRef(onReviewComplete);

  useEffect(() => {
      // Keep refs updated with the latest values
      reviewCompletedRef.current = reviewCompleted;
      easyWordIdsRef.current = easyWordIds;
      wordsLengthRef.current = words.length;
      onReviewCompleteRef.current = onReviewComplete;
  }); // Update refs on every render

  // Effect for handling component unmount (potential session end)
  useEffect(() => {
    // This function will be called when the component unmounts
    return () => {
      console.log("FlashcardReview unmounting. Checking session status.");
      // Use refs to get the latest values at the time of unmount
      if (
          !reviewCompletedRef.current && // Only run if not already completed
          wordsLengthRef.current > 0 &&   // Only run if there were words
          easyWordIdsRef.current.length > 0 // Only run if some words were marked easy
        ) {
        console.log("Unmounting and review not complete. Calling onReviewComplete for marked easy words:", easyWordIdsRef.current);
        // Call the completion handler with the easy words marked so far
        onReviewCompleteRef.current(easyWordIdsRef.current);
      }
    };
    // Empty dependency array ensures this cleanup runs only on unmount
  }, []);
  // ---- End Session Completion on Unmount/Navigation ----


   if (loading && !currentWord) {
     return (
       <div className="flex flex-col items-center justify-center h-64">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         <p className="mt-2 text-muted-foreground">جاري تحميل الكلمات...</p>
       </div>
     );
   }


  if (words.length === 0 && !loading) {
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


  if (!currentWord && !loading && words.length > 0) {
     // This case might happen if words array becomes empty unexpectedly or index is out of bounds
     // Could also indicate initial loading state wasn't handled properly or review completed unexpectedly.
     console.warn("Current word is null or undefined, but review is not completed. CurrentIndex:", currentWordIndex, "Words Length:", words.length);
     // If index is out of bounds but review isn't marked complete, try triggering completion check again.
      if (!reviewCompleted && currentWordIndex >= words.length) {
           handleReviewComplete(); // Attempt to finalize
           return (
                <div className="text-center mt-10 text-muted-foreground">
                  ... جاري إنهاء الجلسة
               </div>
           );
       }

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
          {/* Left side buttons (Previous and Show/Hide) - switched */}
           <div className="flex space-x-2 rtl:space-x-reverse">
             <Button onClick={handlePreviousWord} disabled={currentWordIndex === 0 || isDelaying} size="icon" variant="outline">
               <ArrowRight className="w-5 h-5" /> {/* Use ArrowRight for previous in RTL */}
               <span className="sr-only">الكلمة السابقة</span>
             </Button>
            <Button variant="secondary" onClick={handleToggleTranslation} disabled={isDelaying} className="px-4 py-3">
            {showTranslation ? "إخفاء" : "إظهار"}
            </Button>
          </div>

           {/* Right side buttons (Easy and Hard) - switched */}
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


    