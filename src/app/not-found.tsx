import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-9xl font-bold text-destructive">404</h1>
      <h2 className="text-3xl font-semibold text-foreground mt-4">
        عذراً! الصفحة غير موجودة.
      </h2>
      <p className="text-muted-foreground mt-2">
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          الذهاب إلى الصفحة الرئيسية
        </Link>
      </Button>
    </div>
  );
}
