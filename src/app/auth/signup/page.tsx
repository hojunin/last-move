"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { signUpAction } from "@/lib/auth-actions";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);

    try {
      const result = await signUpAction(formData);

      if (result.error) {
        toast.error("회원가입 실패", {
          description: result.error,
        });
      } else if (result.success) {
        toast.success("회원가입 완료! 🎉", {
          description:
            "LastMove에 오신 것을 환영합니다! 잠시 후 메인 페이지로 이동합니다.",
        });

        // 약간의 지연 후 리다이렉트 (toast 메시지를 볼 수 있도록)
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      console.error("회원가입 처리 오류:", error);
      toast.error("회원가입 오류", {
        description: "회원가입 중 예상치 못한 오류가 발생했습니다",
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
            <CardTitle className="text-xl">계정 만들기</CardTitle>
            <CardDescription>
              새로운 습관을 시작하기 위해 계정을 만들어보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  이름
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  required
                  disabled={isLoading}
                />
              </div>
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
              <div className="grid gap-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "계정 생성 중..." : "계정 만들기"}
              </Button>
            </form>

            <div className="text-center text-sm">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/auth/signin"
                className="underline underline-offset-4 hover:text-primary"
              >
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
