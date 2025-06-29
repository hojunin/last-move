"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createActivityAndMove } from "@/lib/actions";
import { useMediaQuery } from "@/hooks/use-media-query";
import CategorySelect from "./CategorySelect";

// NOTE: 새 활동 생성 폼 스키마 (단순화)
const newActivitySchema = z.object({
  title: z
    .string()
    .min(1, "활동명을 입력해주세요")
    .max(100, "활동명은 100자 이하로 입력해주세요"),
  category_id: z.number({
    required_error: "카테고리를 선택해주세요",
  }),
});

type NewActivityFormData = z.infer<typeof newActivitySchema>;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const [isComposing, setIsComposing] = useState(false); // NOTE: 한글 입력 상태 관리
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // NOTE: react-hook-form 설정
  const form = useForm<NewActivityFormData>({
    resolver: zodResolver(newActivitySchema),
    defaultValues: {
      title: "",
      category_id: undefined,
    },
  });

  // NOTE: Server Action 상태 관리
  const [state, formAction] = useFormState(
    async (
      prevState: { success: boolean; error: string | null },
      formData: FormData
    ) => {
      try {
        await createActivityAndMove(formData);
        onClose();
        form.reset();
        return { success: true, error: null };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다";
        return { success: false, error: errorMessage };
      }
    },
    { success: false, error: null }
  );

  // NOTE: 폼 초기화
  const resetForm = () => {
    form.reset();
  };

  // NOTE: 모달 닫힐 때 폼 초기화
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // NOTE: 한글 입력 처리 함수들
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // NOTE: 공통 컨텐츠 컴포넌트
  const ModalContent = ({ className }: { className?: string }) => (
    <div className={className}>
      <Form {...form}>
        <form action={formAction} className="space-y-6">
          {/* 활동명 */}
          <FormField
            control={form.control}
            name="title"
            render={({
              field,
            }: {
              field: ControllerRenderProps<NewActivityFormData, "title">;
            }) => (
              <FormItem>
                <FormLabel>
                  활동명 <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="예: 운동하기, 책 읽기, 물 마시기"
                    autoFocus
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {/* Hidden input for form submission */}
                <input type="hidden" name="title" value={field.value} />
              </FormItem>
            )}
          />

          {/* 카테고리 */}
          <FormField
            control={form.control}
            name="category_id"
            render={({
              field,
            }: {
              field: ControllerRenderProps<NewActivityFormData, "category_id">;
            }) => (
              <FormItem>
                <FormLabel>
                  카테고리 <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <CategorySelect />
                </Select>
                <FormMessage />
                {/* Hidden input for form submission */}
                <input
                  type="hidden"
                  name="category_id"
                  value={field.value || ""}
                />
              </FormItem>
            )}
          />

          {/* 에러 메시지 표시 */}
          {state.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!form.formState.isValid || isComposing}
              className="flex-1"
            >
              활동 추가
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 활동 추가</DialogTitle>
          </DialogHeader>
          <ModalContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>새 활동 추가</DrawerTitle>
          <DrawerDescription>
            새로운 활동을 추가하고 바로 시작하세요
          </DrawerDescription>
        </DrawerHeader>
        <ModalContent className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">닫기</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
