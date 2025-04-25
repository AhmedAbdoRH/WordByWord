"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { db } from "@/firebase/firebase-config";
import { getDocs, collection, query, where, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from 'next/navigation'; // Import useRouter
import { Loader2 } from "lucide-react"; // Import Loader2


interface HardWord {
  arabic: string;
  english: string; // Changed from translation to english
  id: string;
  difficulty?: 'easy' | 'hard'; // Include difficulty
  uid?: string; // Include uid
}

const HardWordsPage = () => {
  const [hardWords, setHardWords] = useState<HardWord[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter(); // Initialize router

  const getWords = useCallback(async () => {
     if (!db || !user) {
        setIsLoading(false);
        return;
      }
    setIsLoading(true);
    const wordsCollectionRef = collection(db, "words");
    try {
      // Query for words marked as 'hard' or words without a 'difficulty' field (treat as hard by default)
      // belonging to the current user
      const q = query(
        wordsCollectionRef,
        where("uid", "==", user.uid),
        // We filter client-side because Firestore doesn't support '!=' or 'not-in' on the same field as another range/equality filter
        // where("difficulty", "!=", "easy") // This won't work with the uid filter
      );
      const data = await getDocs(q);
      const allUserWords = data.docs.map((doc) => ({ ...(doc.data() as Omit<HardWord, 'id'>), id: doc.id }));
      // Filter for hard words client-side
      const hardUserWords = allUserWords.filter(word => word.difficulty !== 'easy');
      setHardWords(hardUserWords);
    } catch (error) {
      console.error("Error fetching hard words:", error);
      toast({
          title: "فشل تحميل الكلمات الصعبة",
          variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]); // Removed db from dependency list

  useEffect(() => {
    // Fetch words only when auth is not loading and user is available
    if (!authLoading && user) {
      getWords();
    } else if (!authLoading && !user) {
      // If auth is done and there's no user, clear words and stop loading
      setHardWords([]);
      setIsLoading(false);
    }
    // No dependency on getWords to avoid potential infinite loops if getWords changes frequently
  }, [user, authLoading, getWords]); // Add getWords here

  const handleCopyToClipboard = () => {
    // Format as "English : Arabic"
    const textToCopy = hardWords.map(word => `${word.english} : ${word.arabic}`).join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "تم نسخ الكلمات الصعبة إلى الحافظة!",
    });
  };

  const handleDeleteAllWords = async () => {
     if (!db || !user) return;
     setIsLoading(true); // Indicate loading during deletion
    const wordsCollectionRef = collection(db, "words");

    try {
      // Query for all 'hard' words belonging to the user to delete them
       const q = query(
            wordsCollectionRef,
            where("uid", "==", user.uid)
            // No need to filter by difficulty here, we fetch based on the list we have
          );
       const data = await getDocs(q);
       const hardWordIdsToDelete = hardWords.map(hw => hw.id); // Get IDs from the current state

       const batch = [];
       data.docs.forEach((docSnapshot) => {
         // Only delete if the document ID is in our list of hard words
         if (hardWordIdsToDelete.includes(docSnapshot.id)) {
             const docRef = doc(db, "words", docSnapshot.id);
             batch.push(deleteDoc(docRef));
         }
       });


      await Promise.all(batch);

      setHardWords([]); // Clear the local state
      toast({
        title: "تم حذف جميع الكلمات الصعبة!",
      });
    } catch (error) {
      console.error("Error deleting all hard words:", error);
      toast({
        title: "فشل حذف جميع الكلمات الصعبة.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false); // Stop loading indicator
    }
  };

  if (authLoading || isLoading) { // Show loading indicator if either auth or data is loading
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">جاري التحميل...</p>
      </div>
    );
  }

  if (!user) {
      return (
          <div className="text-center mt-10">
            الرجاء تسجيل الدخول لعرض الكلمات الصعبة.
             <Button onClick={() => router.push('/')} className="mt-4">العودة إلى الصفحة الرئيسية</Button>
          </div>
      );
  }


  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-6 text-foreground">الكلمات الصعبة</h1>

      {hardWords.length > 0 ? (
        <div className="flex flex-col items-center">
          <Card className="glass-card p-6 w-full max-w-lg mx-auto mb-6 shadow-lg">
             {/* Use a more structured list or table for better readability */}
             <ul className="space-y-2 text-lg text-foreground">
              {hardWords.map((word) => (
                 <li key={word.id} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-b-0">
                   <span className="font-semibold">{word.english}</span>
                   <span className="text-muted-foreground">{word.arabic}</span>
                 </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:sm:space-x-reverse w-full max-w-lg">
             <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-4 h-4 mr-2 rtl:ml-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              نسخ الكلمات
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllWords} className="w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 w-4 h-4 mr-2 rtl:ml-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              حذف الكل
            </Button>
              <Button variant="secondary" onClick={() => router.push('/')} className="w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-4 h-4 mr-2 rtl:ml-2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
               العودة للإدخال
            </Button>
          </div>
        </div>
      ) : (
         <div className="text-center mt-10 flex flex-col items-center">
          <p className="text-muted-foreground text-lg">لا توجد كلمات صعبة مخزنة حتى الآن.</p>
          <Button onClick={() => router.push('/')} className="mt-6">
             الذهاب لصفحة الإدخال
          </Button>
        </div>
      )}
    </div>
  );
};

export default HardWordsPage;
