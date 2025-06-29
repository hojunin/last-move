"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInAction } from "@/lib/auth-actions";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);

    try {
      const result = await signInAction(formData);

      // 에러가 있는 경우에만 처리 (성공 시에는 서버에서 리다이렉트됨)
      if (result?.error) {
        toast.error("로그인 실패", {
          description: result.error,
        });
      }
    } catch (error) {
      // NEXT_REDIRECT 에러는 정상적인 리다이렉트이므로 무시
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        return;
      }

      console.error("로그인 처리 오류:", error);
      toast.error("로그인 오류", {
        description: "로그인 중 예상치 못한 오류가 발생했습니다",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </div>
          LastMove
        </Link>
        <Card className="overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">로그인</CardTitle>
            <CardDescription>
              계정에 로그인하여 습관 관리를 계속하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  이메일
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  비밀번호
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="text-center text-sm">
              계정이 없으신가요?{" "}
              <Link
                href="/auth/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                회원가입
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
