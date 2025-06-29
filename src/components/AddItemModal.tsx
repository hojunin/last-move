"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createActivityAndMove } from "@/lib/actions";
import { useMediaQuery } from "@/hooks/use-media-query";

// NOTE: 새 활동 생성 폼 스키마
const newActivitySchema = z.object({
  title: z
    .string()
    .min(1, "활동명을 입력해주세요")
    .max(100, "활동명은 100자 이하로 입력해주세요"),
  category: z
    .string()
    .max(50, "카테고리는 50자 이하로 입력해주세요")
    .optional(),
  description: z
    .string()
    .max(200, "설명은 200자 이하로 입력해주세요")
    .optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "custom"], {
    required_error: "반복 주기를 선택해주세요",
  }),
  customDays: z.number().min(1).max(365).optional(),
  customWeeks: z.number().min(1).max(52).optional(),
});

type NewActivityFormData = z.infer<typeof newActivitySchema>;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // NOTE: react-hook-form 설정
  const form = useForm<NewActivityFormData>({
    resolver: zodResolver(newActivitySchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      frequency: "daily",
      customDays: undefined,
      customWeeks: undefined,
    },
  });

  const watchedFrequency = form.watch("frequency");

  // NOTE: 새 활동 생성 및 첫 Move 기록
  const onSubmit = async (data: NewActivityFormData) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("category", data.category || "");
      formData.append("description", data.description || "");
      formData.append("frequency", data.frequency);

      if (data.frequency === "custom") {
        if (data.customDays) {
          formData.append("customDays", data.customDays.toString());
        }
        if (data.customWeeks) {
          formData.append("customWeeks", data.customWeeks.toString());
        }
      }

      const result = await createActivityAndMove(formData);
      if (result.success) {
        onClose();
        resetForm();
      } else {
        // NOTE: 중복 활동이나 기타 에러 처리
        alert(result.error || "활동 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to create activity:", error);
      alert("활동 생성 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: 폼 초기화
  const resetForm = () => {
    form.reset();
  };

  // NOTE: 모달 닫힐 때 폼 초기화
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // NOTE: 공통 컨텐츠 컴포넌트
  const ModalContent = ({ className }: { className?: string }) => (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 카테고리 */}
          <FormField
            control={form.control}
            name="category"
            render={({
              field,
            }: {
              field: ControllerRenderProps<NewActivityFormData, "category">;
            }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                <FormControl>
                  <Input placeholder="예: 건강, 학습, 생활, 취미" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 반복 주기 */}
          <FormField
            control={form.control}
            name="frequency"
            render={({
              field,
            }: {
              field: ControllerRenderProps<NewActivityFormData, "frequency">;
            }) => (
              <FormItem>
                <FormLabel>
                  반복 주기 <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="반복 주기를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">매일</SelectItem>
                    <SelectItem value="weekly">매주</SelectItem>
                    <SelectItem value="monthly">매월</SelectItem>
                    <SelectItem value="custom">사용자 정의</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 사용자 정의 주기 설정 */}
          {watchedFrequency === "custom" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700">
                사용자 정의 주기 설정
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customDays"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      NewActivityFormData,
                      "customDays"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>며칠마다</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="예: 3"
                          min="1"
                          max="365"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customWeeks"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      NewActivityFormData,
                      "customWeeks"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>몇 주마다</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="예: 2"
                          min="1"
                          max="52"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-gray-500">
                며칠마다 또는 몇 주마다 중 하나만 설정하세요.
              </p>
            </div>
          )}

          {/* 설명 */}
          <FormField
            control={form.control}
            name="description"
            render={({
              field,
            }: {
              field: ControllerRenderProps<NewActivityFormData, "description">;
            }) => (
              <FormItem>
                <FormLabel>설명</FormLabel>
                <FormControl>
                  <Input
                    placeholder="활동에 대한 간단한 설명 (선택사항)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              disabled={isLoading || !form.formState.isValid}
              className="flex-1"
            >
              {isLoading ? "생성 중..." : "활동 추가"}
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
            새로운 활동을 추가하고 반복 주기를 설정하세요
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
