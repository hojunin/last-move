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

    // 자동 로그인
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return {
      success: true,
      user: result.rows[0],
    };
  } catch (error) {
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

    // NextAuth signIn 호출
    const result = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result?.error) {
      return {
        error: "이메일 또는 비밀번호가 올바르지 않습니다",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
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
