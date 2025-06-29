"use client";

import { useState } from "react";
import { Plus, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AddItemModal from "@/components/AddItemModal";
import NotificationPermission from "@/components/NotificationPermission";

export default function GlobalNav() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">LastMove</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsAddModalOpen(true)}
              aria-label="새 아이템 추가"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* 알림 설정 시트 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="알림 설정">
                  <Bell className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>알림 설정</SheetTitle>
                  <SheetDescription>
                    활동 리마인더와 축하 메시지 설정을 관리하세요.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <NotificationPermission />
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" aria-label="설정">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}
