
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { db } from "@/firebase/firebase-config";
import { getDocs, collection, query, where, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Copy, Trash2 } from "lucide-react"; // Added icons


interface HardWord {
  arabic: string;
  english: string;
  id: string;
  difficulty?: 'easy' | 'hard';
  uid?: string;
}

const HardWordsPage = () => {
  const [hardWords, setHardWords] = useState<HardWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const getWords = useCallback(async () => {
     if (!db || !user) {
        setIsLoading(false);
        return;
      }
    setIsLoading(true);
    const wordsCollectionRef = collection(db, "words");
    try {
      // Query for words belonging to the current user
      const q = query(
        wordsCollectionRef,
        where("uid", "==", user.uid),
      );
      const data = await getDocs(q);
      const allUserWords = data.docs.map((doc) => ({ ...(doc.data() as Omit<HardWord, 'id'>), id: doc.id }));
      // Filter for hard words client-side (difficulty is not 'easy')
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
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      getWords();
    } else if (!authLoading && !user) {
      setHardWords([]);
      setIsLoading(false);
    }
  }, [user, authLoading, getWords]);

  const handleCopyToClipboard = () => {
    const textToCopy = hardWords.map(word => `${word.english} : ${word.arabic}`).join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "تم نسخ الكلمات الصعبة إلى الحافظة!",
    });
  };

  const handleDeleteAllWords = async () => {
     if (!db || !user) return;
     setIsLoading(true);
    const wordsCollectionRef = collection(db, "words");

    try {
       // Fetch only the hard words again to be sure we have the latest list
       const q = query(
            wordsCollectionRef,
            where("uid", "==", user.uid),
             // We still need client-side filter as Firestore doesn't support !=
          );
       const data = await getDocs(q);
       const currentHardWords = data.docs
           .filter(docSnapshot => docSnapshot.data().difficulty !== 'easy')
           .map(docSnapshot => docSnapshot.id);


       const batch: Promise<void>[] = [];
       currentHardWords.forEach((docId) => {
         const docRef = doc(db, "words", docId);
         batch.push(deleteDoc(docRef));
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
        setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">جاري التحميل...</p>
      </div>
    );
  }

  if (!user) {
      return (
          <div className="text-center mt-10 px-4">
            <p className="text-muted-foreground">الرجاء تسجيل الدخول لعرض الكلمات الصعبة.</p>
             <Button onClick={() => router.push('/')} className="mt-4">العودة إلى الصفحة الرئيسية</Button>
          </div>
      );
  }


  return (
    <div className="container mx-auto py-10 px-4 pb-24"> {/* Increased padding-bottom */}
      <h1 className="text-3xl font-bold text-center mb-6 text-foreground">الكلمات الصعبة</h1>

      {hardWords.length > 0 ? (
        <div className="flex flex-col items-center">
          <Card className="glass-card p-6 w-full max-w-lg mx-auto mb-6 shadow-lg">
             <ul className="space-y-2 text-lg text-foreground">
              {hardWords.map((word) => (
                 <li key={word.id} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-b-0">
                   <span className="font-semibold">{word.english}</span>
                   <span className="text-muted-foreground">{word.arabic}</span>
                 </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:sm:space-x-reverse w-full max-w-lg mb-6">
             <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
               <Copy className="w-4 h-4 mr-2 rtl:ml-2"/>
              نسخ الكلمات
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllWords} className="w-full sm:w-auto" disabled={isLoading}>
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="w-4 h-4 mr-2 rtl:ml-2"/>}
              حذف الكل
            </Button>
          </div>

            {/* Buttons for navigation */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:sm:space-x-reverse w-full max-w-lg">
             <Button variant="secondary" onClick={() => router.push('/')} className="w-full sm:w-auto">
               <ArrowRight className="w-4 h-4 mr-2 rtl:ml-2"/> {/* Icon for going back */}
               العودة للإدخال
             </Button>
              {/* Assuming Review is on the main page, linking back to it */}
              <Button variant="default" onClick={() => router.push('/?tab=review')} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2"/> {/* Icon for going to review */}
                 المراجعة مرة أخرى
              </Button>
          </div>

        </div>
      ) : (
         <div className="text-center mt-10 flex flex-col items-center px-4">
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

