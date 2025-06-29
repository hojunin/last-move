"use client";

import { useState } from "react";
import { Plus, Bell, User, LogOut } from "lucide-react";
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

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface GlobalNavClientProps {
  user: User | null;
}

export default function GlobalNavClient({ user }: GlobalNavClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  async function handleSignOut() {
    // 서버 액션을 통한 로그아웃
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signout";
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">LastMove</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                console.log("Plus button clicked, opening modal");
                setIsAddModalOpen(true);
              }}
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

            {/* 사용자 정보 및 설정 시트 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="사용자 설정">
                  <User className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>사용자 설정</SheetTitle>
                  <SheetDescription>
                    계정 정보 및 설정을 관리하세요.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {user && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-sm text-gray-600">
                        로그인 정보
                      </h3>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
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
