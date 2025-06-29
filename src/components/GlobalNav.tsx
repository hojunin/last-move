"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddItemModal from "./AddItemModal";

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
