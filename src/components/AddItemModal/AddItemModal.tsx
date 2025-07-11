'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { createActivity } from '@/lib/actions';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';
import AddItemForm from './AddItemForm';
import type { AddItemModalProps, NewActivityFormData } from './types';

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // NOTE: 폼 제출 상태 관리
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: NewActivityFormData) => {
    setError(null);

    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('title', data.title);
          formData.append('category_id', data.category_id.toString());
          formData.append('frequency_type', data.frequency_type);
          formData.append('frequency_value', data.frequency_value.toString());
          formData.append('frequency_unit', data.frequency_unit);

          const result = await createActivity(formData);

          if (!result.success) {
            throw new Error(result.error);
          }

          toast.success('활동이 추가되었습니다!');
          onClose();
          resolve();
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : '알 수 없는 오류가 발생했습니다';
          setError(errorMessage);
          reject(error);
        }
      });
    });
  };

  // NOTE: 공통 폼 컴포넌트
  const FormComponent = () => (
    <AddItemForm
      onSubmit={handleSubmit}
      onCancel={onClose}
      isLoading={isPending}
      error={error}
    />
  );

  if (isDesktop) {
    console.log('Rendering Dialog for desktop');
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold">
              새 활동 추가
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <FormComponent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="px-4 pb-4">
        <DrawerHeader className="text-left px-0 pb-6">
          <DrawerTitle className="text-xl font-semibold">
            새 활동 추가
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            새로운 활동을 추가하고 바로 시작하세요
          </DrawerDescription>
        </DrawerHeader>
        <FormComponent />
      </DrawerContent>
    </Drawer>
  );
}
