"use server";

import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";
import { signIn } from "@/lib/auth";
import { z } from "zod";

// 회원가입 스키마
const signUpSchema = z
  .object({
    name: z.string().min(2, "이름은 2글자 이상이어야 합니다"),
    email: z.string().email("올바른 이메일 주소를 입력해주세요"),
    password: z.string().min(6, "비밀번호는 6자리 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

// 로그인 스키마
const signInSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export async function signUpAction(formData: FormData) {
  try {
    // 폼 데이터 검증
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validatedData = signUpSchema.parse(rawData);

    // 이메일 중복 확인
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${validatedData.email}
    `;

    if (existingUser.rows.length > 0) {
      return {
        error: "이미 가입된 이메일 주소입니다",
      };
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // 사용자 생성
    const result = await sql`
      INSERT INTO users (name, email, password_hash, email_verified, is_active)
      VALUES (${validatedData.name}, ${validatedData.email}, ${hashedPassword}, true, true)
      RETURNING id, email, name
    `;

    if (result.rows.length === 0) {
      return {
        error: "회원가입 중 오류가 발생했습니다",
      };
    }

    console.log("✅ 새 사용자 생성:", result.rows[0]);

    // 자동 로그인 (회원가입 후 바로 로그인 처리)
    try {
      await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirectTo: "/", // 성공 시 메인 페이지로 리다이렉트
      });

      // 이 코드는 실행되지 않음 (redirect 발생)
      return {
        success: true,
        user: result.rows[0],
      };
    } catch (error: unknown) {
      // signIn에서 redirect가 발생하면 NEXT_REDIRECT 에러가 throw됨
      // 이는 정상적인 동작이므로 다시 throw
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }

      console.error("자동 로그인 오류:", error);
      return {
        error:
          "회원가입은 완료되었지만 자동 로그인에 실패했습니다. 다시 로그인해주세요.",
      };
    }
  } catch (error) {
    // NEXT_REDIRECT 에러는 다시 throw (정상적인 리다이렉트)
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("회원가입 오류:", error);

    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0].message,
      };
    }

    return {
      error: "회원가입 중 오류가 발생했습니다",
    };
  }
}

export async function signInAction(formData: FormData) {
  try {
    // 폼 데이터 검증
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const validatedData = signInSchema.parse(rawData);

    // 사용자 존재 확인
    const userResult = await sql`
      SELECT id, email, password_hash, name, is_active
      FROM users 
      WHERE email = ${validatedData.email}
    `;

    if (userResult.rows.length === 0) {
      return {
        error: "등록되지 않은 이메일 주소입니다",
      };
    }

    const user = userResult.rows[0];

    // 계정 비활성화 확인
    if (!user.is_active) {
      return {
        error: "비활성화된 계정입니다. 관리자에게 문의하세요",
      };
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return {
        error: "비밀번호가 올바르지 않습니다",
      };
    }

    // NextAuth signIn 호출 (redirect를 서버에서 처리)
    try {
      await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirectTo: "/", // 성공 시 메인 페이지로 리다이렉트
      });

      // 이 코드는 실행되지 않음 (redirect 발생)
      return {
        success: true,
      };
    } catch (error: unknown) {
      // signIn에서 redirect가 발생하면 NEXT_REDIRECT 에러가 throw됨
      // 이는 정상적인 동작이므로 다시 throw
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }

      console.error("NextAuth signIn 오류:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "로그인 처리 중 오류가 발생했습니다",
      };
    }
  } catch (error) {
    // NEXT_REDIRECT 에러는 다시 throw (정상적인 리다이렉트)
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("로그인 오류:", error);

    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0].message,
      };
    }

    return {
      error: "로그인 중 오류가 발생했습니다",
    };
  }
}
